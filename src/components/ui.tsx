import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Flame, type LucideIcon } from 'lucide-react';
import type { Priority, TicketStatus } from '../domain/types';

export function Avatar({
  initials,
  color = '#5f50d5',
  size = 'md',
}: {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: color }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

const priorityLabels: Record<Priority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge priority-${priority}`}>{priorityLabels[priority]}</span>;
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  accepted: 'Aceito',
  in_progress: 'Em atendimento',
  waiting: 'Aguardando',
  awaiting_validation: 'Aguardando validação',
  resolved: 'Resolvido',
  reopened_triage: 'Reaberto em triagem',
  blocked_by_provider: 'Impedimento informado',
  closed_not_performed: 'Não executado',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function MetricCard({
  label,
  value,
  trend,
  tone = 'primary',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  trend?: string;
  tone?: 'primary' | 'danger' | 'warning' | 'success';
  icon: LucideIcon;
}) {
  return (
    <article className="metric-card">
      <span className={`metric-icon metric-${tone}`}><Icon size={21} /></span>
      <div className="metric-copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {trend && <small>{trend}</small>}
    </article>
  );
}

export function SlaPill({ dueAt, now }: { dueAt: string; now: string }) {
  const minutes = Math.ceil((new Date(dueAt).getTime() - new Date(now).getTime()) / 60_000);
  const breached = minutes < 0;
  return (
    <span className={`sla-pill ${breached ? 'sla-breached' : minutes <= 20 ? 'sla-warning' : ''}`}>
      <Clock3 size={13} /> {breached ? `+${Math.abs(minutes)} min` : `${minutes} min`}
    </span>
  );
}

export function Notice({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children: ReactNode;
  tone?: 'info' | 'danger' | 'success';
}) {
  const Icon = tone === 'danger' ? AlertCircle : tone === 'success' ? CheckCircle2 : Flame;
  return (
    <div className={`notice notice-${tone}`}>
      <Icon size={19} />
      <div><strong>{title}</strong><span>{children}</span></div>
    </div>
  );
}
