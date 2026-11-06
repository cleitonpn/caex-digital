import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CircleGauge,
  Clock3,
  Headphones,
  Layers3,
  ShieldCheck,
  Siren,
  TimerReset,
} from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { categoryById } from '../domain/catalog';
import type { Ticket } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Avatar, MetricCard, PageHeader, PriorityBadge, SlaPill } from '../components/ui';

const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };

export function WarRoomPage() {
  const { tickets, exhibitors, companies, people, now, updateTicketStatus } = useApp();
  const openTickets = tickets.filter(
    (ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status),
  );
  const sortedTickets = [...openTickets].sort(
    (a, b) =>
      priorityRank[b.priority] - priorityRank[a.priority] ||
      new Date(a.resolveDueAt).getTime() - new Date(b.resolveDueAt).getTime(),
  );
  const critical = openTickets.filter((ticket) => ticket.priority === 'critical').length;
  const awaiting = openTickets.filter((ticket) => ticket.status === 'open').length;
  const withinSla = openTickets.filter(
    (ticket) => new Date(ticket.resolveDueAt).getTime() >= new Date(now).getTime(),
  ).length;
  const overdue = openTickets.filter(
    (ticket) => new Date(ticket.resolveDueAt).getTime() < new Date(now).getTime(),
  );

  const categoryData = useMemo(() => {
    const count = new Map<string, number>();
    openTickets.forEach((ticket) => {
      const label = categoryById[ticket.reportedCategory].shortLabel;
      count.set(label, (count.get(label) ?? 0) + 1);
    });
    return [...count.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [openTickets]);

  const providerData = useMemo(() => {
    const providers = companies.filter((company) => company.type === 'provider');
    return providers
      .map((provider) => {
        const providerTickets = tickets.filter((ticket) => ticket.providerId === provider.id);
        const breached = providerTickets.filter(
          (ticket) => new Date(ticket.resolveDueAt).getTime() < new Date(now).getTime() && ticket.status !== 'resolved',
        ).length;
        const accepted = providerTickets.filter((ticket) => ticket.acceptedAt);
        const averageAcceptance = accepted.length
          ? Math.round(
              accepted.reduce(
                (sum, ticket) =>
                  sum +
                  (new Date(ticket.acceptedAt!).getTime() - new Date(ticket.createdAt).getTime()) /
                    60_000,
                0,
              ) / accepted.length,
            )
          : null;
        return {
          ...provider,
          total: providerTickets.length,
          sla: providerTickets.length
            ? Math.round(((providerTickets.length - breached) / providerTickets.length) * 100)
            : 100,
          averageAcceptance,
        };
      })
      .filter((provider) => provider.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [companies, tickets, now]);

  const timelineData = [
    { hour: '08h', open: 8, resolved: 2 },
    { hour: '09h', open: 12, resolved: 5 },
    { hour: '10h', open: openTickets.length, resolved: tickets.filter((t) => t.status === 'resolved').length },
    { hour: '11h', open: 11, resolved: 8 },
    { hour: '12h', open: 9, resolved: 12 },
    { hour: '13h', open: 8, resolved: 15 },
    { hour: '14h', open: 12, resolved: 17 },
  ];

  return (
    <>
      <PageHeader
        title="Sala de Guerra"
        description="Visão operacional em tempo real para decisões rápidas."
        actions={<button className="button button-ghost"><Activity size={17} /> Ver relatório executivo</button>}
      />

      <section className="metrics-grid">
        <MetricCard icon={Headphones} value={openTickets.length} label="Chamados abertos" trend="+12% nas últimas 8h" />
        <MetricCard icon={Siren} value={critical} label="Críticos" trend="Ação imediata" tone="danger" />
        <MetricCard icon={TimerReset} value={awaiting} label="Aguardando aceite" trend="2 fora do prazo" tone="warning" />
        <MetricCard
          icon={ShieldCheck}
          value={`${openTickets.length ? Math.round((withinSla / openTickets.length) * 100) : 100}%`}
          label="Dentro do SLA"
          trend="Meta da feira: 90%"
          tone="success"
        />
      </section>

      <section className="war-grid-main">
        <div className="panel queue-panel">
          <div className="panel-header">
            <div><span className="panel-icon"><Layers3 /></span><div><h2>Fila inteligente</h2><p>Ordenada por risco, impacto, fase e SLA</p></div></div>
            <button className="select-button">Todos os chamados <span>⌄</span></button>
          </div>
          <div className="queue-table-wrap">
            <table className="data-table queue-table">
              <thead><tr><th>#</th><th>Chamado</th><th>Prioridade</th><th>Categoria</th><th>SLA</th><th>Fornecedor</th><th /></tr></thead>
              <tbody>
                {sortedTickets.slice(0, 6).map((ticket, index) => {
                  const exhibitor = exhibitors.find((item) => item.id === ticket.exhibitorId)!;
                  const provider = companies.find((item) => item.id === ticket.providerId);
                  return (
                    <tr key={ticket.id} className={ticket.priority === 'critical' ? 'critical-row' : undefined}>
                      <td><span className="rank">{index + 1}</span></td>
                      <td><strong>{ticket.description}</strong><small>{ticket.id} · Stand {exhibitor.stand}</small></td>
                      <td><PriorityBadge priority={ticket.priority} /></td>
                      <td>{categoryById[ticket.reportedCategory].shortLabel}</td>
                      <td><SlaPill dueAt={ticket.resolveDueAt} now={now} /></td>
                      <td>{provider?.name}</td>
                      <td>
                        <button
                          className="button button-primary button-small"
                          onClick={() => updateTicketStatus(ticket.id, ticket.status === 'open' ? 'accepted' : 'in_progress')}
                        >
                          {ticket.status === 'open' ? 'Aceitar' : 'Acompanhar'} <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel attention-panel">
          <div className="panel-header compact">
            <div><span className="panel-icon danger"><AlertTriangle /></span><div><h2>Atenção imediata</h2><p>Pontos que exigem ação agora</p></div></div>
          </div>
          <div className="attention-card danger-card">
            <AlertTriangle />
            <div><strong>{overdue.length} chamados fora do SLA</strong><span>Urgência crítica · ação imediata</span></div>
            <ArrowRight />
          </div>
          <div className="attention-card warning-card">
            <CircleGauge />
            <div><strong>{tickets.filter((ticket) => ticket.escalatedAt).length} escalonamentos</strong><span>Gestores e atendimentos notificados</span></div>
            <ArrowRight />
          </div>
          <div className="attention-summary">
            <h3>Detalhe rápido</h3>
            <p><span><Clock3 /> Sem aceite no prazo</span><b>{tickets.filter((ticket) => ticket.status === 'open').length}</b></p>
            <p><span><TimerReset /> Em validação</span><b>{tickets.filter((ticket) => ticket.status === 'awaiting_validation').length}</b></p>
            <p><span><Siren /> Críticos</span><b>{critical}</b></p>
          </div>
        </aside>
      </section>

      <section className="war-grid-charts">
        <div className="panel chart-panel">
          <div className="panel-header compact"><div><div><h2>Chamados por categoria</h2><p>Distribuição dos chamados em aberto</p></div></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 2, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={82} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#4b4a55' }} />
                <Tooltip cursor={{ fill: '#f5f3ff' }} />
                <Bar dataKey="total" fill="#5745d4" radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel provider-performance-panel">
          <div className="panel-header compact"><div><div><h2>Desempenho por fornecedor</h2><p>Indicadores normalizados da operação</p></div></div></div>
          <table className="data-table compact-table">
            <thead><tr><th>Fornecedor</th><th>Chamados</th><th>Aceite médio</th><th>SLA</th></tr></thead>
            <tbody>{providerData.slice(0, 5).map((provider) => (
              <tr key={provider.id}>
                <td><strong>{provider.name}</strong></td>
                <td>{provider.total}</td>
                <td>{provider.averageAcceptance === null ? '—' : `${provider.averageAcceptance} min`}</td>
                <td><span className={`score-pill ${provider.sla < 90 ? 'score-warning' : ''}`}>{provider.sla}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header compact"><div><div><h2>Evolução da operação</h2><p>Abertura e resolução nas últimas horas</p></div></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ left: -24, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="openGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5745d4" stopOpacity={0.25} /><stop offset="95%" stopColor="#5745d4" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceaf2" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="open" stroke="#5745d4" strokeWidth={2.5} fill="url(#openGradient)" />
                <Area type="monotone" dataKey="resolved" stroke="#20a879" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header compact"><div><span className="panel-icon"><Activity /></span><div><h2>Atividades recentes</h2><p>Principais movimentações da operação</p></div></div><button className="text-button">Ver todas <ArrowRight /></button></div>
        <div className="activity-list">
          {tickets.flatMap((ticket) => ticket.timeline.map((entry) => ({ ...entry, ticket }))).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 4).map((entry) => {
            const person = people.find((item) => item.name === entry.actorName);
            return <div className="activity-item" key={entry.id}><Avatar initials={person?.initials ?? entry.actorName.slice(0, 2).toUpperCase()} color={person?.avatarColor} /><div><strong>{entry.actorName}</strong><span>{entry.action} · {entry.ticket.id}</span></div><small>{formatRelativeTime(entry.at, now)}</small></div>;
          })}
        </div>
      </section>
    </>
  );
}

function formatRelativeTime(date: string, now: string) {
  const minutes = Math.max(0, Math.round((new Date(now).getTime() - new Date(date).getTime()) / 60_000));
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)}h`;
}

export function ticketIsOpen(ticket: Ticket) {
  return !['resolved', 'closed_not_performed'].includes(ticket.status);
}
