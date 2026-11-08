import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  MapPin,
  MoreHorizontal,
  Plus,
  Store,
  UsersRound,
  X,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { useApp } from '../state/AppContext';

type EventStatus = 'live' | 'upcoming' | 'completed' | 'draft';

interface EventCardData {
  id: string;
  name: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  exhibitors: number;
  providers: number;
  team: number;
  status: EventStatus;
  progress: number;
  logo: string;
  color: string;
}

const statusLabels: Record<EventStatus, string> = {
  live: 'Operação ativa',
  upcoming: 'Próximo evento',
  completed: 'Encerrado',
  draft: 'Rascunho',
};

export function EventsPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingEvent, setEditingEvent] = useState<EventCardData | null>(null);
  const [menuEventId, setMenuEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventCardData[]>(() => [
    {
      id: app.event.id,
      name: app.event.name,
      venue: app.event.venue,
      startsAt: '2027-05-10',
      endsAt: '2027-05-14',
      exhibitors: app.exhibitors.length,
      providers: app.companies.filter((company) => company.type === 'provider').length,
      team: app.people.length,
      status: 'live',
      progress: 64,
      logo: app.event.brand.logoText,
      color: app.event.brand.primaryColor,
    },
    {
      id: 'tech-commerce-2027',
      name: 'Tech Commerce 2027',
      venue: 'São Paulo Expo · São Paulo',
      startsAt: '2027-08-18',
      endsAt: '2027-08-21',
      exhibitors: 186,
      providers: 12,
      team: 34,
      status: 'upcoming',
      progress: 38,
      logo: 'TC',
      color: '#0f766e',
    },
    {
      id: 'retail-future-2027',
      name: 'Retail Future 2027',
      venue: 'Riocentro · Rio de Janeiro',
      startsAt: '2027-10-04',
      endsAt: '2027-10-07',
      exhibitors: 94,
      providers: 8,
      team: 21,
      status: 'draft',
      progress: 14,
      logo: 'RF',
      color: '#b45309',
    },
    {
      id: 'food-service-2026',
      name: 'Food Service Summit 2026',
      venue: 'Transamérica Expo · São Paulo',
      startsAt: '2026-09-12',
      endsAt: '2026-09-15',
      exhibitors: 241,
      providers: 15,
      team: 42,
      status: 'completed',
      progress: 100,
      logo: 'FS',
      color: '#7c3aed',
    },
  ]);

  const totals = useMemo(() => ({
    active: events.filter((event) => event.status === 'live').length,
    upcoming: events.filter((event) => ['upcoming', 'draft'].includes(event.status)).length,
    exhibitors: events.filter((event) => event.status !== 'completed').reduce((sum, event) => sum + event.exhibitors, 0),
  }), [events]);

  const createEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? 'Novo evento');
    const words = name.split(/\s+/).filter(Boolean);
    const next: EventCardData = {
      id: `event-${Date.now()}`,
      name,
      venue: String(form.get('venue') ?? ''),
      startsAt: String(form.get('startsAt') ?? ''),
      endsAt: String(form.get('endsAt') ?? ''),
      exhibitors: 0,
      providers: 0,
      team: 1,
      status: 'draft',
      progress: 5,
      logo: words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'NE',
      color: String(form.get('color') ?? '#4431bd'),
    };
    setEvents((current) => editingEvent ? current.map((item) => item.id === editingEvent.id ? { ...item, ...next, id: editingEvent.id, status: editingEvent.status, progress: editingEvent.progress, exhibitors: editingEvent.exhibitors, providers: editingEvent.providers, team: editingEvent.team } : item) : [next, ...current]);
    setShowCreate(false);
    setEditingEvent(null);
  };
  const visibleEvents = events.filter((event) => filter === 'all' || (filter === 'completed' ? event.status === 'completed' : event.status !== 'completed'));
  const openEditor = (event: EventCardData) => { setEditingEvent(event); setMenuEventId(null); setShowCreate(true); };
  const duplicateEvent = (event: EventCardData) => setEvents((current) => [{ ...event, id: `${event.id}-copy-${Date.now()}`, name: `${event.name} · cópia`, status: 'draft', progress: 5 }, ...current]);

  return <>
    <PageHeader
      eyebrow="Portfólio da organizadora"
      title="Eventos"
      description="Crie feiras, prepare a operação e acompanhe o histórico em um único lugar."
      actions={<button className="button button-primary" onClick={() => { setEditingEvent(null); setShowCreate(true); }}><Plus /> Novo evento</button>}
    />

    <section className="metrics-grid event-metrics">
      <article className="metric-card"><span className="metric-icon metric-success"><CalendarDays /></span><div className="metric-copy"><strong>{totals.active}</strong><span>Evento em operação</span></div><small>Expo Summit está em montagem</small></article>
      <article className="metric-card"><span className="metric-icon metric-primary"><Clock3 /></span><div className="metric-copy"><strong>{totals.upcoming}</strong><span>Em preparação</span></div><small>Próximos 6 meses</small></article>
      <article className="metric-card"><span className="metric-icon metric-warning"><Store /></span><div className="metric-copy"><strong>{totals.exhibitors}</strong><span>Expositores previstos</span></div><small>Eventos ativos e futuros</small></article>
      <article className="metric-card"><span className="metric-icon metric-primary"><CheckCircle2 /></span><div className="metric-copy"><strong>92%</strong><span>Preparação média</span></div><small>Cadastros obrigatórios</small></article>
    </section>

    <section className="event-section-heading"><div><h2>Todos os eventos</h2><p>{events.length} eventos cadastrados nesta organizadora</p></div><div className="event-view-filter"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Ativos</button><button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Encerrados</button></div></section>
    <section className="event-grid">
      {visibleEvents.map((event) => <article className={`panel event-card event-${event.status}`} key={event.id}>
        <div className="event-cover" style={{ '--event-card-color': event.color } as React.CSSProperties}>
          <span className="event-card-logo">{event.logo}</span>
          <span className={`event-status event-status-${event.status}`}><i /> {statusLabels[event.status]}</span>
          <button className="event-more" aria-label="Mais opções" onClick={() => setMenuEventId((current) => current === event.id ? null : event.id)}><MoreHorizontal /></button>
          {menuEventId === event.id && <div className="event-card-menu"><button onClick={() => openEditor(event)}>Editar evento</button><button onClick={() => { duplicateEvent(event); setMenuEventId(null); }}>Duplicar</button><button onClick={() => { setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status: 'completed', progress: 100 } : item)); setMenuEventId(null); }}>Marcar encerrado</button></div>}
        </div>
        <div className="event-card-body">
          <h2>{event.name}</h2><p><MapPin /> {event.venue}</p><p><CalendarDays /> {formatDate(event.startsAt)} — {formatDate(event.endsAt)}</p>
          <div className="event-progress"><span><b>Preparação operacional</b><strong>{event.progress}%</strong></span><i><b style={{ width: `${event.progress}%` }} /></i></div>
          <div className="event-card-stats"><span><Store /><b>{event.exhibitors}</b><small>Expositores</small></span><span><Building2 /><b>{event.providers}</b><small>Fornecedores</small></span><span><UsersRound /><b>{event.team}</b><small>Equipe</small></span></div>
          <div className="event-card-actions">
            {event.status === 'live' ? <button className="button button-primary" onClick={() => navigate('/')}><span className="live-dot" /> Abrir operação</button> : <button className="button button-ghost" onClick={() => openEditor(event)}>Gerenciar evento <ArrowRight /></button>}
            <button className="icon-button" aria-label="Duplicar evento" onClick={() => duplicateEvent(event)}><Copy /></button>
          </div>
        </div>
      </article>)}
    </section>

    {showCreate && <div className="modal-backdrop" onClick={() => { setShowCreate(false); setEditingEvent(null); }}><form key={editingEvent?.id ?? 'new'} className="modal-card event-create-modal" onSubmit={createEvent} onClick={(event) => event.stopPropagation()}>
      <header><div><span className="panel-icon"><CalendarDays /></span><div><h2>{editingEvent ? 'Gerenciar evento' : 'Criar novo evento'}</h2><p>Informações básicas do ambiente e identidade do evento.</p></div></div><button type="button" className="icon-button" onClick={() => { setShowCreate(false); setEditingEvent(null); }}><X /></button></header>
      <div className="modal-form-grid">
        <label className="form-field full-span"><span>Nome do evento</span><input name="name" required placeholder="Ex.: Expo Summit 2028" defaultValue={editingEvent?.name} /></label>
        <label className="form-field full-span"><span>Local</span><input name="venue" required placeholder="Centro de eventos · Cidade" defaultValue={editingEvent?.venue} /></label>
        <label className="form-field"><span>Início da montagem</span><input name="startsAt" type="date" required defaultValue={editingEvent?.startsAt} /></label>
        <label className="form-field"><span>Fim da desmontagem</span><input name="endsAt" type="date" required defaultValue={editingEvent?.endsAt} /></label>
        <label className="form-field"><span>Fuso horário</span><select name="timezone" defaultValue="America/Sao_Paulo"><option>America/Sao_Paulo</option><option>America/New_York</option><option>Europe/Berlin</option></select></label>
        <label className="form-field color-field"><span>Cor da marca</span><input name="color" type="color" defaultValue={editingEvent?.color ?? '#4431bd'} /></label>
      </div>
      <footer><button type="button" className="button button-ghost" onClick={() => { setShowCreate(false); setEditingEvent(null); }}>Cancelar</button><button className="button button-primary">{editingEvent ? 'Salvar evento' : 'Criar rascunho'} <ArrowRight /></button></footer>
    </form></div>}
  </>;
}

function formatDate(value: string) {
  if (!value) return 'A definir';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}
