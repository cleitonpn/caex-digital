export type OperationalPhase = 'setup' | 'event' | 'teardown';
export type UserRole =
  | 'platform_admin'
  | 'organizer_admin'
  | 'event_manager'
  | 'organizer_producer'
  | 'organizer_service'
  | 'provider_admin'
  | 'provider_service'
  | 'provider_producer'
  | 'exhibitor_admin'
  | 'exhibitor_member';

export type ServiceCategoryId =
  | 'carpentry'
  | 'electrical'
  | 'upholstery'
  | 'visual_communication'
  | 'cleaning'
  | 'furniture'
  | 'landscaping'
  | 'av'
  | 'ab';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TicketStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'waiting'
  | 'awaiting_validation'
  | 'resolved'
  | 'reopened_triage'
  | 'blocked_by_provider'
  | 'closed_not_performed';

export interface OperationalWindow {
  id: string;
  phase: OperationalPhase;
  startsAt: string;
  endsAt: string;
}

export interface EventBrand {
  name: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
}

export interface Event {
  id: string;
  tenantId: string;
  name: string;
  venue: string;
  timezone: string;
  brand: EventBrand;
  windows: OperationalWindow[];
}

export interface Person {
  id: string;
  companyId: string;
  name: string;
  role: UserRole;
  title: string;
  initials: string;
  avatarColor: string;
  email: string;
  phone?: string;
  active: boolean;
  available: boolean;
}

export type CompanyType = 'organizer' | 'provider' | 'exhibitor';

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  type: CompanyType;
  specialties?: ServiceCategoryId[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Exhibitor {
  id: string;
  eventId: string;
  companyId: string;
  name: string;
  contactName: string;
  contactEmail: string;
  stand: string;
  pavilion: string;
  areaSqm: number;
  internalTier: 'AAA' | 'AA' | 'A' | 'B' | 'C';
  projectUrl?: string;
  memorialUrl?: string;
  furniture?: FurnitureItem[];
}

export interface FurnitureItem {
  type: string;
  quantity: number;
}

export type ContractStatus = 'included' | 'contracted' | 'not_contracted';

export interface ServiceAssignment {
  id: string;
  eventId: string;
  exhibitorId: string;
  category: ServiceCategoryId;
  phases: OperationalPhase[];
  providerId: string;
  contractStatus: ContractStatus;
  primaryProducerId?: string;
  secondaryProducerId?: string;
  providerServiceId?: string;
}

export interface TicketTimelineEntry {
  id: string;
  at: string;
  action: string;
  actorName: string;
  note?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  exhibitorId: string;
  reportedCategory: ServiceCategoryId;
  resolvedCategory?: ServiceCategoryId;
  description: string;
  status: TicketStatus;
  priority: Priority;
  priorityScore: number;
  priorityReasons: string[];
  origin: 'organizer' | 'exhibitor' | 'provider';
  providerId: string;
  assignedProducerId?: string;
  assignedServiceId?: string;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
  acceptDueAt: string;
  resolveDueAt: string;
  escalatedAt?: string;
  reopens: number;
  photos?: string[];
  timeline: TicketTimelineEntry[];
}

export interface SlaPolicy {
  id: string;
  priority: Priority;
  phase?: OperationalPhase;
  category?: ServiceCategoryId;
  acceptMinutes: number;
  resolveMinutes: number;
  escalationAfterMinutes: number;
}

export interface ImportRow {
  exhibitorName: string;
  responsibleName: string;
  responsibleEmail: string;
  stand: string;
  pavilion: string;
  areaSqm: number;
  tier: Exhibitor['internalTier'];
  projectUrl?: string;
  memorialUrl?: string;
  furniture: FurnitureItem[];
}
