import {
  createContext,
  useEffect,
  type PropsWithChildren,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { initialDemoState, type DemoState } from '../data/demo';
import { activePhase } from '../domain/schedule';
import { calculatePriority } from '../domain/priority';
import { resolveServiceAssignment } from '../domain/routing';
import { policyForPriority, slaDeadlines } from '../domain/sla';
import { firebaseIsConfigured, getFirebaseServices } from '../services/firebase';
import { loadFirestoreState, persistFirestoreChanges, seedFirestoreState, subscribeFirestoreState, type FirebaseScope } from '../services/firestoreState';
import type {
  Event,
  Exhibitor,
  FurnitureItem,
  Company,
  ImportRow,
  OperationalPhase,
  OperationalWindow,
  Person,
  ServiceAssignment,
  ServiceCategoryId,
  SlaPolicy,
  Ticket,
  UserRole,
} from '../domain/types';

const STORAGE_KEY = 'caex-digital-demo-v2';

function loadState(): DemoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as DemoState) : structuredClone(initialDemoState);
  } catch {
    return structuredClone(initialDemoState);
  }
}

interface CreateTicketInput {
  exhibitorId: string;
  category: ServiceCategoryId;
  description: string;
  actorRole: UserRole;
  origin: Ticket['origin'];
  safetyRisk: boolean;
  standBlocked: boolean;
  affectsOperation: boolean;
  createdBy: string;
  attachments?: string[];
}

export interface ExhibitorInput {
  name: string;
  contactName: string;
  contactEmail: string;
  stand: string;
  pavilion: string;
  areaSqm: number;
  internalTier: Exhibitor['internalTier'];
  projectUrl?: string;
  memorialUrl?: string;
  furniture: FurnitureItem[];
}

export interface ResponsibilityInput {
  category: ServiceCategoryId;
  providerId: string;
  contractStatus: ServiceAssignment['contractStatus'];
  primaryProducerId?: string;
  secondaryProducerId?: string;
  providerServiceId?: string;
}

