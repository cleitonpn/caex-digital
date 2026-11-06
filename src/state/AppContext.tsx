import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { initialDemoState, type DemoState } from '../data/demo';
import { activePhase } from '../domain/schedule';
import { calculatePriority } from '../domain/priority';
import { resolveServiceAssignment } from '../domain/routing';
import { policyForPriority, slaDeadlines } from '../domain/sla';
import type {
  Event,
  ImportRow,
  OperationalWindow,
  ServiceCategoryId,
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
}

interface AppContextValue extends DemoState {
  phase: ReturnType<typeof activePhase>;
  createTicket(input: CreateTicketInput): { ticket?: Ticket; error?: string };
  updateTicketStatus(ticketId: string, status: Ticket['status']): void;
  reclassifyTicket(ticketId: string, category: ServiceCategoryId): void;
  updateEvent(event: Event): void;
  updateWindows(windows: OperationalWindow[]): void;
  toggleAvailability(personId: string): void;
  importExhibitors(rows: ImportRow[]): number;
  resetDemo(): void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DemoState>(loadState);

  const persist = (updater: (current: DemoState) => DemoState) => {
    setState((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const phase = activePhase(state.event.windows, state.now);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
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
      updateEvent(event) {
        persist((current) => ({ ...current, event }));
      },
      updateWindows(windows) {
        persist((current) => ({ ...current, event: { ...current.event, windows } }));
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
        }));
        persist((current) => ({
          ...current,
          exhibitors: [...current.exhibitors, ...newExhibitors],
        }));
        return newExhibitors.length;
      },
      resetDemo() {
        const reset = structuredClone(initialDemoState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        setState(reset);
      },
    }),
    [state, phase],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider.');
  return context;
}
