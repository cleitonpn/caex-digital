import { describe, expect, it } from 'vitest';
import { activePhase, validateSchedule } from './schedule';
import type { OperationalWindow } from './types';

const windows: OperationalWindow[] = [
  {
    id: 'setup-last-day',
    phase: 'setup',
    startsAt: '2027-05-12T08:00:00-03:00',
    endsAt: '2027-05-12T12:00:00-03:00',
  },
  {
    id: 'event-first-day',
    phase: 'event',
    startsAt: '2027-05-12T14:00:00-03:00',
    endsAt: '2027-05-12T22:00:00-03:00',
  },
];

describe('agenda operacional', () => {
  it('distingue montagem e evento no mesmo dia', () => {
    expect(activePhase(windows, '2027-05-12T10:00:00-03:00')).toBe('setup');
    expect(activePhase(windows, '2027-05-12T16:00:00-03:00')).toBe('event');
  });

  it('considera o intervalo entre períodos sem fase ativa', () => {
    expect(activePhase(windows, '2027-05-12T13:00:00-03:00')).toBeNull();
  });

  it('rejeita sobreposição de períodos', () => {
    const overlapping = [
      ...windows,
      {
        id: 'overlap',
        phase: 'event' as const,
        startsAt: '2027-05-12T11:30:00-03:00',
        endsAt: '2027-05-12T15:00:00-03:00',
      },
    ];
    expect(validateSchedule(overlapping)).not.toHaveLength(0);
  });
});
