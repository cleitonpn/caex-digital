import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, MessageCircle, Send, UserRoundCog, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, MetricCard } from '../../components/ui';
import { QuickActionModal } from '../../components/QuickActionModal';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import type { TicketStatus } from '../../domain/types';
import { useApp } from '../../state/AppContext';
import { useNavigate } from 'react-router-dom';

export function ProviderServicePage() {
  const app = useApp();
  const navigate = useNavigate();
  const providerId = 'monta-expo';
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');
  const [generalUpdateOpen, setGeneralUpdateOpen] = useState(false);
  const provider = app.companies.find((item) => item.id === providerId)!;
  const team = app.people.filter((person) => person.companyId === providerId);
  const producers = team.filter((person) => person.role === 'provider_producer');
  const tickets = app.tickets.filter((ticket) => ticket.providerId === providerId && !['resolved', 'closed_not_performed'].includes(ticket.status));
  const filtered = filter === 'all' ? tickets : tickets.filter((ticket) => ticket.status === filter);
  const unassigned = tickets.filter((ticket) => !ticket.assignedProducerId);
  const late = tickets.filter((ticket) => new Date(ticket.resolveDueAt).getTime() < new Date(app.now).getTime());
  const customerMessages = useMemo(() => app.tickets.slice(0, 3).map((ticket, index) => ({ ticket, text: index === 0 ? 'O expositor enviou uma nova foto do problema.' : index === 1 ? 'A organizadora solicitou previsão de chegada.' : 'O cliente confirmou acesso ao stand.', time: `${4 + index * 6} min` })), [app.tickets]);

  return <RoleWorkspace roleLabel="Atendimento do fornecedor" organization={provider.name} personId="bianca-souza" accent="#a64d79">
    <RolePageHeader eyebrow="Coordenação de atendimento" title="Central do fornecedor" description="Receba chamados, distribua a produção e mantenha organizadora e cliente informados." actions={<button className="button button-primary" onClick={() => setGeneralUpdateOpen(true)}><Send /> Enviar atualização geral</button>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={ClipboardList} value={tickets.length} label="Na fila da empresa" trend={`${tickets.filter((ticket) => ticket.status === 'open').length} sem aceite`} /><MetricCard icon={UserRoundCog} value={unassigned.length} label="Sem produtor" trend="Vinculação obrigatória" tone="warning" /><MetricCard icon={AlertTriangle} value={late.length} label="SLA vencido" trend="Requer ação imediata" tone="danger" /><MetricCard icon={UsersRound} value={producers.filter((person) => person.available).length} label="Produtores disponíveis" trend={`${producers.length} no plantão`} tone="success" /></section>

    <section className="provider-service-grid role-queue">
      <article className="panel role-section"><div className="role-section-header role-filter-header"><div><span className="panel-icon"><ClipboardList /></span><span><h2>Fila de coordenação</h2><p>Chamados sob responsabilidade da {provider.name}</p></span></div><div className="mini-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>Novos</button><button className={filter === 'in_progress' ? 'active' : ''} onClick={() => setFilter('in_progress')}>Em campo</button></div></div><div className="role-ticket-list">{filtered.map((ticket) => <RoleTicketCard key={ticket.id} ticket={ticket} actions={<><select className="producer-select" value={ticket.assignedProducerId ?? ''} onChange={(event) => event.target.value && app.assignTicketProducer(ticket.id, event.target.value, 'Atendimento do fornecedor')}><option value="">Definir produtor</option>{producers.map((producer) => <option value={producer.id} key={producer.id}>{producer.name}</option>)}</select><button className="button button-primary button-small" onClick={() => app.updateTicketStatus(ticket.id, ticket.status === 'open' ? 'accepted' : 'in_progress')}>{ticket.status === 'open' ? 'Aceitar' : 'Atualizar'}</button></>} />)}</div></article>
      <aside className="provider-service-side">
        <section className="panel role-message-panel"><div className="role-section-header"><div><span className="panel-icon"><MessageCircle /></span><span><h2>Mensagens recentes</h2><p>Cliente e organizadora</p></span></div></div>{customerMessages.map(({ ticket, text, time }) => <button key={ticket.id} onClick={() => navigate('/chamados')}><span className="message-avatar">{ticket.id.slice(-2)}</span><span><strong>{ticket.id}</strong><p>{text}</p><small>há {time}</small></span><ArrowRight /></button>)}</section>
        <section className="panel provider-exception-card"><AlertTriangle /><div><strong>Impossibilidade de execução</strong><p>Ao informar impedimento, o atendimento da organizadora será acionado para tratar o caso.</p></div><button className="button button-ghost full-button" onClick={() => tickets[0] && app.updateTicketStatus(tickets[0].id, 'blocked_by_provider')}>Registrar impedimento</button></section>
      </aside>
    </section>

    <section className="panel producer-board role-team role-agenda"><div className="role-section-header"><div><span className="panel-icon"><UsersRound /></span><span><h2>Distribuição da equipe</h2><p>Carga atual dos produtores e cobertura do plantão</p></span></div></div><div className="producer-board-grid">{producers.map((producer) => { const assigned = tickets.filter((ticket) => ticket.assignedProducerId === producer.id); return <article key={producer.id}><Avatar initials={producer.initials} color={producer.avatarColor} size="lg" /><span><strong>{producer.name}</strong><small>{producer.title}</small></span><div><b>{assigned.length}</b><small>chamados</small></div><i className={producer.available ? 'online' : ''}>{producer.available ? 'Disponível' : 'Ausente'}</i></article>; })}<article className="producer-unassigned"><UserRoundCog /><span><strong>{unassigned.length} sem responsável</strong><small>Distribua antes do vencimento</small></span></article></div></section>
    <QuickActionModal open={generalUpdateOpen} title="Atualização geral da operação" description={`A mensagem será registrada nos ${tickets.length} chamados ativos da empresa.`} placeholder="Ex.: equipe reforçada no pavilhão e previsão revisada para os próximos atendimentos..." confirmLabel="Enviar atualização" onClose={() => setGeneralUpdateOpen(false)} onConfirm={(note) => tickets.forEach((ticket) => app.addTicketUpdate(ticket.id, 'Atendimento do fornecedor', note))} />
  </RoleWorkspace>;
}
