import { ChevronRight, Clock3, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { categoryById } from '../domain/catalog';
import type { Ticket } from '../domain/types';
import { useApp } from '../state/AppContext';
import { PriorityBadge, StatusBadge } from './ui';

export function RoleTicketCard({ ticket, actions, onClick }: { ticket: Ticket; actions?: ReactNode; onClick?(): void }) {
  const app = useApp();
  const exhibitor = app.exhibitors.find((item) => item.id === ticket.exhibitorId);
  const provider = app.companies.find((item) => item.id === ticket.providerId);
  const minutes = Math.round((new Date(ticket.resolveDueAt).getTime() - new Date(app.now).getTime()) / 60_000);
  return <article className={`role-ticket-card ${ticket.priority === 'critical' ? 'critical' : ''}`} onClick={onClick}>
    <span className="role-ticket-category">{categoryById[ticket.reportedCategory].shortLabel.slice(0, 2)}</span>
    <div className="role-ticket-copy"><div><strong>{ticket.id} · {categoryById[ticket.reportedCategory].label}</strong><PriorityBadge priority={ticket.priority} /></div><p>{ticket.description}</p><small><MapPin /> Stand {exhibitor?.stand} · {exhibitor?.name}<i />{provider?.name}</small></div>
    <div className="role-ticket-status"><StatusBadge status={ticket.status} /><span className={minutes < 0 ? 'late' : minutes < 30 ? 'warning' : ''}><Clock3 /> {minutes < 0 ? `${Math.abs(minutes)} min vencido` : `${minutes} min restantes`}</span></div>
    {actions ? <div className="role-ticket-actions" onClick={(event) => event.stopPropagation()}>{actions}</div> : <ChevronRight className="role-ticket-chevron" />}
  </article>;
}
