import { AlertTriangle, CheckCircle2, Clock3, MapPin, Navigation, Play, Power, Route, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Avatar, MetricCard } from '../../components/ui';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import { serviceCategories } from '../../domain/catalog';
import { useApp } from '../../state/AppContext';

export function ProviderProducerPage() {
  const app = useApp();
  const producer = app.people.find((person) => person.id === 'carlos-mendes')!;
  const provider = app.companies.find((company) => company.id === producer.companyId)!;
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const tickets = app.tickets.filter((ticket) => ticket.providerId === provider.id && !['resolved', 'closed_not_performed'].includes(ticket.status));
  const queue = [...tickets].sort((a, b) => b.priorityScore - a.priorityScore);
  const selected = queue.find((ticket) => ticket.id === selectedTicketId) ?? queue[0];
  const assignments = app.assignments.filter((assignment) => assignment.providerId === provider.id && (assignment.primaryProducerId === producer.id || assignment.secondaryProducerId === producer.id));
  const clients = [...new Set(assignments.map((assignment) => assignment.exhibitorId))].map((id) => app.exhibitors.find((item) => item.id === id)).filter(Boolean);

  return <RoleWorkspace roleLabel="Produtor do fornecedor" organization={provider.name} personId={producer.id} accent="#315ec2">
    <RolePageHeader eyebrow="Operação em campo" title={`Olá, ${producer.name.split(' ')[0]}`} description="Sua fila já está ordenada por segurança, impacto e prazo de solução." actions={<label className="field-availability"><Power /><span><strong>Status no plantão</strong><small>{producer.available ? 'Disponível para chamados' : 'Ausente'}</small></span><input type="checkbox" checked={producer.available} onChange={() => app.toggleAvailability(producer.id)} /><i /></label>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={Wrench} value={queue.length} label="Na sua fila" trend="Ordem inteligente" /><MetricCard icon={AlertTriangle} value={queue.filter((ticket) => ['critical', 'high'].includes(ticket.priority)).length} label="Alta prioridade" trend="Ação imediata" tone="danger" /><MetricCard icon={Play} value={queue.filter((ticket) => ticket.status === 'in_progress').length} label="Em execução" trend="Atendimentos iniciados" tone="warning" /><MetricCard icon={MapPin} value={clients.length} label="Stands atribuídos" trend="Carteira desta feira" tone="success" /></section>

    <section className="producer-field-grid role-queue">
      <article className="panel producer-smart-queue"><div className="role-section-header"><div><span className="panel-icon"><Route /></span><span><h2>Próximos atendimentos</h2><p>Sequência recomendada pelo algoritmo</p></span></div><span className="live-chip"><i /> Atualizada agora</span></div><div className="producer-queue-list">{queue.map((ticket, index) => <button className={selected?.id === ticket.id ? 'selected' : ''} key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}><span className="queue-position">{index + 1}</span><RoleTicketCard ticket={ticket} /></button>)}</div></article>

      {selected && <aside className="panel field-ticket-detail"><div className="field-ticket-map"><span><Navigation /><b>Próximo destino</b></span><strong>Stand {app.exhibitors.find((item) => item.id === selected.exhibitorId)?.stand}</strong><small>aprox. 3 minutos · Pavilhão principal</small></div><div className="field-ticket-body"><span className="field-ticket-id">{selected.id}</span><h2>{selected.description}</h2><p><Clock3 /> Solução prevista até {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(selected.resolveDueAt))}</p><label><span>Causa técnica encontrada</span><select defaultValue={selected.resolvedCategory ?? selected.reportedCategory} onChange={(event) => app.reclassifyTicket(selected.id, event.target.value as typeof selected.reportedCategory)}>{serviceCategories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select><small>A categoria informada pelo cliente será preservada para comparação.</small></label><div className="field-ticket-actions">{selected.status === 'open' && <button className="button button-primary" onClick={() => app.updateTicketStatus(selected.id, 'accepted')}><CheckCircle2 /> Aceitar chamado</button>}{selected.status === 'accepted' && <button className="button button-primary" onClick={() => app.updateTicketStatus(selected.id, 'in_progress')}><Play /> Iniciar atendimento</button>}{selected.status === 'in_progress' && <button className="button button-primary" onClick={() => app.updateTicketStatus(selected.id, 'awaiting_validation')}><CheckCircle2 /> Enviar solução</button>}<button className="button button-ghost">Pedir apoio</button></div></div></aside>}
    </section>

    <section className="panel field-agenda role-agenda role-team"><div className="role-section-header"><div><span className="panel-icon"><MapPin /></span><span><h2>Minha rota e carteira</h2><p>Stands sob sua responsabilidade principal ou cobertura</p></span></div></div><div className="field-client-strip">{clients.map((client, index) => client && <article key={client.id}><span className="stand-badge">{client.stand}</span><div><strong>{client.name}</strong><small>{app.assignments.filter((item) => item.exhibitorId === client.id && item.providerId === provider.id).length} escopos · {index === 0 ? 'próximo' : `${index + 1}º na rota`}</small></div>{index === 0 && <Navigation />}</article>)}</div><div className="backup-producer"><Avatar initials="ML" color="#8b4c9e" /><span><strong>Marcos Lima</strong><small>Produtor secundário · recebe sua carteira em caso de ausência</small></span><span className="badge status-accepted">Cobertura configurada</span></div></section>
  </RoleWorkspace>;
}
