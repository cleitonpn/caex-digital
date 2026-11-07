import { Building2, Check, ClipboardCheck, Edit3, Mail, Phone, Plus, ShieldCheck, UserPlus, UsersRound, Wrench, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '../domain/catalog';
import type { Company, Person, ServiceCategoryId, UserRole } from '../domain/types';
import { type PersonInput, type ProviderInput, useApp } from '../state/AppContext';
import { Avatar, PriorityBadge, StatusBadge } from './ui';

const roleLabels: Partial<Record<UserRole, string>> = {
  organizer_admin: 'Administrador da organizadora',
  event_manager: 'Gestor da feira',
  organizer_producer: 'Produtor da organizadora',
  organizer_service: 'Atendimento da organizadora',
  provider_admin: 'Administrador do fornecedor',
  provider_service: 'Atendimento do fornecedor',
  provider_producer: 'Produtor do fornecedor',
};

export function ProviderFormModal({ open, provider, onClose, onSaved }: { open: boolean; provider?: Company | null; onClose(): void; onSaved(provider: Company): void }) {
  const app = useApp();
  const [form, setForm] = useState<ProviderInput>({ name: '', specialties: [], contactName: '', contactEmail: '', contactPhone: '' });
  useEffect(() => {
    if (!open) return;
    setForm(provider ? { name: provider.name, specialties: provider.specialties ?? [], contactName: provider.contactName ?? '', contactEmail: provider.contactEmail ?? '', contactPhone: provider.contactPhone ?? '' } : { name: '', specialties: [], contactName: '', contactEmail: '', contactPhone: '' });
  }, [open, provider]);
  if (!open) return null;
  const toggleSpecialty = (category: ServiceCategoryId) => setForm((current) => ({ ...current, specialties: current.specialties.includes(category) ? current.specialties.filter((item) => item !== category) : [...current.specialties, category] }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clean = { ...form, name: form.name.trim(), contactName: form.contactName?.trim(), contactEmail: form.contactEmail?.trim(), contactPhone: form.contactPhone?.trim() };
    if (provider) {
      app.updateProvider(provider.id, clean);
      onSaved({ ...provider, ...clean });
    } else onSaved(app.addProvider(clean));
    onClose();
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal-card provider-form-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><Building2 /></span><span><h2>{provider ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h2><p>Empresa, contato operacional e serviços prestados.</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
    <div className="modal-form-grid">
      <label className="form-field full-span"><span>Nome da empresa</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="Ex.: MontaExpo" /></label>
      <label className="form-field"><span>Contato principal</span><input value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} /></label>
      <label className="form-field"><span>E-mail operacional</span><input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} /></label>
      <label className="form-field full-span"><span>WhatsApp ou telefone</span><input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} placeholder="+55 11 99999-9999" /></label>
      <fieldset className="specialty-picker full-span"><legend>Serviços prestados</legend>{serviceCategories.map((category) => <label className={form.specialties.includes(category.id) ? 'selected' : ''} key={category.id}><input type="checkbox" checked={form.specialties.includes(category.id)} onChange={() => toggleSpecialty(category.id)} /><span><Check /><strong>{category.label}</strong><small>{category.description}</small></span></label>)}</fieldset>
    </div>
    <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={!form.specialties.length}>Salvar fornecedor</button></footer>
  </form></div>;
}

export function PersonFormModal({ open, companyId, onClose, onSaved }: { open: boolean; companyId?: string; onClose(): void; onSaved?(person: Person): void }) {
  const app = useApp();
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId ?? app.event.tenantId);
  useEffect(() => { if (open) setSelectedCompanyId(companyId ?? app.event.tenantId); }, [open, companyId, app.event.tenantId]);
  if (!open) return null;
  const company = app.companies.find((item) => item.id === selectedCompanyId);
  const roles = company?.type === 'provider' ? ['provider_admin', 'provider_service', 'provider_producer'] as UserRole[] : ['organizer_admin', 'event_manager', 'organizer_service', 'organizer_producer'] as UserRole[];
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const role = String(data.get('role')) as UserRole;
    const input: PersonInput = { companyId: selectedCompanyId, name: String(data.get('name')), email: String(data.get('email')), phone: String(data.get('phone') || '') || undefined, role, title: roleLabels[role] ?? 'Equipe operacional' };
    const person = app.addPerson(input);
    onSaved?.(person);
    onClose();
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal-card person-form-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><UserPlus /></span><span><h2>Convidar pessoa</h2><p>O convite será enviado por e-mail e, quando informado, por WhatsApp.</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
    <div className="modal-form-grid"><label className="form-field full-span"><span>Nome completo</span><input name="name" required /></label><label className="form-field"><span>E-mail</span><input name="email" type="email" required /></label><label className="form-field"><span>WhatsApp</span><input name="phone" placeholder="+55 11 99999-9999" /></label>{!companyId && <label className="form-field"><span>Empresa</span><select value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)}>{app.companies.filter((item) => item.type !== 'exhibitor').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label className="form-field"><span>Perfil</span><select name="role">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label></div>
    <div className="invite-channel-preview"><Mail /><span><strong>Convite de acesso</strong><small>Link provisório válido por 72 horas. O usuário criará a senha no primeiro acesso.</small></span></div>
    <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary"><UserPlus /> Enviar convite</button></footer>
  </form></div>;
}

