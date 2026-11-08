import {
  Award,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  Headphones,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/ui';
import { categoryById } from '../domain/catalog';
import { useApp } from '../state/AppContext';

const chartColors = ['#4f3dc8', '#168a63', '#de861e', '#2f6fc2', '#a64d79', '#7a6e86'];

export function ReportsPage() {
  const app = useApp();
  const [period, setPeriod] = useState('Operação completa');

  const providerRows = useMemo(() => app.companies.filter((company) => company.type === 'provider').map((company) => {
    const tickets = app.tickets.filter((ticket) => ticket.providerId === company.id);
    const resolved = tickets.filter((ticket) => ticket.resolvedAt);
    const accepted = tickets.filter((ticket) => ticket.acceptedAt);
    const acceptance = averageMinutes(accepted.map((ticket) => [ticket.createdAt, ticket.acceptedAt!]));
    const resolution = averageMinutes(resolved.map((ticket) => [ticket.createdAt, ticket.resolvedAt!]));
    const withinSla = tickets.filter((ticket) => !ticket.resolvedAt || new Date(ticket.resolvedAt).getTime() <= new Date(ticket.resolveDueAt).getTime()).length;
    const sla = tickets.length ? Math.round((withinSla / tickets.length) * 100) : 100;
    const reopens = tickets.reduce((sum, ticket) => sum + ticket.reopens, 0);
    const score = Math.max(0, Math.round(sla - acceptance * .25 - reopens * 3));
    return { id: company.id, name: company.name, total: tickets.length, resolved: resolved.length, acceptance, resolution, sla, reopens, score };
  }).filter((row) => row.total).sort((a, b) => b.score - a.score), [app.companies, app.tickets]);

  const categoryRows = useMemo(() => {
    const counts = new Map<string, number>();
    app.tickets.forEach((ticket) => counts.set(ticket.reportedCategory, (counts.get(ticket.reportedCategory) ?? 0) + 1));
    return [...counts.entries()].map(([id, value], index) => ({ id, name: categoryById[id as keyof typeof categoryById].label, value, color: chartColors[index % chartColors.length] })).sort((a, b) => b.value - a.value);
  }, [app.tickets]);

  const resolved = app.tickets.filter((ticket) => ticket.resolvedAt);
  const accepted = app.tickets.filter((ticket) => ticket.acceptedAt);
  const avgAcceptance = averageMinutes(accepted.map((ticket) => [ticket.createdAt, ticket.acceptedAt!]));
  const avgResolution = averageMinutes(resolved.map((ticket) => [ticket.createdAt, ticket.resolvedAt!]));
  const resolvedWithinSla = resolved.filter((ticket) => new Date(ticket.resolvedAt!).getTime() <= new Date(ticket.resolveDueAt).getTime()).length;
  const slaRate = resolved.length ? Math.round((resolvedWithinSla / resolved.length) * 100) : 100;
  const reopened = app.tickets.reduce((sum, ticket) => sum + ticket.reopens, 0);

  const evolution = [
    { label: '10/mai', opened: 7, resolved: 4, sla: 93 },
    { label: '11/mai', opened: 13, resolved: 9, sla: 90 },
    { label: '12/mai · 08h', opened: 18, resolved: 11, sla: 88 },
    { label: '12/mai · 10h', opened: app.tickets.length, resolved: resolved.length, sla: slaRate },
    { label: '12/mai · 12h', opened: 29, resolved: 23, sla: 91 },
    { label: '12/mai · 14h', opened: 34, resolved: 30, sla: 94 },
  ];

  const exportCsv = () => {
    const header = ['Fornecedor', 'Chamados', 'Resolvidos', 'Aceite médio (min)', 'Resolução média (min)', 'SLA (%)', 'Reaberturas', 'Score'];
    const rows = providerRows.map((row) => [row.name, row.total, row.resolved, row.acceptance, row.resolution, row.sla, row.reopens, row.score]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-fornecedores-expo-summit.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <>
    <PageHeader
      eyebrow="Inteligência operacional"
      title="Relatórios"
      description="Indicadores para avaliar a experiência do expositor e apoiar futuras contratações."
      actions={<><label className="report-period"><CalendarRange /><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Operação completa</option><option>Montagem</option><option>Evento</option><option>Desmontagem</option></select></label><button className="button button-primary" onClick={exportCsv}><Download /> Exportar CSV</button></>}
    />

    <section className="metrics-grid report-metrics">
      <article className="metric-card"><span className="metric-icon metric-primary"><Headphones /></span><div className="metric-copy"><strong>{app.tickets.length}</strong><span>Chamados no período</span></div><small>Todos os canais</small></article>
      <article className="metric-card"><span className="metric-icon metric-success"><ShieldCheck /></span><div className="metric-copy"><strong>{slaRate}%</strong><span>Resolvidos no SLA</span></div><small>Meta contratual: 90%</small></article>
      <article className="metric-card"><span className="metric-icon metric-warning"><Clock3 /></span><div className="metric-copy"><strong>{avgAcceptance} min</strong><span>Tempo médio de aceite</span></div><small>−3 min vs. feira anterior</small></article>
      <article className="metric-card"><span className="metric-icon metric-primary"><CheckCircle2 /></span><div className="metric-copy"><strong>{formatDuration(avgResolution)}</strong><span>Tempo médio de solução</span></div><small>{reopened} reabertura no período</small></article>
    </section>

    <section className="reports-main-grid">
      <article className="panel report-evolution-panel">
        <div className="panel-header"><div><span className="panel-icon"><TrendingUp /></span><div><h2>Evolução da operação</h2><p>Volume acumulado e ritmo de resolução · {period.toLowerCase()}</p></div></div><span className="report-legend"><i className="opened" /> Abertos <i className="resolved" /> Resolvidos</span></div>
        <div className="report-chart-large"><ResponsiveContainer width="100%" height="100%"><AreaChart data={evolution} margin={{ top: 15, right: 24, left: -15, bottom: 0 }}><defs><linearGradient id="reportOpened" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5745d4" stopOpacity=".25"/><stop offset="1" stopColor="#5745d4" stopOpacity="0"/></linearGradient><linearGradient id="reportResolved" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b9a6f" stopOpacity=".2"/><stop offset="1" stopColor="#1b9a6f" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceaf2"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#77727e' }}/><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#77727e' }}/><Tooltip/><Area type="monotone" dataKey="opened" name="Abertos" stroke="#5745d4" strokeWidth={2.5} fill="url(#reportOpened)"/><Area type="monotone" dataKey="resolved" name="Resolvidos" stroke="#1b9a6f" strokeWidth={2.5} fill="url(#reportResolved)"/></AreaChart></ResponsiveContainer></div>
      </article>

      <article className="panel category-report-panel">
        <div className="panel-header"><div><span className="panel-icon"><FileBarChart /></span><div><h2>Origem dos chamados</h2><p>Categorias mais acionadas</p></div></div></div>
        <div className="category-report-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryRows} dataKey="value" innerRadius={46} outerRadius={68} paddingAngle={3} stroke="none">{categoryRows.map((item) => <Cell key={item.id} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><span><b>{app.tickets.length}</b><small>chamados</small></span></div><div className="category-report-list">{categoryRows.slice(0, 5).map((item) => <p key={item.id}><i style={{ background: item.color }} /><span>{item.name}</span><b>{Math.round((item.value / app.tickets.length) * 100)}%</b></p>)}</div></div>
      </article>
    </section>

    <section className="panel provider-report-panel">
      <div className="panel-header"><div><span className="panel-icon"><Award /></span><div><h2>Ranking de fornecedores</h2><p>Score combina SLA, velocidade de aceite e reaberturas</p></div></div><button className="button button-ghost" onClick={() => window.print()}><FileBarChart /> Relatório executivo</button></div>
      <div className="provider-report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={providerRows} margin={{ left: -20, right: 10, top: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceaf2"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#6f6b76' }}/><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 8 }}/><Tooltip/><Bar dataKey="score" name="Score" fill="#5745d4" radius={[6, 6, 0, 0]} barSize={30}/></BarChart></ResponsiveContainer></div>
      <div className="report-table-wrap"><table className="data-table report-table"><thead><tr><th>Posição</th><th>Fornecedor</th><th>Chamados</th><th>Aceite médio</th><th>Solução média</th><th>Reaberturas</th><th>SLA</th><th>Score</th></tr></thead><tbody>{providerRows.map((row, index) => <tr key={row.id}><td><span className={`ranking-position ranking-${index + 1}`}>{index + 1}</span></td><td><strong>{row.name}</strong><small>{row.resolved} chamados concluídos</small></td><td>{row.total}</td><td>{row.acceptance} min</td><td>{formatDuration(row.resolution)}</td><td><span className={row.reopens ? 'report-warning-value' : 'success-text'}>{row.reopens}</span></td><td><span className={`score-pill ${row.sla < 90 ? 'score-warning' : ''}`}>{row.sla}%</span></td><td><b className="provider-score">{row.score}</b></td></tr>)}</tbody></table></div>
    </section>

    <section className="report-insights">
      <article className="panel insight-card positive"><TrendingUp /><div><span>Melhor evolução</span><strong>MontaExpo reduziu o aceite médio em 31%</strong><p>Comparação com a última montagem registrada.</p></div></article>
      <article className="panel insight-card warning"><RotateCcw /><div><span>Ponto de atenção</span><strong>Elétrica concentra chamados de maior impacto</strong><p>Reforce o plantão entre 11h e 14h no primeiro dia.</p></div></article>
      <article className="panel insight-card neutral"><Award /><div><span>Destaque operacional</span><strong>{providerRows[0]?.name ?? 'Fornecedor'} lidera o score geral</strong><p>Bom equilíbrio entre prazo, volume e resolutividade.</p></div></article>
    </section>
  </>;
}

function averageMinutes(ranges: Array<[string, string]>) {
  if (!ranges.length) return 0;
  return Math.max(0, Math.round(ranges.reduce((sum, [start, end]) => sum + (new Date(end).getTime() - new Date(start).getTime()) / 60_000, 0) / ranges.length));
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}
