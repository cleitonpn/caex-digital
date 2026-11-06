import { categoryById } from './catalog';
import type {
  Exhibitor,
  OperationalPhase,
  Priority,
  ServiceCategoryId,
} from './types';

export interface PriorityInput {
  category: ServiceCategoryId;
  safetyRisk: boolean;
  standBlocked: boolean;
  affectsOperation: boolean;
  phase: OperationalPhase;
  minutesToEventStart?: number;
  minutesWaiting?: number;
  reopened?: boolean;
  exhibitorTier: Exhibitor['internalTier'];
}

export interface PriorityDecision {
  score: number;
  priority: Priority;
  reasons: string[];
}

const tierWeight: Record<Exhibitor['internalTier'], number> = {
  AAA: 5,
  AA: 4,
  A: 3,
  B: 2,
  C: 1,
};

export function calculatePriority(input: PriorityInput): PriorityDecision {
  const reasons: string[] = [];
  let score = categoryById[input.category].riskWeight;

  if (input.safetyRisk) {
    score = Math.max(score, 85);
    reasons.push('Risco à segurança');
  }
  if (input.standBlocked) {
    score += 20;
    reasons.push('Stand impedido de operar');
  } else if (input.affectsOperation) {
    score += 12;
    reasons.push('Impacta a operação do stand');
  }
  if (input.phase === 'event') {
    score += 12;
    reasons.push('Evento em andamento');
  } else if (
    input.phase === 'setup' &&
    input.minutesToEventStart !== undefined &&
    input.minutesToEventStart <= 120
  ) {
    score += 10;
    reasons.push('Abertura do evento próxima');
  }
  if ((input.minutesWaiting ?? 0) >= 60) {
    score += Math.min(15, Math.floor((input.minutesWaiting ?? 0) / 30) * 3);
    reasons.push('Tempo de espera elevado');
  }
  if (input.reopened) {
    score += 5;
    reasons.push('Chamado reaberto');
  }

  score += tierWeight[input.exhibitorTier];
  score = Math.min(100, score);

  const priority: Priority =
    score >= 80 ? 'critical' : score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, priority, reasons };
}