export function CoverageModal({ open, provider, onClose }: { open: boolean; provider: Company | null; onClose(): void }) {
  const app = useApp();
  const assignments = provider ? app.assignments.filter((item) => item.providerId === provider.id) : [];
  const producers = provider ? app.people.filter((person) => person.companyId === provider.id && person.role === 'provider_producer') : [];
  const services = provider ? app.people.filter((person) => person.companyId === provider.id && person.role === 'provider_service') : [];
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [service, setService] = useState('');
  useEffect(() => {
    if (!open) return;
    setPrimary(assignments[0]?.primaryProducerId ?? producers[0]?.id ?? '');
    setSecondary(assignments[0]?.secondaryProducerId ?? producers[1]?.id ?? '');
    setService(assignments[0]?.providerServiceId ?? services[0]?.id ?? '');
  }, [open, provider]);
  if (!open || !provider) return null;
  const save = () => { app.setProviderCoverage(provider.id, primary, secondary || undefined, service || undefined); onClose(); };
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card coverage-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><UsersRound /></span><span><h2>Plantão e cobertura</h2><p>{provider.name} · aplicação em {assignments.length} responsabilidades</p></span></div><button className="icon-button" onClick={onClose}><X /></button></header>
    <div className="coverage-modal-body"><div className="coverage-explanation"><ShieldCheck /><span><strong>Cobertura automática</strong><small>Quando o principal estiver ausente, os chamados e clientes aparecem para o produtor secundário.</small></span></div><label className="form-field"><span>Produtor principal</span><select value={primary} onChange={(event) => setPrimary(event.target.value)} required><option value="">Selecione</option>{producers.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.available ? 'Disponível' : 'Ausente'}</option>)}</select></label><label className="form-field"><span>Produtor secundário</span><select value={secondary} onChange={(event) => setSecondary(event.target.value)}><option value="">Sem cobertura</option>{producers.filter((person) => person.id !== primary).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="form-field"><span>Atendimento responsável</span><select value={service} onChange={(event) => setService(event.target.value)}><option value="">A definir</option>{services.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><div className="coverage-team-list">{producers.map((person) => <div key={person.id}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{person.title}</small></span><label className="availability-toggle"><input type="checkbox" checked={person.available} onChange={() => app.toggleAvailability(person.id)} /><i /><b>{person.available ? 'Disponível' : 'Ausente'}</b></label></div>)}</div></div>
    <footer><button className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={!primary} onClick={save}><Check /> Aplicar cobertura</button></footer>
  </section></div>;
}

export function ProviderDrawer({ provider, onClose, onEdit, onAddPerson, onCoverage }: { provider: Company | null; onClose(): void; onEdit(): void; onAddPerson(): void; onCoverage(): void }) {
  const app = useApp();
  if (!provider) return null;
  const assignments = app.assignments.filter((item) => item.providerId === provider.id);
  const exhibitorIds = [...new Set(assignments.map((item) => item.exhibitorId))];
  const members = app.people.filter((person) => person.companyId === provider.id);
  const tickets = app.tickets.filter((ticket) => ticket.providerId === provider.id);
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="ticket-drawer provider-drawer" onMouseDown={(event) => event.stopPropagation()}>
    <div className="drawer-header"><div><span>FICHA DO FORNECEDOR</span><h2>{provider.name}</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
    <div className="provider-drawer-hero"><span className="company-logo"><Building2 /></span><div><strong>{provider.name}</strong><small>{provider.specialties?.length ?? 0} serviços · {exhibitorIds.length} stands</small></div><button className="button button-ghost button-small" onClick={onEdit}><Edit3 /> Editar</button></div>
    <section className="drawer-section"><h3><Phone /> Contato operacional</h3><div className="provider-contact-grid"><span><strong>{provider.contactName || 'Não informado'}</strong><small>Contato principal</small></span><span><strong>{provider.contactEmail || '—'}</strong><small>E-mail</small></span><span><strong>{provider.contactPhone || '—'}</strong><small>WhatsApp</small></span></div></section>
    <section className="drawer-section"><div className="drawer-section-title"><h3><UsersRound /> Equipe vinculada</h3><button className="button button-ghost button-small" onClick={onAddPerson}><UserPlus /> Convidar</button></div><div className="provider-member-list">{members.map((person) => <div key={person.id}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{person.title} · {person.email}</small></span><i className={person.available ? 'online' : ''} /></div>)}{!members.length && <p>Nenhuma pessoa cadastrada.</p>}</div><button className="button button-ghost full-button" onClick={onCoverage}><ShieldCheck /> Configurar plantão e cobertura</button></section>
    <section className="drawer-section"><h3><Wrench /> Escopos e clientes</h3><div className="provider-client-list">{exhibitorIds.map((id) => { const exhibitor = app.exhibitors.find((item) => item.id === id); const scopes = assignments.filter((item) => item.exhibitorId === id); return <div key={id}><span><strong>{exhibitor?.name}</strong><small>Stand {exhibitor?.stand}</small></span><b>{scopes.length} escopos</b></div>; })}</div></section>
    <section className="drawer-section"><h3><ClipboardCheck /> Chamados recentes</h3><div className="exhibitor-ticket-history">{tickets.slice(0, 4).map((ticket) => <div key={ticket.id}><span><strong>{ticket.id}</strong><small>{ticket.description}</small></span><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></div>)}</div></section>
    <div className="drawer-actions sticky-actions"><button className="button button-primary" onClick={onAddPerson}><Plus /> Adicionar pessoa</button><button className="button button-ghost" onClick={onCoverage}><ShieldCheck /> Cobertura</button></div>
  </aside></div>;
}
