import { Building2, Edit3, ExternalLink, FileText, FolderOpen, Mail, MapPin, Plus, Ruler, ShieldCheck, TicketCheck, UserRound, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { categoryById } from '../domain/catalog';
import type { Exhibitor } from '../domain/types';
import { type ExhibitorInput, useApp } from '../state/AppContext';
import { PriorityBadge, StatusBadge } from './ui';

const emptyForm: ExhibitorInput = { name: '', contactName: '', contactEmail: '', stand: '', pavilion: '', areaSqm: 24, internalTier: 'B', projectUrl: '', memorialUrl: '' };

export function ExhibitorFormModal({ open, exhibitor, onClose, onSaved }: { open: boolean; exhibitor?: Exhibitor | null; onClose(): void; onSaved(exhibitor: Exhibitor): void }) {
  const app = useApp();
  const [form, setForm] = useState<ExhibitorInput>(emptyForm);
  useEffect(() => {
    if (!open) return;
    setForm(exhibitor ? {
      name: exhibitor.name,
      contactName: exhibitor.contactName,
      contactEmail: exhibitor.contactEmail,
      stand: exhibitor.stand,
      pavilion: exhibitor.pavilion,
      areaSqm: exhibitor.areaSqm,
      internalTier: exhibitor.internalTier,
      projectUrl: exhibitor.projectUrl ?? '',
      memorialUrl: exhibitor.memorialUrl ?? '',
    } : emptyForm);
  }, [open, exhibitor]);
  if (!open) return null;

  const set = <K extends keyof ExhibitorInput>(key: K, value: ExhibitorInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = { ...form, name: form.name.trim(), contactName: form.contactName.trim(), contactEmail: form.contactEmail.trim(), stand: form.stand.trim().toUpperCase(), pavilion: form.pavilion.trim(), projectUrl: form.projectUrl?.trim() || undefined, memorialUrl: form.memorialUrl?.trim() || undefined };
    if (exhibitor) {
      app.updateExhibitor(exhibitor.id, clean);
      onSaved({ ...exhibitor, ...clean });
    } else {
      onSaved(app.addExhibitor(clean));
    }
    onClose();
  };

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal-card exhibitor-form-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="modal-heading-icon"><Building2 /></span><span><h2>{exhibitor ? 'Editar expositor' : 'Cadastrar expositor'}</h2><p>Dados do stand, responsável e documentos do projeto.</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
      <div className="modal-form-grid">
        <label className="form-field full-span"><span>Expositor ou empresa</span><input value={form.name} onChange={(event) => set('name', event.target.value)} required placeholder="Ex.: Nuvemshop" /></label>
        <label className="form-field"><span>Responsável</span><input value={form.contactName} onChange={(event) => set('contactName', event.target.value)} required /></label>
        <label className="form-field"><span>E-mail</span><input type="email" value={form.contactEmail} onChange={(event) => set('contactEmail', event.target.value)} required /></label>
        <label className="form-field"><span>Stand</span><input value={form.stand} onChange={(event) => set('stand', event.target.value)} required placeholder="B124" /></label>
        <label className="form-field"><span>Pavilhão ou localização</span><input value={form.pavilion} onChange={(event) => set('pavilion', event.target.value)} required /></label>
        <label className="form-field"><span>Metragem</span><input type="number" min="1" value={form.areaSqm} onChange={(event) => set('areaSqm', Number(event.target.value))} required /></label>
        <label className="form-field"><span>Classificação interna</span><select value={form.internalTier} onChange={(event) => set('internalTier', event.target.value as Exhibitor['internalTier'])}>{['AAA', 'AA', 'A', 'B', 'C'].map((tier) => <option key={tier}>{tier}</option>)}</select><small className="field-help">Visível apenas para organizadora e fornecedores.</small></label>
        <label className="form-field full-span"><span>Link do projeto</span><input type="url" value={form.projectUrl ?? ''} onChange={(event) => set('projectUrl', event.target.value)} placeholder="https://drive.google.com/..." /></label>
        <label className="form-field full-span"><span>Link do memorial descritivo</span><input type="url" value={form.memorialUrl ?? ''} onChange={(event) => set('memorialUrl', event.target.value)} placeholder="https://drive.google.com/..." /></label>
      </div>
      <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit">Salvar expositor</button></footer>
    </form>
  </div>;
}

export function ExhibitorDrawer({ exhibitor, onClose, onEdit, onTicket, onResponsibilities }: { exhibitor: Exhibitor | null; onClose(): void; onEdit(): void; onTicket(): void; onResponsibilities(): void }) {
  const app = useApp();
  const [tab, setTab] = useState<'overview' | 'services' | 'tickets'>('overview');
  if (!exhibitor) return null;
  const assignments = app.assignments.filter((item) => item.exhibitorId === exhibitor.id);
  const tickets = app.tickets.filter((ticket) => ticket.exhibitorId === exhibitor.id);
  const providers = new Set(assignments.map((item) => item.providerId));

  return <div className="drawer-backdrop" onMouseDown={onClose}>
    <aside className="ticket-drawer exhibitor-drawer" onMouseDown={(event) => event.stopPropagation()}>
      <div className="drawer-header"><div><span>FICHA DO EXPOSITOR</span><h2>{exhibitor.name}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
      <div className="exhibitor-drawer-hero"><span className="stand-badge">{exhibitor.stand}</span><div><strong>{exhibitor.pavilion}</strong><small>{exhibitor.areaSqm} m² · Classificação interna {exhibitor.internalTier}</small></div><button className="button button-ghost button-small" onClick={onEdit}><Edit3 /> Editar</button></div>
      <div className="drawer-tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Visão geral</button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Responsabilidades <b>{assignments.length}</b></button><button className={tab === 'tickets' ? 'active' : ''} onClick={() => setTab('tickets')}>Chamados <b>{tickets.length}</b></button></div>

      {tab === 'overview' && <div className="drawer-tab-content"><section className="drawer-section"><h3><UserRound /> Responsável do expositor</h3><div className="exhibitor-contact-card"><span>{exhibitor.contactName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><strong>{exhibitor.contactName}</strong><a href={`mailto:${exhibitor.contactEmail}`}><Mail /> {exhibitor.contactEmail}</a></div></div></section><section className="drawer-section"><h3><FolderOpen /> Projeto e memorial</h3><div className="exhibitor-doc-grid">{exhibitor.projectUrl ? <a href={exhibitor.projectUrl} target="_blank" rel="noreferrer"><FolderOpen /><span><strong>Projeto do stand</strong><small>Abrir documento</small></span><ExternalLink /></a> : <span><FolderOpen /><b>Projeto não informado</b></span>}{exhibitor.memorialUrl ? <a href={exhibitor.memorialUrl} target="_blank" rel="noreferrer"><FileText /><span><strong>Memorial descritivo</strong><small>Abrir documento</small></span><ExternalLink /></a> : <span><FileText /><b>Memorial não informado</b></span>}</div></section><section className="exhibitor-summary-grid"><span><MapPin /><b>{exhibitor.stand}</b><small>Stand</small></span><span><Ruler /><b>{exhibitor.areaSqm} m²</b><small>Área</small></span><span><Building2 /><b>{providers.size}</b><small>Fornecedores</small></span><span><TicketCheck /><b>{tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status)).length}</b><small>Ativos</small></span></section></div>}

      {tab === 'services' && <div className="drawer-tab-content"><section className="drawer-section"><div className="drawer-section-title"><h3><ShieldCheck /> Matriz de responsabilidades</h3><button className="button button-ghost button-small" onClick={onResponsibilities}>Editar matriz</button></div><div className="responsibility-list">{assignments.map((assignment) => { const provider = app.companies.find((company) => company.id === assignment.providerId); return <div key={assignment.id}><span className={`ticket-category-icon category-${assignment.category}`}>{categoryById[assignment.category].shortLabel.slice(0, 2)}</span><span><strong>{categoryById[assignment.category].label}</strong><small>{assignment.phases.map((phase) => phase === 'setup' ? 'Montagem' : phase === 'event' ? 'Evento' : 'Desmontagem').join(' · ')}</small></span><b>{provider?.name}</b></div>; })}</div></section></div>}

      {tab === 'tickets' && <div className="drawer-tab-content"><section className="drawer-section"><h3><TicketCheck /> Histórico de chamados</h3><div className="exhibitor-ticket-history">{tickets.map((ticket) => <div key={ticket.id}><span><strong>{ticket.id} · {categoryById[ticket.reportedCategory].label}</strong><small>{ticket.description}</small></span><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></div>)}{!tickets.length && <p className="drawer-empty">Nenhum chamado registrado para este expositor.</p>}</div></section></div>}

      <div className="drawer-actions sticky-actions"><button className="button button-primary" onClick={onTicket}><Plus /> Abrir chamado</button><button className="button button-ghost" onClick={onResponsibilities}><ShieldCheck /> Responsabilidades</button></div>
    </aside>
  </div>;
}
