import { AlarmClock, CalendarDays, CheckCircle2, Clock3, Palette, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { validateSchedule } from '../domain/schedule';
import type { OperationalPhase, OperationalWindow } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Notice, PageHeader } from '../components/ui';

const phaseLabels: Record<OperationalPhase, string> = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };

export function SettingsPage() {
  const app = useApp();
  const [windows, setWindows] = useState(app.event.windows);
  const [saved, setSaved] = useState(false);
  useEffect(() => setWindows(app.event.windows), [app.event.windows]);
  const issues = validateSchedule(windows);

  const updateWindow = (id: string, field: keyof OperationalWindow, value: string) => {
    setSaved(false);
    setWindows((current) => current.map((window) => window.id === id ? { ...window, [field]: field === 'startsAt' || field === 'endsAt' ? localInputToIso(value, window[field]) : value } : window));
  };
  const addWindow = () => {
    const last = windows.at(-1);
    const start = last?.endsAt ?? '2027-05-15T08:00:00-03:00';
    const end = new Date(new Date(start).getTime() + 8 * 60 * 60_000).toISOString();
    setWindows((current) => [...current, { id: crypto.randomUUID(), phase: 'setup', startsAt: start, endsAt: end }]);
  };
  const save = () => { if (!issues.length) { app.updateWindows(windows); setSaved(true); } };

  return <>
    <PageHeader title="Configurações da feira" description="Períodos operacionais, SLA, identidade visual e regras do evento." actions={<button className="button button-ghost" onClick={app.resetDemo}><RotateCcw size={16} /> Restaurar demonstração</button>} />
    {saved && <Notice title="Agenda operacional salva" tone="success">As regras de roteamento já usarão os novos períodos.</Notice>}
    <section className="settings-grid">
      <div className="settings-nav panel"><button className="active"><CalendarDays /> Períodos operacionais</button><button><AlarmClock /> SLA e escalonamento</button><button><ShieldCheck /> Categorias e regras</button><button><Palette /> Identidade visual</button></div>
      <div className="settings-main">
        <section className="panel settings-section">
          <div className="panel-header"><div><span className="panel-icon"><CalendarDays /></span><div><h2>Agenda operacional</h2><p>Defina cada período com início e fim. Horários podem mudar diariamente.</p></div></div><span className="timezone-chip"><Clock3 /> {app.event.timezone}</span></div>
          <div className="schedule-explanation"><strong>Como o sistema utiliza esses horários</strong><p>O instante de abertura do chamado determina a fase, os serviços disponíveis e o fornecedor responsável. Intervalos entre fases ficam sem operação ativa.</p></div>
          <div className="windows-list">{windows.map((window, index) => <div className="window-row" key={window.id}><span className={`window-index phase-${window.phase}`}>{index + 1}</span><label><span>Fase</span><select value={window.phase} onChange={(event) => updateWindow(window.id, 'phase', event.target.value)}><option value="setup">Montagem</option><option value="event">Evento</option><option value="teardown">Desmontagem</option></select></label><label><span>Início</span><input type="datetime-local" value={isoToLocalInput(window.startsAt)} onChange={(event) => updateWindow(window.id, 'startsAt', event.target.value)} /></label><label><span>Fim</span><input type="datetime-local" value={isoToLocalInput(window.endsAt)} onChange={(event) => updateWindow(window.id, 'endsAt', event.target.value)} /></label><span className={`phase-name phase-${window.phase}`}>{phaseLabels[window.phase]}</span><button className="icon-button danger-button" onClick={() => setWindows((current) => current.filter((item) => item.id !== window.id))}><Trash2 /></button></div>)}</div>
          {issues.length > 0 && <div className="validation-errors">{issues.map((issue, index) => <span key={`${issue.windowId}-${index}`}>{issue.message}</span>)}</div>}
          <div className="settings-actions"><button className="button button-ghost" onClick={addWindow}><Plus size={17} /> Adicionar período</button><button className="button button-primary" onClick={save} disabled={issues.length > 0}><Save size={17} /> Salvar agenda</button></div>
        </section>
        <section className="panel settings-section">
          <div className="panel-header"><div><span className="panel-icon"><AlarmClock /></span><div><h2>SLA padrão</h2><p>Tempos de aceite, resolução e escalonamento por prioridade</p></div></div><button className="button button-ghost">Personalizar</button></div>
          <div className="sla-policy-grid">{app.slaPolicies.map((policy) => <article key={policy.id} className={`sla-policy priority-border-${policy.priority}`}><span className={`badge priority-${policy.priority}`}>{policy.priority === 'critical' ? 'Crítica' : policy.priority === 'high' ? 'Alta' : policy.priority === 'medium' ? 'Média' : 'Baixa'}</span><p><small>Aceite</small><strong>{policy.acceptMinutes} min</strong></p><p><small>Resolução</small><strong>{formatMinutes(policy.resolveMinutes)}</strong></p><p><small>Escalonar após</small><strong>{policy.escalationAfterMinutes ? `${policy.escalationAfterMinutes} min` : 'Imediato'}</strong></p></article>)}</div>
        </section>
      </div>
    </section>
  </>;
}

function isoToLocalInput(value: string) { return value.slice(0, 16); }
function localInputToIso(value: string, previous: string) {
  const offset = previous.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] ?? '-03:00';
  return `${value}:00${offset}`;
}
function formatMinutes(minutes: number) { return minutes >= 60 ? `${minutes / 60}h` : `${minutes} min`; }
