import { AlarmClock, BellRing, CalendarDays, CheckCircle2, Clock3, Info, Palette, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import { serviceCategories } from '../domain/catalog';
import { validateSchedule } from '../domain/schedule';
import type { EventBrand, OperationalPhase, OperationalWindow, Priority, SlaPolicy } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Notice, PageHeader } from '../components/ui';

const phaseLabels: Record<OperationalPhase, string> = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };
const priorityLabels: Record<Priority, string> = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
type SettingsTab = 'schedule' | 'sla' | 'rules' | 'brand';

export function SettingsPage() {
  const app = useApp();
  const [tab, setTab] = useState<SettingsTab>('schedule');
  const [windows, setWindows] = useState(app.event.windows);
  const [policies, setPolicies] = useState(app.slaPolicies);
  const [brand, setBrand] = useState<EventBrand>(app.event.brand);
  const [saved, setSaved] = useState('');
  useEffect(() => setWindows(app.event.windows), [app.event.windows]);
  useEffect(() => setPolicies(app.slaPolicies), [app.slaPolicies]);
  useEffect(() => setBrand(app.event.brand), [app.event.brand]);
  const issues = validateSchedule(windows);

  const updateWindow = (id: string, field: keyof OperationalWindow, value: string) => {
    setSaved('');
    setWindows((current) => current.map((window) => window.id === id ? { ...window, [field]: field === 'startsAt' || field === 'endsAt' ? localInputToIso(value, window[field]) : value } : window));
  };
  const addWindow = () => {
    const last = windows.at(-1);
    const start = last?.endsAt ?? '2027-05-15T08:00:00-03:00';
    const end = new Date(new Date(start).getTime() + 8 * 60 * 60_000).toISOString();
    setWindows((current) => [...current, { id: crypto.randomUUID(), phase: 'setup', startsAt: start, endsAt: end }]);
  };
  const saveSchedule = () => { if (!issues.length) { app.updateWindows(windows); setSaved('Agenda operacional salva.'); } };
  const updatePolicy = (id: string, field: keyof SlaPolicy, value: number) => setPolicies((current) => current.map((policy) => policy.id === id ? { ...policy, [field]: value } : policy));
  const savePolicies = () => { app.updateSlaPolicies(policies); setSaved('Políticas de SLA salvas.'); };
  const saveBrand = () => { app.updateEvent({ ...app.event, brand }); setSaved('Identidade visual atualizada.'); };

  return <>
    <PageHeader title="Configurações da feira" description="Períodos operacionais, SLA, identidade visual e regras do evento." actions={<button className="button button-ghost" onClick={app.resetDemo}><RotateCcw size={16} /> Restaurar demonstração</button>} />
    {saved && <Notice title="Configuração atualizada" tone="success">{saved}</Notice>}
    <section className="settings-grid">
      <div className="settings-nav panel">
        <button className={tab === 'schedule' ? 'active' : ''} onClick={() => { setTab('schedule'); setSaved(''); }}><CalendarDays /> Períodos operacionais</button>
        <button className={tab === 'sla' ? 'active' : ''} onClick={() => { setTab('sla'); setSaved(''); }}><AlarmClock /> SLA e escalonamento</button>
        <button className={tab === 'rules' ? 'active' : ''} onClick={() => { setTab('rules'); setSaved(''); }}><ShieldCheck /> Categorias e regras</button>
        <button className={tab === 'brand' ? 'active' : ''} onClick={() => { setTab('brand'); setSaved(''); }}><Palette /> Identidade visual</button>
      </div>
      <div className="settings-main">
        {tab === 'schedule' && <section className="panel settings-section">
          <div className="panel-header"><div><span className="panel-icon"><CalendarDays /></span><div><h2>Agenda operacional</h2><p>Defina cada período com início e fim. Horários podem mudar diariamente.</p></div></div><span className="timezone-chip"><Clock3 /> {app.event.timezone}</span></div>
          <div className="schedule-explanation"><strong>Como o sistema utiliza esses horários</strong><p>O instante de abertura do chamado determina a fase, os serviços disponíveis e o fornecedor responsável. Intervalos entre fases ficam sem operação ativa.</p></div>
          <div className="windows-list">{windows.map((window, index) => <div className="window-row" key={window.id}><span className={`window-index phase-${window.phase}`}>{index + 1}</span><label><span>Fase</span><select value={window.phase} onChange={(event) => updateWindow(window.id, 'phase', event.target.value)}><option value="setup">Montagem</option><option value="event">Evento</option><option value="teardown">Desmontagem</option></select></label><label><span>Início</span><input type="datetime-local" value={isoToLocalInput(window.startsAt)} onChange={(event) => updateWindow(window.id, 'startsAt', event.target.value)} /></label><label><span>Fim</span><input type="datetime-local" value={isoToLocalInput(window.endsAt)} onChange={(event) => updateWindow(window.id, 'endsAt', event.target.value)} /></label><span className={`phase-name phase-${window.phase}`}>{phaseLabels[window.phase]}</span><button className="icon-button danger-button" onClick={() => setWindows((current) => current.filter((item) => item.id !== window.id))}><Trash2 /></button></div>)}</div>
          {issues.length > 0 && <div className="validation-errors">{issues.map((issue, index) => <span key={`${issue.windowId}-${index}`}>{issue.message}</span>)}</div>}
          <div className="settings-actions"><button className="button button-ghost" onClick={addWindow}><Plus size={17} /> Adicionar período</button><button className="button button-primary" onClick={saveSchedule} disabled={issues.length > 0}><Save size={17} /> Salvar agenda</button></div>
        </section>}

        {tab === 'sla' && <section className="panel settings-section sla-editor-section">
          <div className="panel-header"><div><span className="panel-icon"><AlarmClock /></span><div><h2>SLA e escalonamento</h2><p>Defina os tempos máximos usados pelo motor de prioridade e pelas notificações.</p></div></div><button className="button button-primary" onClick={savePolicies}><Save /> Salvar SLA</button></div>
          <div className="settings-info"><BellRing /><span><strong>Escalonamento automático</strong><small>Depois do prazo abaixo, atendimento e gestores recebem alertas pelo aplicativo, e-mail ou WhatsApp conforme suas preferências.</small></span></div>
          <div className="sla-editor-grid">{policies.map((policy) => <article key={policy.id} className={`priority-border-${policy.priority}`}><header><span className={`badge priority-${policy.priority}`}>{priorityLabels[policy.priority]}</span><small>{policy.phase ? phaseLabels[policy.phase] : 'Todas as fases'}</small></header><label><span>Tempo para aceite</span><div><input type="number" min="1" value={policy.acceptMinutes} onChange={(event) => updatePolicy(policy.id, 'acceptMinutes', Number(event.target.value))} /><b>min</b></div></label><label><span>Tempo para solução</span><div><input type="number" min="1" value={policy.resolveMinutes} onChange={(event) => updatePolicy(policy.id, 'resolveMinutes', Number(event.target.value))} /><b>min</b></div></label><label><span>Escalonar depois</span><div><input type="number" min="0" value={policy.escalationAfterMinutes} onChange={(event) => updatePolicy(policy.id, 'escalationAfterMinutes', Number(event.target.value))} /><b>min</b></div></label></article>)}</div>
          <div className="escalation-preview"><strong>Linha de escalonamento</strong><span><i>1</i><b>Fornecedor</b><small>Novo chamado</small></span><em /><span><i>2</i><b>Atendimentos</b><small>SLA em risco</small></span><em /><span><i>3</i><b>Gestores</b><small>Mais de 3h vencido</small></span></div>
        </section>}

        {tab === 'rules' && <section className="panel settings-section rules-section">
          <div className="panel-header"><div><span className="panel-icon"><ShieldCheck /></span><div><h2>Categorias e regras de atendimento</h2><p>Referência usada na abertura, roteamento e priorização dos chamados.</p></div></div></div>
          <div className="rule-highlight"><Info /><span><strong>Responsabilidade depende da fase</strong><small>A matriz definida em Fornecedores determina a empresa acionada em cada stand. A organizadora pode interceptar qualquer chamado.</small></span></div>
          <div className="category-rule-list">{serviceCategories.map((category) => <article key={category.id}><span className={`ticket-category-icon category-${category.id}`}>{category.shortLabel.slice(0, 2)}</span><span><strong>{category.label}</strong><small>{category.description}</small></span><b>Risco-base {category.riskWeight}</b>{category.id === 'cleaning' && <em>Montagem: montadora · Evento: somente se contratado</em>}</article>)}</div>
        </section>}

        {tab === 'brand' && <section className="panel settings-section brand-editor-section">
          <div className="panel-header"><div><span className="panel-icon"><Palette /></span><div><h2>Identidade visual white-label</h2><p>A marca aparece no login, portal do expositor e notificações da feira.</p></div></div><button className="button button-primary" onClick={saveBrand}><Save /> Aplicar identidade</button></div>
          <div className="brand-editor-grid"><div className="brand-form"><label className="form-field"><span>Nome exibido</span><input value={brand.name} onChange={(event) => setBrand((current) => ({ ...current, name: event.target.value }))} /></label><label className="form-field"><span>Sigla ou logo textual</span><input maxLength={4} value={brand.logoText} onChange={(event) => setBrand((current) => ({ ...current, logoText: event.target.value.toUpperCase() }))} /></label><label className="form-field color-input"><span>Cor principal</span><div><input type="color" value={brand.primaryColor} onChange={(event) => setBrand((current) => ({ ...current, primaryColor: event.target.value }))} /><input value={brand.primaryColor} onChange={(event) => setBrand((current) => ({ ...current, primaryColor: event.target.value }))} /></div></label><label className="form-field color-input"><span>Cor de destaque</span><div><input type="color" value={brand.accentColor} onChange={(event) => setBrand((current) => ({ ...current, accentColor: event.target.value }))} /><input value={brand.accentColor} onChange={(event) => setBrand((current) => ({ ...current, accentColor: event.target.value }))} /></div></label></div><div className="brand-preview" style={{ '--preview-primary': brand.primaryColor, '--preview-accent': brand.accentColor } as CSSProperties}><div><span>{brand.logoText || 'EV'}</span><strong>{brand.name || 'Nome da feira'}</strong></div><p>Bem-vindo ao ambiente oficial da feira</p><h3>Tudo para o seu stand em um só lugar.</h3><button onClick={() => { window.location.hash = '#/portal'; }}>Entrar na operação</button><small>Prévia do portal white-label</small></div></div>
        </section>}
      </div>
    </section>
  </>;
}

function isoToLocalInput(value: string) { return value.slice(0, 16); }
function localInputToIso(value: string, previous: string) {
  const offset = previous.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] ?? '-03:00';
  return `${value}:00${offset}`;
}
