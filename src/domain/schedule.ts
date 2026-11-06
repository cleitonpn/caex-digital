import type { OperationalPhase, OperationalWindow } from './types';

export interface ScheduleIssue {
  windowId?: string;
  message: string;
}

export function activeOperationalWindow(
  windows: OperationalWindow[],
  at: Date | string,
): OperationalWindow | null {
  const timestamp = typeof at === 'string' ? new Date(at).getTime() : at.getTime();
  if (Number.isNaN(timestamp)) return null;

  return (
    [...windows]
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .find((window) => {
        const start = new Date(window.startsAt).getTime();
        const end = new Date(window.endsAt).getTime();
        return timestamp >= start && timestamp < end;
      }) ?? null
  );
}

export function activePhase(
  windows: OperationalWindow[],
  at: Date | string,
): OperationalPhase | null {
  return activeOperationalWindow(windows, at)?.phase ?? null;
}

export function validateSchedule(windows: OperationalWindow[]): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const sorted = [...windows].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const start = new Date(current.startsAt).getTime();
    const end = new Date(current.endsAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      issues.push({ windowId: current.id, message: 'Data ou horário inválido.' });
      continue;
    }
    if (end <= start) {
      issues.push({
        windowId: current.id,
        message: 'O término deve acontecer depois do início.',
      });
    }

    const next = sorted[index + 1];
    if (next && end > new Date(next.startsAt).getTime()) {
      issues.push({
        windowId: current.id,
        message: 'Este período se sobrepõe ao período seguinte.',
      });
    }
  }

  return issues;
}
