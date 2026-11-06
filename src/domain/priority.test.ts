import { describe, expect, it } from 'vitest';
import { calculatePriority } from './priority';

describe('fila inteligente', () => {
  it('coloca risco elétrico de cliente C acima de pendência estética AAA', () => {
    const electrical = calculatePriority({
      category: 'electrical',
      safetyRisk: true,
      standBlocked: true,
      affectsOperation: true,
      phase: 'event',
      exhibitorTier: 'C',
    });
    const furniture = calculatePriority({
      category: 'furniture',
      safetyRisk: false,
      standBlocked: false,
      affectsOperation: false,
      phase: 'event',
      exhibitorTier: 'AAA',
    });

    expect(electrical.priority).toBe('critical');
    expect(electrical.score).toBeGreaterThan(furniture.score);
  });
});
