import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { DemoState } from '../data/demo';
import type { Company, Event, Exhibitor, Person, ServiceAssignment, SlaPolicy, Ticket } from '../domain/types';

export interface FirebaseScope {
  tenantId: string;
  eventId: string;
}

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function paths(firestore: Firestore, scope: FirebaseScope) {
  const tenant = doc(firestore, 'tenants', scope.tenantId);
  const event = doc(tenant, 'events', scope.eventId);
  return {
    tenant,
    event,
    companies: collection(tenant, 'companies'),
    people: collection(tenant, 'people'),
    exhibitors: collection(event, 'exhibitors'),
    assignments: collection(event, 'assignments'),
    tickets: collection(event, 'tickets'),
    config: doc(event, 'runtime', 'config'),
  };
}

function records<T extends { id: string }>(snapshot: { docs: Array<{ id: string; data(): DocumentData }> }) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function loadFirestoreState(firestore: Firestore, scope: FirebaseScope): Promise<DemoState | null> {
  const refs = paths(firestore, scope);
  const [event, companies, people, exhibitors, assignments, tickets, config] = await Promise.all([
    getDoc(refs.event),
    getDocs(refs.companies),
    getDocs(refs.people),
    getDocs(refs.exhibitors),
    getDocs(refs.assignments),
    getDocs(refs.tickets),
    getDoc(refs.config),
  ]);
  if (!event.exists()) return null;
  const runtime = config.data() ?? {};
  return {
    event: { id: event.id, ...event.data() } as Event,
    companies: records<Company>(companies),
    people: records<Person>(people),
    exhibitors: records<Exhibitor>(exhibitors),
    assignments: records<ServiceAssignment>(assignments),
    tickets: records<Ticket>(tickets),
    slaPolicies: (runtime.slaPolicies ?? []) as SlaPolicy[],
    now: typeof runtime.now === 'string' ? runtime.now : new Date().toISOString(),
  };
}

export function subscribeFirestoreState(
  firestore: Firestore,
  scope: FirebaseScope,
  onChange: (state: DemoState) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const refs = paths(firestore, scope);
  let stopped = false;
  let current: DemoState | null = null;
  const unsubscribers: Unsubscribe[] = [];
  const fail = (error: Error) => { if (!stopped) onError(error); };
  const emit = () => { if (!stopped && current) onChange(clean(current)); };

  void loadFirestoreState(firestore, scope).then((loaded) => {
    if (stopped || !loaded) return;
    current = loaded;
    emit();
    unsubscribers.push(
      onSnapshot(refs.event, (snapshot) => {
        if (snapshot.exists() && current) { current.event = { id: snapshot.id, ...snapshot.data() } as Event; emit(); }
      }, fail),
      onSnapshot(refs.companies, (snapshot) => { if (current) { current.companies = records<Company>(snapshot); emit(); } }, fail),
      onSnapshot(refs.people, (snapshot) => { if (current) { current.people = records<Person>(snapshot); emit(); } }, fail),
      onSnapshot(refs.exhibitors, (snapshot) => { if (current) { current.exhibitors = records<Exhibitor>(snapshot); emit(); } }, fail),
      onSnapshot(refs.assignments, (snapshot) => { if (current) { current.assignments = records<ServiceAssignment>(snapshot); emit(); } }, fail),
      onSnapshot(refs.tickets, (snapshot) => { if (current) { current.tickets = records<Ticket>(snapshot); emit(); } }, fail),
      onSnapshot(refs.config, (snapshot) => {
        if (current && snapshot.exists()) {
          const data = snapshot.data();
          current.slaPolicies = (data.slaPolicies ?? []) as SlaPolicy[];
          current.now = typeof data.now === 'string' ? data.now : current.now;
          emit();
        }
      }, fail),
    );
  }).catch(fail);

  return () => { stopped = true; unsubscribers.forEach((unsubscribe) => unsubscribe()); };
}

async function syncCollection<T extends { id: string }>(
  firestore: Firestore,
  path: string,
  before: T[],
  after: T[],
) {
  const previous = new Map(before.map((item) => [item.id, item]));
  const next = new Map(after.map((item) => [item.id, item]));
  const writes: Array<() => Promise<void>> = [];
  for (const [id, value] of next) {
    if (!same(previous.get(id), value)) writes.push(() => setDoc(doc(firestore, path, id), clean(value)));
  }
  for (const id of previous.keys()) {
    if (!next.has(id)) writes.push(() => deleteDoc(doc(firestore, path, id)));
  }
  await Promise.all(writes.map((write) => write()));
}

export async function persistFirestoreChanges(
  firestore: Firestore,
  scope: FirebaseScope,
  before: DemoState,
  after: DemoState,
) {
  const base = `tenants/${scope.tenantId}`;
  const eventBase = `${base}/events/${scope.eventId}`;
  const operations: Promise<unknown>[] = [];
  if (!same(before.event, after.event)) operations.push(setDoc(doc(firestore, eventBase), clean(after.event)));
  if (!same(before.slaPolicies, after.slaPolicies) || before.now !== after.now) {
    operations.push(setDoc(doc(firestore, `${eventBase}/runtime/config`), clean({ slaPolicies: after.slaPolicies, now: after.now })));
  }
  operations.push(
    syncCollection(firestore, `${base}/companies`, before.companies, after.companies),
    syncCollection(firestore, `${base}/people`, before.people, after.people),
    syncCollection(firestore, `${eventBase}/exhibitors`, before.exhibitors, after.exhibitors),
    syncCollection(firestore, `${eventBase}/assignments`, before.assignments, after.assignments),
    syncCollection(firestore, `${eventBase}/tickets`, before.tickets, after.tickets),
  );
  await Promise.all(operations);
}

export async function seedFirestoreState(firestore: Firestore, state: DemoState) {
  const scope = { tenantId: state.event.tenantId, eventId: state.event.id };
  const refs = paths(firestore, scope);
  const batch = writeBatch(firestore);
  batch.set(refs.tenant, { name: state.companies.find((company) => company.type === 'organizer')?.name ?? state.event.tenantId, active: true }, { merge: true });
  batch.set(refs.event, clean(state.event));
  batch.set(refs.config, clean({ slaPolicies: state.slaPolicies, now: state.now }));
  state.companies.forEach((item) => batch.set(doc(refs.companies, item.id), clean(item)));
  state.people.forEach((item) => batch.set(doc(refs.people, item.id), clean(item)));
  state.exhibitors.forEach((item) => batch.set(doc(refs.exhibitors, item.id), clean(item)));
  state.assignments.forEach((item) => batch.set(doc(refs.assignments, item.id), clean(item)));
  state.tickets.forEach((item) => batch.set(doc(refs.tickets, item.id), clean(item)));
  await batch.commit();
}
