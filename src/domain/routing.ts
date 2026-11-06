import type {
  OperationalPhase,
  ServiceAssignment,
  ServiceCategoryId,
  UserRole,
} from './types';

export interface RoutingDecision {
  available: boolean;
  assignment?: ServiceAssignment;
  reason?: string;
}

const exhibitorRoles: UserRole[] = ['exhibitor_admin', 'exhibitor_member'];

export function resolveServiceAssignment(
  assignments: ServiceAssignment[],
  exhibitorId: string,
  category: ServiceCategoryId,
  phase: OperationalPhase | null,
  actorRole: UserRole = 'exhibitor_admin',
): RoutingDecision {
  if (!phase) {
    return {
      available: false,
      reason: 'Não há um período operacional ativo neste horário.',
    };
  }

  const assignment = assignments.find(
    (item) =>
      item.exhibitorId === exhibitorId &&
      item.category === category &&
      item.phases.includes(phase),
  );

  if (!assignment) {
    return {
      available: false,
      reason: 'Nenhum fornecedor foi definido para este serviço e período.',
    };
  }

  if (
    exhibitorRoles.includes(actorRole) &&
    assignment.contractStatus === 'not_contracted'
  ) {
    return {
      available: false,
      reason:
        category === 'cleaning' && phase === 'event'
          ? 'A limpeza durante o evento não foi contratada para este stand.'
          : 'Este serviço não foi contratado para o stand.',
    };
  }

  return { available: true, assignment };
}

export function availableCategories(
  assignments: ServiceAssignment[],
  exhibitorId: string,
  phase: OperationalPhase | null,
  actorRole: UserRole,
): ServiceCategoryId[] {
  const categories = new Set<ServiceCategoryId>();
  for (const assignment of assignments) {
    if (assignment.exhibitorId !== exhibitorId) continue;
    const decision = resolveServiceAssignment(
      assignments,
      exhibitorId,
      assignment.category,
      phase,
      actorRole,
    );
    if (decision.available) categories.add(assignment.category);
  }
  return [...categories];
}