export interface ProviderInput {
  name: string;
  specialties: ServiceCategoryId[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface PersonInput {
  companyId: string;
  name: string;
  role: UserRole;
  title: string;
  email: string;
  phone?: string;
  avatarColor?: string;
}

interface AppContextValue extends DemoState {
  dataMode: 'demo' | 'firebase';
  syncStatus: 'local' | 'signed_out' | 'loading' | 'synced' | 'saving' | 'error';
  syncError?: string;
  phase: ReturnType<typeof activePhase>;
  createTicket(input: CreateTicketInput): { ticket?: Ticket; error?: string };
  updateTicketStatus(ticketId: string, status: Ticket['status']): void;
  reclassifyTicket(ticketId: string, category: ServiceCategoryId): void;
  addTicketUpdate(ticketId: string, actorName: string, note: string): void;
  reopenTicket(ticketId: string, actorName: string, note: string): void;
  assignTicketProducer(ticketId: string, producerId: string, actorName: string): void;
  interceptTicket(ticketId: string, actorName: string): void;
  addExhibitor(input: ExhibitorInput): Exhibitor;
  updateExhibitor(exhibitorId: string, input: ExhibitorInput): void;
  replaceResponsibilities(exhibitorId: string, phase: OperationalPhase, inputs: ResponsibilityInput[]): void;
  addProvider(input: ProviderInput): Company;
  updateProvider(providerId: string, input: ProviderInput): void;
  addPerson(input: PersonInput): Person;
  updatePerson(personId: string, patch: Partial<Person>): void;
  setProviderCoverage(providerId: string, primaryProducerId: string, secondaryProducerId?: string, providerServiceId?: string): void;
  updateEvent(event: Event): void;
  updateWindows(windows: OperationalWindow[]): void;
  updateSlaPolicies(policies: SlaPolicy[]): void;
  toggleAvailability(personId: string): void;
  importExhibitors(rows: ImportRow[]): number;
  resetDemo(): void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DemoState>(loadState);
  const firebaseMode = import.meta.env.VITE_DATA_MODE === 'firebase' && firebaseIsConfigured();
  const [syncStatus, setSyncStatus] = useState<AppContextValue['syncStatus']>(firebaseMode ? 'loading' : 'local');
  const [syncError, setSyncError] = useState('');
  const scopeRef = useRef<FirebaseScope | null>(null);
  const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!firebaseMode) return;
    const services = getFirebaseServices();
    if (!services) return;
    let unsubscribeState: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(services.auth, (user) => {
      unsubscribeState?.();
      if (!user) {
        scopeRef.current = null;
        setSyncStatus('signed_out');
        return;
      }
      setSyncStatus('loading');
      setSyncError('');
      void getIdTokenResult(user, true).then(async (token) => {
        const scope = {
          tenantId: String(token.claims.tenantId ?? initialDemoState.event.tenantId),
          eventId: String(token.claims.eventId ?? initialDemoState.event.id),
        };
        scopeRef.current = scope;
        let remote = await loadFirestoreState(services.firestore, scope);
        const role = String(token.claims.role ?? '');
        if (!remote && ['platform_admin', 'organizer_admin', 'event_manager'].includes(role)) {
          await seedFirestoreState(services.firestore, initialDemoState);
          remote = await loadFirestoreState(services.firestore, scope);
        }
        if (!remote) throw new Error('O evento ainda não possui dados no Firestore.');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        setState(remote);
        setSyncStatus('synced');
        unsubscribeState = subscribeFirestoreState(services.firestore, scope, (next) => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setState(next);
          setSyncStatus('synced');
          setSyncError('');
        }, (error) => {
          setSyncStatus('error');
          setSyncError(error.message);
        });
      }).catch((error: unknown) => {
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Não foi possível sincronizar com o Firebase.');
      });
    });
    return () => { unsubscribeAuth(); unsubscribeState?.(); };
  }, [firebaseMode]);

  const persist = (updater: (current: DemoState) => DemoState) => {
    setState((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const services = firebaseMode ? getFirebaseServices() : null;
      const scope = scopeRef.current;
      if (services && scope) {
        setSyncStatus('saving');
        writeQueueRef.current = writeQueueRef.current
          .then(() => persistFirestoreChanges(services.firestore, scope, current, next))
          .then(() => { setSyncStatus('synced'); setSyncError(''); })
          .catch((error: unknown) => {
            setSyncStatus('error');
            setSyncError(error instanceof Error ? error.message : 'Falha ao salvar no Firebase.');
          });
      }
      return next;
    });
  };

  const phase = activePhase(state.event.windows, state.now);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      dataMode: firebaseMode ? 'firebase' : 'demo',
      syncStatus,
      syncError: syncError || undefined,
      phase,
      createTicket(input) {
        const exhibitor = state.exhibitors.find((item) => item.id === input.exhibitorId);
        if (!exhibitor) return { error: 'Expositor não encontrado.' };
        const routing = resolveServiceAssignment(
          state.assignments,
          exhibitor.id,
          input.category,
          phase,
          input.actorRole,
        );
        if (!routing.available || !routing.assignment) return { error: routing.reason };
        if (!phase) return { error: 'Não há período operacional ativo.' };

        const decision = calculatePriority({
          category: input.category,
          safetyRisk: input.safetyRisk,
          standBlocked: input.standBlocked,
          affectsOperation: input.affectsOperation,
          phase,
          exhibitorTier: exhibitor.internalTier,
        });
        const policy = policyForPriority(state.slaPolicies, decision.priority);
        const deadlines = slaDeadlines(state.now, policy);
        const ticket: Ticket = {
          id: `CH-${7500 + state.tickets.length}`,
          eventId: state.event.id,
          exhibitorId: exhibitor.id,
          reportedCategory: input.category,
          description: input.description,
          status: 'open',
          priority: decision.priority,
          priorityScore: decision.score,
          priorityReasons: decision.reasons,
          origin: input.origin,
          providerId: routing.assignment.providerId,
          assignedProducerId: routing.assignment.primaryProducerId,
          assignedServiceId: routing.assignment.providerServiceId,
          createdAt: state.now,
          ...deadlines,
          reopens: 0,
          photos: input.attachments,
          timeline: [
            {
              id: crypto.randomUUID(),
              at: state.now,
              action: 'Chamado aberto',
              actorName: input.createdBy,
            },
          ],
        };
        persist((current) => ({ ...current, tickets: [ticket, ...current.tickets] }));
        return { ticket };
      },
      updateTicketStatus(ticketId, status) {
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) => {
            if (ticket.id !== ticketId) return ticket;
            const now = current.now;
            return {
              ...ticket,
              status,
              acceptedAt:
                status === 'accepted' && !ticket.acceptedAt ? now : ticket.acceptedAt,
              startedAt:
                status === 'in_progress' && !ticket.startedAt ? now : ticket.startedAt,
              resolvedAt:
                status === 'awaiting_validation' || status === 'resolved'
                  ? now
                  : ticket.resolvedAt,
              timeline: [
                ...ticket.timeline,
                {
                  id: crypto.randomUUID(),
                  at: now,
                  action: status === 'accepted'
                    ? 'Chamado aceito'
                    : status === 'in_progress'
                      ? 'Atendimento iniciado'
                      : status === 'awaiting_validation'
                        ? 'Solução enviada para validação'
                        : status === 'resolved'
                          ? 'Chamado validado e encerrado'
                          : 'Status atualizado',
                  actorName: 'Usuário de demonstração',
                },
              ],
            };
          }),
        }));
      },
      reclassifyTicket(ticketId, category) {
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  resolvedCategory: category,
                  timeline: [
                    ...ticket.timeline,
                    {
                      id: crypto.randomUUID(),
                      at: current.now,
                      action: 'Causa real reclassificada',
                      actorName: 'Usuário de demonstração',
                    },
                  ],
                }
              : ticket,
          ),
        }));
      },
      addTicketUpdate(ticketId, actorName, note) {
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) => ticket.id === ticketId ? {
            ...ticket,
            timeline: [...ticket.timeline, {
              id: crypto.randomUUID(),
              at: current.now,
              action: 'Atualização adicionada',
              actorName,
              note,
            }],
          } : ticket),
        }));
      },
      reopenTicket(ticketId, actorName, note) {
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) => ticket.id === ticketId ? {
            ...ticket,
            status: 'reopened_triage',
            reopens: ticket.reopens + 1,
            timeline: [...ticket.timeline, {
              id: crypto.randomUUID(),
              at: current.now,
              action: 'Chamado reaberto para triagem da organizadora',
              actorName,
              note,
            }],
          } : ticket),
        }));
      },
      assignTicketProducer(ticketId, producerId, actorName) {
        const producer = state.people.find((person) => person.id === producerId);
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) => ticket.id === ticketId ? {
            ...ticket,
            assignedProducerId: producerId,
            timeline: [...ticket.timeline, {
              id: crypto.randomUUID(),
              at: current.now,
              action: `Chamado transferido para ${producer?.name ?? 'outro produtor'}`,
              actorName,
            }],
          } : ticket),
        }));
      },
      interceptTicket(ticketId, actorName) {
        persist((current) => ({
          ...current,
          tickets: current.tickets.map((ticket) => ticket.id === ticketId ? {
            ...ticket,
            providerId: 'nexo-eventos',
            assignedProducerId: 'rafael-lima',
            assignedServiceId: 'julia-costa',
            status: 'in_progress',
            timeline: [...ticket.timeline, {
              id: crypto.randomUUID(),
              at: current.now,
              action: 'Responsabilidade assumida pela organizadora',
              actorName,
            }],
          } : ticket),
        }));
      },
      addExhibitor(input) {
        const id = `${input.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const exhibitor: Exhibitor = {
          id,
          eventId: state.event.id,
          companyId: `exhibitor-company-${id}`,
          ...input,
        };
        persist((current) => ({ ...current, exhibitors: [...current.exhibitors, exhibitor] }));
        return exhibitor;
      },
      updateExhibitor(exhibitorId, input) {
        persist((current) => ({
          ...current,
          exhibitors: current.exhibitors.map((exhibitor) => exhibitor.id === exhibitorId ? { ...exhibitor, ...input } : exhibitor),
        }));
      },
      replaceResponsibilities(exhibitorId, operationalPhase, inputs) {
        persist((current) => {
          const retained = current.assignments.map((assignment) => assignment.exhibitorId === exhibitorId && assignment.phases.includes(operationalPhase)
            ? { ...assignment, phases: assignment.phases.filter((item) => item !== operationalPhase) }
            : assignment).filter((assignment) => assignment.phases.length > 0);
          const replacements: ServiceAssignment[] = inputs.filter((input) => input.providerId).map((input) => ({
            id: `${exhibitorId}-${input.category}-${operationalPhase}-${Date.now()}`,
            eventId: current.event.id,
            exhibitorId,
            category: input.category,
            phases: [operationalPhase],
            providerId: input.providerId,
            contractStatus: input.contractStatus,
            primaryProducerId: input.primaryProducerId,
            secondaryProducerId: input.secondaryProducerId,
            providerServiceId: input.providerServiceId,
          }));
          return { ...current, assignments: [...retained, ...replacements] };
        });
      },
      addProvider(input) {
        const id = `${input.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const company: Company = { id, tenantId: state.event.tenantId, type: 'provider', ...input };
        persist((current) => ({ ...current, companies: [...current.companies, company] }));
        return company;
      },
      updateProvider(providerId, input) {
        persist((current) => ({ ...current, companies: current.companies.map((company) => company.id === providerId ? { ...company, ...input } : company) }));
      },
      addPerson(input) {
        const initials = input.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
        const person = { id: `person-${Date.now()}`, initials, avatarColor: input.avatarColor ?? '#5f50d5', active: true, available: false, ...input };
        persist((current) => ({ ...current, people: [...current.people, person] }));
        return person;
      },
      updatePerson(personId, patch) {
        persist((current) => ({ ...current, people: current.people.map((person) => person.id === personId ? { ...person, ...patch } : person) }));
      },
      setProviderCoverage(providerId, primaryProducerId, secondaryProducerId, providerServiceId) {
        persist((current) => ({
          ...current,
          assignments: current.assignments.map((assignment) => assignment.providerId === providerId ? { ...assignment, primaryProducerId, secondaryProducerId, providerServiceId } : assignment),
        }));
      },
      updateEvent(event) {
        persist((current) => ({ ...current, event }));
      },
      updateWindows(windows) {
        persist((current) => ({ ...current, event: { ...current.event, windows } }));
      },
      updateSlaPolicies(policies) {
        persist((current) => ({ ...current, slaPolicies: policies }));
      },
      toggleAvailability(personId) {
        persist((current) => ({
          ...current,
          people: current.people.map((person) =>
            person.id === personId ? { ...person, available: !person.available } : person,
          ),
        }));
      },
      importExhibitors(rows) {
        const newExhibitors = rows.map((row, index) => ({
          id: `${row.exhibitorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${index}`,
          eventId: state.event.id,
          companyId: `exhibitor-company-${Date.now()}-${index}`,
          name: row.exhibitorName,
          contactName: row.responsibleName,
          contactEmail: row.responsibleEmail,
          stand: row.stand,
          pavilion: row.pavilion,
          areaSqm: row.areaSqm,
          internalTier: row.tier,
          projectUrl: row.projectUrl,
          memorialUrl: row.memorialUrl,
          furniture: row.furniture,
        }));
        persist((current) => ({
          ...current,
          exhibitors: [...current.exhibitors, ...newExhibitors],
        }));
        return newExhibitors.length;
      },
      resetDemo() {
        const reset = structuredClone(initialDemoState);
        persist(() => reset);
      },
    }),
    [state, phase, firebaseMode, syncStatus, syncError],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider.');
  return context;
}
