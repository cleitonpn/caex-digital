import { collection, doc, onSnapshot, setDoc, type Firestore, type Unsubscribe } from 'firebase/firestore';

export type PlatformTenantStatus = 'Operando' | 'Ativo' | 'Implantação' | 'Onboarding' | 'Suspenso';
export type PlatformTenantPlan = 'Piloto' | 'Professional' | 'Enterprise';

export interface PlatformTenant {
  id: string;
  name: string;
  events: number;
  users: number;
  exhibitors: number;
  plan: PlatformTenantPlan;
  status: PlatformTenantStatus;
  color: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlatformTenantInput = Pick<PlatformTenant, 'name' | 'plan' | 'status' | 'color' | 'contactName' | 'contactEmail' | 'contactPhone'>;

export const initialPlatformTenants: PlatformTenant[] = [
  { id: 'nexo-eventos', name: 'Nexo Eventos', events: 4, users: 38, exhibitors: 527, plan: 'Enterprise', status: 'Operando', color: '#4431bd', contactName: 'Ana Ribeiro', contactEmail: 'ana@nexoeventos.example', createdAt: '2026-08-10T12:00:00.000Z', updatedAt: '2026-11-08T12:00:00.000Z' },
  { id: 'orbita-feiras', name: 'Órbita Feiras', events: 2, users: 21, exhibitors: 184, plan: 'Professional', status: 'Implantação', color: '#0f766e', contactName: 'Marcelo Nunes', contactEmail: 'marcelo@orbitafeiras.example', createdAt: '2026-10-02T12:00:00.000Z', updatedAt: '2026-11-07T12:00:00.000Z' },
  { id: 'vertice-live', name: 'Vértice Live', events: 1, users: 12, exhibitors: 96, plan: 'Professional', status: 'Ativo', color: '#b45309', contactName: 'Paula Freitas', contactEmail: 'paula@verticelive.example', createdAt: '2026-09-18T12:00:00.000Z', updatedAt: '2026-11-05T12:00:00.000Z' },
  { id: 'atlas-congressos', name: 'Atlas Congressos', events: 0, users: 5, exhibitors: 0, plan: 'Piloto', status: 'Onboarding', color: '#a64d79', contactName: 'Diego Martins', contactEmail: 'diego@atlascongressos.example', createdAt: '2026-11-01T12:00:00.000Z', updatedAt: '2026-11-08T12:00:00.000Z' },
];

const slug = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function subscribePlatformTenants(firestore: Firestore, onChange: (items: PlatformTenant[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(collection(firestore, 'platformTenants'), (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PlatformTenant).sort((left, right) => left.name.localeCompare(right.name));
    onChange(items);
  }, onError);
}

export async function seedPlatformTenants(firestore: Firestore) {
  await Promise.all(initialPlatformTenants.map((tenant) => setDoc(doc(firestore, 'platformTenants', tenant.id), tenant, { merge: true })));
}

export async function createPlatformTenant(firestore: Firestore, input: PlatformTenantInput): Promise<PlatformTenant> {
  const now = new Date().toISOString();
  const id = `${slug(input.name)}-${Date.now().toString(36)}`;
  const tenant: PlatformTenant = { id, events: 0, users: 0, exhibitors: 0, createdAt: now, updatedAt: now, ...input };
  await setDoc(doc(firestore, 'platformTenants', id), tenant);
  return tenant;
}

export async function updatePlatformTenant(firestore: Firestore, tenant: PlatformTenant, input: PlatformTenantInput): Promise<PlatformTenant> {
  const updated = { ...tenant, ...input, updatedAt: new Date().toISOString() };
  await setDoc(doc(firestore, 'platformTenants', tenant.id), updated, { merge: true });
  return updated;
}
