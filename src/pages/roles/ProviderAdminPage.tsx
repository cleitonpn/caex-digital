import { Building2, CheckCircle2, ClipboardCheck, Plus, ShieldCheck, Store, UserCheck, UsersRound } from 'lucide-react';
import { Avatar, MetricCard, PriorityBadge } from '../../components/ui';
import { PersonFormModal } from '../../components/ProviderManagement';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import { categoryById } from '../../domain/catalog';
import { useApp } from '../../state/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProviderAdminPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [personOpen, setPersonOpen] = useState(false);
  const providerId = 'monta-expo';
  const provider = app.companies.find((item) => item.id === providerId)!;
  const tickets = app.tickets.filter((ticket) => ticket.providerId === providerId);
  const active = tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
  const team = app.people.filter((person) => person.companyId === providerId);
  const assignments = app.assignments.filter((assignment) => assignment.providerId === providerId);
  const clientIds = [...new Set(assignments.map((assignment) => assignment.exhibitorId))];
  const clients = clientIds.map((id) => app.exhibitors.find((item) => item.id === id)).filter(Boolean);
  const withinSla = tickets.filter((ticket) => !ticket.resolvedAt || new Date(ticket.resolvedAt).getTime() <= new Date(ticket.resolveDueAt).getTime()).length;
  const sla = tickets.length ? Math.round(withinSla / tickets.length * 100) : 100;

  return <RoleWorkspace roleLabel="Administrador do fornecedor" organization={provider.name} personId="bianca-souza" accent="#2563a9">
    <RolePageHeader eyebrow="Painel da empresa fornecedora" title={`Bom dia, ${provider.name}`} description="Acompanhe clientes, contratos, equipe e desempenho da sua operação nesta feira." actions={<button className="button button-primary" onClick={() => setPersonOpen(true)}><Plus /> Adicionar colaborador</button>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={Store} value={clients.length} label="Clientes atribuídos" trend={`${assignments.length} escopos contratados`} /><MetricCard icon={ClipboardCheck} value={active.length} label="Chamados ativos" trend={`${active.filter((ticket) => ticket.status === 'open').length} aguardando aceite`} tone="warning" /><MetricCard icon={ShieldCheck} value={`${sla}%`} label="Dentro do SLA" trend="Meta contratual: 90%" tone="success" /><MetricCard icon={UserCheck} value={`${team.filter((person) => person.available).length}/${team.length}`} label="Equipe disponível" trend="Plantão atual" /></section>

    <section className="role-dashboard-grid role-queue">
      <article className="panel role-section role-section-main"><div className="role-section-header"><div><span className="panel-icon"><ClipboardCheck /></span><span><h2>Chamados da empresa</h2><p>Fila priorizada dos clientes sob responsabilidade da {provider.name}</p></span></div><button className="button button-ghost" onClick={() => navigate('/chamados')}>Ver todos</button></div><div className="role-ticket-list">{active.slice(0, 5).map((ticket) => <RoleTicketCard key={ticket.id} ticket={ticket} actions={<button className="button button-primary button-small" onClick={() => app.updateTicketStatus(ticket.id, ticket.status === 'open' ? 'accepted' : 'in_progress')}>{ticket.status === 'open' ? 'Aceitar' : 'Acompanhar'}</button>} />)}{!active.length && <div className="role-empty"><CheckCircle2 /><strong>Nenhum chamado ativo</strong><span>A operação da empresa está em dia.</span></div>}</div></article>
      <aside className="panel role-capacity-card role-team"><div className="role-section-header"><div><span className="panel-icon"><UsersRound /></span><span><h2>Capacidade do plantão</h2><p>Equipe cadastrada para o evento</p></span></div></div><div className="role-team-list">{team.map((person) => <div key={person.id}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{person.title}</small></span><i className={person.available ? 'online' : ''} /><b>{person.available ? 'Disponível' : 'Ausente'}</b></div>)}</div><button className="button button-ghost full-button" onClick={() => setPersonOpen(true)}>Gerenciar equipe</button></aside>
    </section>

    <section className="panel provider-clients-panel role-agenda"><div className="role-section-header"><div><span className="panel-icon"><Building2 /></span><span><h2>Carteira de clientes e responsabilidades</h2><p>Cada cliente precisa de atendimento e produtor vinculados antes da montagem.</p></span></div><span className="completion-chip"><CheckCircle2 /> Cadastro completo</span></div><div className="provider-client-table-wrap"><table className="data-table provider-client-table"><thead><tr><th>Cliente</th><th>Stand</th><th>Escopos</th><th>Produtor principal</th><th>Atendimento</th><th>Chamados ativos</th><th>Criticidade interna</th></tr></thead><tbody>{clients.map((client) => {
        if (!client) return null;
        const clientAssignments = assignments.filter((item) => item.exhibitorId === client.id);
        const producer = app.people.find((person) => person.id === clientAssignments[0]?.primaryProducerId);
        const service = app.people.find((person) => person.id === clientAssignments[0]?.providerServiceId);
        const activeCount = active.filter((ticket) => ticket.exhibitorId === client.id).length;
        return <tr key={client.id}><td><strong>{client.name}</strong><small>{client.contactName}</small></td><td><span className="stand-badge">{client.stand}</span></td><td><div className="service-tags">{[...new Set(clientAssignments.map((item) => item.category))].slice(0, 4).map((category) => <span key={category}>{categoryById[category].shortLabel}</span>)}</div></td><td>{producer ? <div className="table-person"><Avatar initials={producer.initials} color={producer.avatarColor} size="sm" /><span>{producer.name}</span></div> : 'Pendente'}</td><td>{service ? <div className="table-person"><Avatar initials={service.initials} color={service.avatarColor} size="sm" /><span>{service.name}</span></div> : 'Pendente'}</td><td><b className={activeCount ? 'warning-text' : 'success-text'}>{activeCount}</b></td><td><PriorityBadge priority={client.internalTier === 'AAA' ? 'critical' : client.internalTier === 'AA' ? 'high' : 'medium'} /></td></tr>;
      })}</tbody></table></div></section>
    <PersonFormModal open={personOpen} companyId={providerId} onClose={() => setPersonOpen(false)} />
  </RoleWorkspace>;
}
