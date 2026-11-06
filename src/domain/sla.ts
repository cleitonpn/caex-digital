import type { Priority, SlaPolicy } from './types';

export interface SlaState {
  acceptDueAt: string;
  resolveDueAt: string;
  acceptRemainingMinutes: number;
  resolveRemainingMinutes: number;
  acceptBreached: boolean;
  resolveBreached: boolean;
  shouldEscalate: boolean;
}

export function slaDeadlines(createdAt: string, policy: SlaPolicy) {
  const created = new Date(createdAt).getTime();
  return {
    acceptDueAt: new Date(created + policy.acceptMinutes * 60_000).toISOString(),
    resolveDueAt: new Date(created + policy.resolveMinutes * 60_000).toISOString(),
  };
}

export function evaluateSla(
  createdAt: string,
  policy: SlaPolicy,
  now: Date | string,
  acceptedAt?: string,
  resolvedAt?: string,
): SlaState {
  const timestamp = typeof now === 'string' ? new Date(now).getTime() : now.getTime();
  const deadlines = slaDeadlines(createdAt, policy);
  const acceptDue = new Date(deadlines.acceptDueAt).getTime();
  const resolveDue = new Date(deadlines.resolveDueAt).getTime();
  const acceptBreached = acceptedAt
    ? new Date(acceptedAt).getTime() > acceptDue
    : timestamp > acceptDue;
  const resolveBreached = resolvedAt
    ? new Date(resolvedAt).getTime() > resolveDue
    : timestamp > resolveDue;

  return {
    ...deadlines,
    acceptRemainingMinutes: Math.ceil((acceptDue - timestamp) / 60_000),
    resolveRemainingMinutes: Math.ceil((resolveDue - timestamp) / 60_000),
    acceptBreached,
    resolveBreached,
    shouldEscalate:
      !acceptedAt && timestamp > acceptDue + policy.escalationAfterMinutes * 60_000,
  };
}

export function policyForPriority(
  policies: SlaPolicy[],
  priority: Priority,
): SlaPolicy {
  const policy = policies.find((item) => item.priority === priority);
  if (!policy) throw new Error(`SLA não configurado para a prioridade ${priority}.`);
  return policy;
}
