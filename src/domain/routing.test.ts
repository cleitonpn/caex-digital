import { describe, expect, it } from 'vitest';
import { resolveServiceAssignment } from './routing';
import type { ServiceAssignment } from './types';

const assignments: ServiceAssignment[] = [
  {
    id: 'setup-cleaning',
    eventId: 'event-1',
    exhibitorId: 'exhibitor-1',
    category: 'cleaning',
    phases: ['setup'],
    providerId: 'builder',
    contractStatus: 'included',
  },
  {
    id: 'event-cleaning',
    eventId: 'event-1',
    exhibitorId: 'exhibitor-1',
    category: 'cleaning',
    phases: ['event'],
    providerId: 'cleaning-provider',
    contractStatus: 'not_contracted',
  },
];

describe('roteamento por fase e contratação', () => {
  it('encaminha a limpeza de montagem para a montadora', () => {
    const decision = resolveServiceAssignment(
      assignments,
      'exhibitor-1',
      'cleaning',
      'setup',
    );
    expect(decision.available).toBe(true);
    expect(decision.assignment?.providerId).toBe('builder');
  });

  it('bloqueia limpeza do evento não contratada para o expositor', () => {
    const decision = resolveServiceAssignment(
      assignments,
      'exhibitor-1',
      'cleaning',
      'event',
      'exhibitor_admin',
    );
    expect(decision.available).toBe(false);
    expect(decision.reason).toContain('não foi contratada');
  });

  it('permite que a organizadora trate a exceção', () => {
    const decision = resolveServiceAssignment(
      assignments,
      'exhibitor-1',
      'cleaning',
      'event',
      'organizer_producer',
    );
    expect(decision.available).toBe(true);
  });
});
