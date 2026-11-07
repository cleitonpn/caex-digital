import { AlertTriangle, CheckCircle2, Headphones, MessageCircle, PhoneCall, ShieldCheck, TicketCheck, UserRoundCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MetricCard } from '../../components/ui';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import { useApp } from '../../state/AppContext';

export function OrganizerServicePage() {
  const app = useApp();
  const [tab, setTab] = useState<'incoming' | 'exceptions' | 'validation'>('incoming');
  const active = app.tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
  const incoming = active.filter((ticket) => ticket.origin === 'exhibitor' && ['open', 'accepted'].includes(ticket.status));
  const exceptions = active.filter((ticket) => ticket.status === 'blocked_by_provider');
  const validation = active.filter((ticket) => ticket.status === 'awaiting_validation');
  const display = tab === 'incoming' ? incoming : tab === 'exceptions' ? exceptions : validation;
  const contacts = useMemo(() => app.exhibitors.slice(0, 4).map((exhibitor, index) => ({ exhibitor, online: index < 3, note: index === 0 ? 'Aguardando retorno sobre elétrica' : index === 1 ? 'Solução enviada para validação' : 'Sem pendências urgentes' })), [app.exhibitors]);

  return <RoleWorkspace roleLabel="Atendimento da organizadora" organization="Nexo Eventos" personId="julia-costa" accent="#c05c34">
    <RolePageHeader eyebrow="Relacionamento e exceções" title="Central de atendimento" description="Acompanhe o expositor, cobre fornecedores e trate casos que saíram do fluxo normal." actions={<button className="button button-primary"><PhoneCall /> Registrar atendimento</button>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={Headphones} value={incoming.length} label="Novos do expositor" trend="Acompanhamento ativo" /><MetricCard icon={AlertTriangle} value={exceptions.length} label="Impedimentos" trend="Ação fora do aplicativo" tone="danger" /><MetricCard icon={CheckCircle2} value={validation.length} label="Aguardando validação" trend="Cliente ou organizadora" tone="warning" /><MetricCard icon={ShieldCheck} value={`${Math.max(0, 100 - exceptions.length * 8)}%`} label="Fluxo sem intervenção" trend="Automação da operação" tone="success" /></section>

    <section className="organizer-service-grid role-queue">
      <article className="panel role-section"><div className="role-section-header service-tab-header"><div><span className="panel-icon"><TicketCheck /></span><span><h2>Fila do atendimento</h2><p>Demandas que exigem acompanhamento da organizadora</p></span></div><div className="mini-tabs"><button className={tab === 'incoming' ? 'active' : ''} onClick={() => setTab('incoming')}>Expositores <b>{incoming.length}</b></button><button className={tab === 'exceptions' ? 'active' : ''} onClick={() => setTab('exceptions')}>Impedimentos <b>{exceptions.length}</b></button><button className={tab === 'validation' ? 'active' : ''} onClick={() => setTab('validation')}>Validação <b>{validation.length}</b></button></div></div><div className="role-ticket-list">{display.map((ticket) => <RoleTicketCard key={ticket.id} ticket={ticket} actions={tab === 'exceptions' ? <button className="button button-primary button-small" onClick={() => app.updateTicketStatus(ticket.id, 'closed_not_performed')}>Concluir como não aceito</button> : tab === 'validation' ? <button className="button button-primary button-small" onClick={() => app.updateTicketStatus(ticket.id, 'resolved')}>Validar solução</button> : <button className="button button-ghost button-small">Falar com fornecedor</button>} />)}{!display.length && <div className="role-empty"><CheckCircle2 /><strong>Fila zerada</strong><span>Nenhum caso pendente neste filtro.</span></div>}</div></article>
      <aside className="panel relationship-panel"><div className="role-section-header"><div><span className="panel-icon"><MessageCircle /></span><span><h2>Relacionamento com expositores</h2><p>Últimos contatos do evento</p></span></div></div><div className="relationship-list">{contacts.map(({ exhibitor, online, note }) => <button key={exhibitor.id}><span className="relationship-logo">{exhibitor.name.slice(0, 2).toUpperCase()}</span><span><strong>{exhibitor.name}</strong><small>Stand {exhibitor.stand} · {note}</small></span><i className={online ? 'online' : ''} /></button>)}</div><button className="button button-ghost full-button"><Headphones /> Ver todos os atendimentos</button></aside>
    </section>

    <section className="panel organizer-escalation-flow role-agenda role-team"><div className="role-section-header"><div><span className="panel-icon"><UserRoundCheck /></span><span><h2>Fluxo de exceção do fornecedor</h2><p>Rastreabilidade quando um fornecedor informa que não consegue concluir.</p></span></div></div><div className="flow-steps"><span className="done"><i>1</i><strong>Impedimento informado</strong><small>Fornecedor registra justificativa</small></span><b /><span className="active"><i>2</i><strong>Atendimento acionado</strong><small>Tratativa comercial fora do app</small></span><b /><span><i>3</i><strong>Decisão registrada</strong><small>Concluir ou interceptar</small></span><b /><span><i>4</i><strong>Cliente comunicado</strong><small>Histórico preservado</small></span></div></section>
  </RoleWorkspace>;
}
