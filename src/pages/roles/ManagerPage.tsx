import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Crown, Gauge, Scale, ShieldAlert, Siren, TrendingUp } from 'lucide-react';
import { MetricCard } from '../../components/ui';
import { TicketTimelineModal } from '../../components/QuickActionModal';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { RoleTicketCard } from '../../components/RoleTicketCard';
import { useApp } from '../../state/AppContext';
import { useState } from 'react';
import type { Ticket } from '../../domain/types';

export function ManagerPage() {
  const app = useApp();
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const active = app.tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
  const critical = active.filter((ticket) => ticket.priority === 'critical');
  const escalated = active.filter((ticket) => ticket.escalatedAt || new Date(ticket.resolveDueAt).getTime() < new Date(app.now).getTime());
  const blocked = active.filter((ticket) => ticket.status === 'blocked_by_provider');
  const providers = app.companies.filter((company) => company.type === 'provider').map((provider) => {
    const tickets = app.tickets.filter((ticket) => ticket.providerId === provider.id);
    const within = tickets.filter((ticket) => !ticket.resolvedAt || new Date(ticket.resolvedAt).getTime() <= new Date(ticket.resolveDueAt).getTime()).length;
    return { provider, total: tickets.length, active: active.filter((ticket) => ticket.providerId === provider.id).length, sla: tickets.length ? Math.round(within / tickets.length * 100) : 100 };
  }).filter((item) => item.total).sort((a, b) => b.total - a.total);

  return <RoleWorkspace roleLabel="Gestor da feira" organization="Nexo Eventos" personId="ana-ribeiro" accent="#7c3aed">
    <RolePageHeader eyebrow="Comando executivo da operação" title="Painel do gestor" description="Decisões, riscos e desempenho que precisam da sua atenção durante a feira." actions={<button className="button button-primary" onClick={() => window.location.hash = '#/'}><Gauge /> Abrir Sala de Guerra</button>} />
    <section className="metrics-grid role-metrics"><MetricCard icon={Siren} value={critical.length} label="Críticos ativos" trend="Ação executiva" tone="danger" /><MetricCard icon={ShieldAlert} value={escalated.length} label="Escalonamentos" trend="Prazo ou risco" tone="warning" /><MetricCard icon={Scale} value={blocked.length} label="Decisões pendentes" trend="Impedimentos e interceptações" /><MetricCard icon={TrendingUp} value="94%" label="Saúde da operação" trend="Índice consolidado" tone="success" /></section>

    <section className="manager-grid role-queue">
      <article className="panel role-section"><div className="role-section-header"><div><span className="panel-icon danger"><Crown /></span><span><h2>Decisões do gestor</h2><p>Itens que ultrapassaram a autonomia da equipe operacional</p></span></div><span className="badge priority-critical">{escalated.length + blocked.length} pendentes</span></div><div className="manager-decision-list">{[...escalated, ...blocked, ...critical].filter((ticket, index, array) => array.findIndex((item) => item.id === ticket.id) === index).slice(0, 4).map((ticket) => <RoleTicketCard key={ticket.id} ticket={ticket} actions={<><button className="button button-ghost button-small" onClick={() => setHistoryTicket(ticket)}>Ver histórico</button><button className="button button-primary button-small" onClick={() => app.updateTicketStatus(ticket.id, 'in_progress')}>Aprovar intervenção</button></>} />)}{!escalated.length && !blocked.length && <div className="role-empty"><CheckCircle2 /><strong>Sem decisões críticas pendentes</strong><span>A equipe está operando dentro das regras definidas.</span></div>}</div></article>
      <aside className="panel manager-risk-panel"><div className="role-section-header"><div><span className="panel-icon"><AlertTriangle /></span><span><h2>Risco por área</h2><p>Leitura rápida do pavilhão</p></span></div></div><div className="risk-area-list"><div><span>Pavilhão A</span><i><b style={{ width: '82%' }} /></i><strong className="danger-text">Alto</strong></div><div><span>Pavilhão B</span><i><b style={{ width: '54%' }} /></i><strong className="warning-text">Médio</strong></div><div><span>Praça central</span><i><b style={{ width: '26%' }} /></i><strong className="success-text">Baixo</strong></div><div><span>Área externa</span><i><b style={{ width: '18%' }} /></i><strong className="success-text">Baixo</strong></div></div><button className="button button-ghost full-button" onClick={() => window.location.hash = '#/'}>Ver Sala de Guerra <ArrowRight /></button></aside>
    </section>

    <section className="panel manager-provider-table role-agenda"><div className="role-section-header"><div><span className="panel-icon"><Building2 /></span><span><h2>Desempenho dos fornecedores</h2><p>Indicadores para decisão de continuidade e contratação futura</p></span></div><button className="button button-ghost" onClick={() => window.location.hash = '#/relatorios'}>Abrir relatório completo</button></div><table className="data-table"><thead><tr><th>Fornecedor</th><th>Chamados</th><th>Ativos</th><th>SLA</th><th>Nível de risco</th><th>Recomendação</th></tr></thead><tbody>{providers.map(({ provider, total, active: providerActive, sla }) => <tr key={provider.id}><td><strong>{provider.name}</strong><small>{provider.specialties?.length ?? 0} especialidades</small></td><td>{total}</td><td>{providerActive}</td><td><span className={`score-pill ${sla < 90 ? 'score-warning' : ''}`}>{sla}%</span></td><td><span className={`manager-risk risk-${sla < 85 ? 'high' : sla < 95 ? 'medium' : 'low'}`}>{sla < 85 ? 'Alto' : sla < 95 ? 'Médio' : 'Baixo'}</span></td><td><strong>{sla >= 90 ? 'Manter acompanhamento' : 'Plano de ação necessário'}</strong></td></tr>)}</tbody></table></section>

    <section className="manager-summary-cards role-team"><article className="panel"><CheckCircle2 /><div><span>Resolutividade</span><strong>86% dos chamados concluídos sem intervenção</strong><p>A automação está absorvendo a maior parte da operação.</p></div></article><article className="panel"><AlertTriangle /><div><span>Maior concentração</span><strong>Elétrica representa o principal risco da montagem</strong><p>Reforce a equipe no intervalo entre montagem e abertura.</p></div></article><article className="panel"><TrendingUp /><div><span>Tendência</span><strong>Tempo de aceite caiu 18% nas últimas duas horas</strong><p>Os fornecedores responderam ao primeiro escalonamento.</p></div></article></section>
    <TicketTimelineModal ticket={historyTicket} onClose={() => setHistoryTicket(null)} />
  </RoleWorkspace>;
}
