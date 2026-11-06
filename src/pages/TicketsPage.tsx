import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MessageSquareText,
  Plus,
  Search,
  ShieldAlert,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { categoryById, serviceCategories } from '../domain/catalog';
import type { Priority, Ticket, TicketStatus } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Avatar, PageHeader, PriorityBadge, SlaPill, StatusBadge } from '../components/ui';

type FilterStatus = 'all' | 'active' | TicketStatus;

export function TicketsPage() {
  const app = useApp();
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FilterStatus>('active');
  const [priority, setPriority] = useState<'all' | Priority>('all');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return app.tickets.filter((ticket) => {
      const exhibitor = app.exhibitors.find((item) => item.id === ticket.exhibitorId);
      const matchesSearch = !term || [ticket.id, ticket.description, exhibitor?.name, exhibitor?.stand]
        .some((value) => value?.toLowerCase().includes(term));
      const matchesStatus = status === 'all'
        ? true
        : status === 'active'
          ? !['resolved', 'closed_not_performed'].includes(ticket.status)
          : ticket.status === status;
      return matchesSearch && matchesStatus && (priority === 'all' || ticket.priority === priority);
    });
  }, [app.tickets, app.exhibitors, search, status, priority]);

  const currentSelected = selected
    ? app.tickets.find((ticket) => ticket.id === selected.id) ?? null
    : null;

  return (
    <>
      <PageHeader
        title="Chamados"
        description="Acompanhe o ciclo completo, os responsáveis e os acordos de SLA."
        actions={<button className="button button-primary"><Plus size={17} /> Novo chamado</button>}
      />

      <section className="toolbar panel">
        <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por chamado, expositor ou stand" /></label>
        <label className="field-inline"><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value as FilterStatus)}><option value="active">Ativos</option><option value="all">Todos</option><option value="open">Abertos</option><option value="accepted">Aceitos</option><option value="in_progress">Em atendimento</option><option value="awaiting_validation">Aguardando validação</option><option value="resolved">Resolvidos</option></select></label>
        <label className="field-inline"><ShieldAlert size={16} /><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="all">Todas as prioridades</option><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
        <span className="result-count">{filtered.length} chamados</span>
      </section>

      <section className="panel list-panel">
        <div className="tickets-list">
          {filtered.map((ticket) => {
            const exhibitor = app.exhibitors.find((item) => item.id === ticket.exhibitorId)!;
            const provider = app.companies.find((item) => item.id === ticket.providerId);
            const producer = app.people.find((item) => item.id === ticket.assignedProducerId);
            return (
              <button className="ticket-list-item" key={ticket.id} onClick={() => setSelected(ticket)}>
                <span className={`ticket-category-icon category-${ticket.reportedCategory}`}>{categoryById[ticket.reportedCategory].shortLabel.slice(0, 2)}</span>
                <span className="ticket-main"><span className="ticket-meta"><b>{ticket.id}</b><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></span><strong>{ticket.description}</strong><small>{exhibitor.name} · Stand {exhibitor.stand} · {categoryById[ticket.reportedCategory].label}</small></span>
                <span className="ticket-owner"><small>Responsável</small><strong>{provider?.name}</strong>{producer && <span><Avatar initials={producer.initials} color={producer.avatarColor} size="sm" />{producer.name}</span>}</span>
                <SlaPill dueAt={ticket.resolveDueAt} now={app.now} />
                <ChevronRight />
              </button>
            );
          })}
        </div>
      </section>

      {currentSelected && (
        <TicketDrawer
          ticket={currentSelected}
          onClose={() => setSelected(null)}
          onStatus={(next) => app.updateTicketStatus(currentSelected.id, next)}
          onReclassify={(category) => app.reclassifyTicket(currentSelected.id, category)}
        />
      )}
    </>
  );
}

function TicketDrawer({
  ticket,
  onClose,
  onStatus,
  onReclassify,
}: {
  ticket: Ticket;
  onClose(): void;
  onStatus(status: TicketStatus): void;
  onReclassify(category: Ticket['reportedCategory']): void;
}) {
  const app = useApp();
  const exhibitor = app.exhibitors.find((item) => item.id === ticket.exhibitorId)!;
  const provider = app.companies.find((item) => item.id === ticket.providerId);
  const producer = app.people.find((item) => item.id === ticket.assignedProducerId);
  const service = app.people.find((item) => item.id === ticket.assignedServiceId);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="ticket-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header"><div><span>{ticket.id}</span><h2>{categoryById[ticket.reportedCategory].label} · Stand {exhibitor.stand}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
        <div className="drawer-status-line"><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /><SlaPill dueAt={ticket.resolveDueAt} now={app.now} /></div>

        <div className="ticket-detail-hero">
          <small>{exhibitor.name}</small>
          <p>{ticket.description}</p>
          <div>{ticket.priorityReasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
        </div>

        <section className="drawer-section">
          <h3><UserRoundCheck /> Equipe responsável</h3>
          <div className="responsible-grid">
            {producer && <PersonCard person={producer} />}
            {service && <PersonCard person={service} />}
            <PersonCard person={app.people.find((item) => item.id === 'rafael-lima')!} />
          </div>
          <p className="provider-label">Fornecedor responsável: <strong>{provider?.name}</strong></p>
        </section>

        <section className="drawer-section">
          <h3><ArrowLeftRight /> Classificação técnica</h3>
          <label className="stacked-field"><span>Categoria informada</span><strong>{categoryById[ticket.reportedCategory].label}</strong></label>
          <label className="stacked-field"><span>Causa real identificada</span><select value={ticket.resolvedCategory ?? ticket.reportedCategory} onChange={(event) => onReclassify(event.target.value as Ticket['reportedCategory'])}>{serviceCategories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select></label>
          <small className="field-help">A categoria original permanece no histórico e a causa real alimenta os indicadores técnicos.</small>
        </section>

        <section className="drawer-section timeline-section">
          <h3><Clock3 /> Histórico do chamado</h3>
          {ticket.timeline.slice().reverse().map((entry) => <div className="timeline-entry" key={entry.id}><i /><div><strong>{entry.action}</strong><span>{entry.actorName}</span><small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.at))}</small></div></div>)}
        </section>

        <div className="drawer-actions">
          {ticket.status === 'open' && <button className="button button-primary" onClick={() => onStatus('accepted')}><CheckCircle2 /> Aceitar chamado</button>}
          {ticket.status === 'accepted' && <button className="button button-primary" onClick={() => onStatus('in_progress')}><Clock3 /> Iniciar atendimento</button>}
          {ticket.status === 'in_progress' && <button className="button button-primary" onClick={() => onStatus('awaiting_validation')}><CheckCircle2 /> Enviar para validação</button>}
          {ticket.status === 'awaiting_validation' && <button className="button button-primary" onClick={() => onStatus('resolved')}><CheckCircle2 /> Validar e encerrar</button>}
          <button className="button button-ghost"><MessageSquareText /> Adicionar atualização</button>
        </div>
      </aside>
    </div>
  );
}

function PersonCard({ person }: { person: ReturnType<typeof useApp>['people'][number] }) {
  return <div className="person-card"><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{person.title}</small></span><i className={person.available ? 'online' : ''} /></div>;
}
