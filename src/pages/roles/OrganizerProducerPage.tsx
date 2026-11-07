import { AlertTriangle, CheckCircle2, ClipboardCheck, MapPin, Navigation, Plus, Radio, RotateCcw, ShieldCheck, Siren } from 'lucide-react';
import { useState } from 'react';
import { CreateTicketModal } from '../../components/CreateTicketModal';
import { Avatar, MetricCard } from '../../components/ui';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import { useApp } from '../../state/AppContext';

export function OrganizerProducerPage() {
  const app = useApp();
  const [roundDone, setRoundDone] = useState<string[]>(['Pavilhão A']);
  const [ticketOpen, setTicketOpen] = useState(false);
  const active = app.tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
  const triage = active.filter((ticket) => ticket.status === 'reopened_triage');
  const critical = active.filter((ticket) => ticket.priority === 'critical');
  const unattended = active.filter((ticket) => ticket.status === 'open');
  const rounds = ['Pavilhão A', 'Pavilhão B', 'Praça central', 'Área externa'];

  return <RoleWorkspace roleLabel="Produtor da organizadora" organization="Nexo Eventos" personId="rafael-lima" accent="#0f766e">
    <RolePageHeader eyebrow="Operação da organizadora em campo" title="Ronda e triagem operacional" description="Valide ocorrências no local, acompanhe fornecedores e intercepte casos quando necessário." actions={<><button className="button button-ghost" onClick={() => setRoundDone([])}><Radio /> Nova ronda</button><button className="button button-primary" onClick={() => setTicketOpen(true)}><Plus /> Abrir ocorrência</button></>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={MapPin} value={active.length} label="Ocorrências no pavilhão" trend="Todos os fornecedores" /><MetricCard icon={RotateCcw} value={triage.length} label="Reabertos para triagem" trend="Visita obrigatória" tone="warning" /><MetricCard icon={Siren} value={critical.length} label="Críticos ativos" trend="Acompanhar no local" tone="danger" /><MetricCard icon={ShieldCheck} value={unattended.length} label="Sem aceite" trend="Cobrança do fornecedor" /></section>

    <section className="organizer-producer-grid role-queue">
      <article className="panel role-section"><div className="role-section-header"><div><span className="panel-icon danger"><AlertTriangle /></span><span><h2>Prioridades de campo</h2><p>Casos que precisam de presença da organizadora</p></span></div><span className="badge priority-critical">{critical.length + triage.length} ações</span></div><div className="role-ticket-list">{[...critical, ...triage, ...unattended].filter((ticket, index, array) => array.findIndex((item) => item.id === ticket.id) === index).slice(0, 5).map((ticket) => <RoleTicketCard key={ticket.id} ticket={ticket} actions={<><button className="button button-ghost button-small" onClick={() => app.updateTicketStatus(ticket.id, 'in_progress')}>Assumir caso</button><button className="button button-primary button-small">Ir ao stand</button></>} />)}</div></article>
      <aside className="panel field-round-card role-agenda"><div className="role-section-header"><div><span className="panel-icon"><Navigation /></span><span><h2>Ronda atual</h2><p>Checklist do pavilhão</p></span></div></div><div className="round-progress"><span><b>{roundDone.length}/{rounds.length}</b><small>áreas verificadas</small></span><i><b style={{ width: `${roundDone.length / rounds.length * 100}%` }} /></i></div><div className="round-list">{rounds.map((round) => { const done = roundDone.includes(round); return <button key={round} className={done ? 'done' : ''} onClick={() => setRoundDone((current) => done ? current.filter((item) => item !== round) : [...current, round])}><span>{done ? <CheckCircle2 /> : <MapPin />}</span><div><strong>{round}</strong><small>{done ? 'Verificado há 12 min' : 'Pendente de vistoria'}</small></div></button>; })}</div></aside>
    </section>

    <section className="panel organizer-field-team role-team"><div className="role-section-header"><div><span className="panel-icon"><ClipboardCheck /></span><span><h2>Equipe da organizadora em campo</h2><p>Quem pode apoiar uma triagem ou validação presencial</p></span></div></div><div className="organizer-field-people">{app.people.filter((person) => person.companyId === 'nexo-eventos').map((person) => <div key={person.id}><Avatar initials={person.initials} color={person.avatarColor} size="lg" /><span><strong>{person.name}</strong><small>{person.title}</small></span><i className={person.available ? 'online' : ''} /><b>{person.id === 'rafael-lima' ? 'Em ronda' : 'Sala operacional'}</b></div>)}</div></section>
    <CreateTicketModal open={ticketOpen} onClose={() => setTicketOpen(false)} actorRole="organizer_producer" createdBy="Produtor da organizadora · Rafael Lima" />
  </RoleWorkspace>;
}
