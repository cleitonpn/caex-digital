import { Activity, Building2, CheckCircle2, CloudCog, CreditCard, FileText, Headphones, Plus, Save, ServerCog, Store, UsersRound, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { MetricCard } from '../../components/ui';
import { RolePageHeader, RoleWorkspace } from '../../components/RoleWorkspace';
import { getFirebaseServices } from '../../services/firebase';
import {
  createPlatformTenant,
  initialPlatformTenants,
  seedPlatformTenants,
  subscribePlatformTenants,
  updatePlatformTenant,
  type PlatformTenant,
  type PlatformTenantInput,
  type PlatformTenantPlan,
  type PlatformTenantStatus,
} from '../../services/platformTenants';
import { useApp } from '../../state/AppContext';

const emptyTenant: PlatformTenantInput = { name: '', plan: 'Professional', status: 'Onboarding', color: '#4431bd', contactName: '', contactEmail: '', contactPhone: '' };

function TenantFormModal({ tenant, onClose, onSave }: { tenant: PlatformTenant | null | undefined; onClose(): void; onSave(input: PlatformTenantInput): Promise<void> }) {
  const [form, setForm] = useState<PlatformTenantInput>(tenant ? { name: tenant.name, plan: tenant.plan, status: tenant.status, color: tenant.color, contactName: tenant.contactName, contactEmail: tenant.contactEmail, contactPhone: tenant.contactPhone ?? '' } : emptyTenant);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, name: form.name.trim(), contactName: form.contactName.trim(), contactEmail: form.contactEmail.trim().toLowerCase(), contactPhone: form.contactPhone?.trim() });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a organizadora.');
    } finally { setSaving(false); }
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal-card platform-tenant-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><Building2 /></span><span><h2>{tenant ? 'Gerenciar organizadora' : 'Nova organizadora'}</h2><p>Contrato, contato principal e estágio de implantação.</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
    <div className="modal-form-grid">
      <label className="form-field full-span"><span>Nome da organizadora</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="Ex.: Nexo Eventos" /></label>
      <label className="form-field"><span>Plano</span><select value={form.plan} onChange={(event) => setForm((current) => ({ ...current, plan: event.target.value as PlatformTenantPlan }))}><option>Piloto</option><option>Professional</option><option>Enterprise</option></select></label>
      <label className="form-field"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PlatformTenantStatus }))}><option>Onboarding</option><option>Implantação</option><option>Ativo</option><option>Operando</option><option>Suspenso</option></select></label>
      <label className="form-field"><span>Contato principal</span><input value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} required /></label>
      <label className="form-field"><span>E-mail</span><input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} required /></label>
      <label className="form-field"><span>WhatsApp ou telefone</span><input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} placeholder="+55 11 99999-9999" /></label>
      <label className="form-field"><span>Cor de identificação</span><div className="platform-color-field"><input type="color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} /><b>{form.color}</b></div></label>
      {error && <div className="login-feedback error full-span" role="alert">{error}</div>}
    </div>
    <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}><Save /> {saving ? 'Salvando...' : 'Salvar organizadora'}</button></footer>
  </form></div>;
}

function ContractsModal({ tenants, onClose, onManage }: { tenants: PlatformTenant[]; onClose(): void; onManage(tenant: PlatformTenant): void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card platform-contracts-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><FileText /></span><span><h2>Contratos das organizadoras</h2><p>Planos, consumo atual e situação de cada ambiente.</p></span></div><button className="icon-button" onClick={onClose}><X /></button></header>
    <div className="platform-contract-list">{tenants.map((tenant) => <article key={tenant.id}><span className="tenant-logo" style={{ background: tenant.color }}>{tenant.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><div><strong>{tenant.name}</strong><small>{tenant.contactName} · {tenant.contactEmail}</small></div><span><b>{tenant.plan}</b><small>{tenant.events} eventos · {tenant.users} usuários</small></span><i className={`tenant-status status-${tenant.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>{tenant.status}</i><button className="button button-ghost button-small" onClick={() => onManage(tenant)}>Gerenciar</button></article>)}</div>
    <footer><button className="button button-primary" onClick={onClose}>Concluir</button></footer>
  </section></div>;
}

function OperationsModal({ tenants, onClose, onManage }: { tenants: PlatformTenant[]; onClose(): void; onManage(tenant: PlatformTenant): void }) {
  const pending = tenants.filter((tenant) => ['Onboarding', 'Implantação'].includes(tenant.status));
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card platform-operations-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><Headphones /></span><span><h2>Fila operacional</h2><p>Implantações que precisam de acompanhamento da equipe CAEXOne.</p></span></div><button className="icon-button" onClick={onClose}><X /></button></header>
    <div className="platform-operation-list">{pending.map((tenant, index) => <article key={tenant.id}><span>{index + 1}</span><div><strong>{tenant.name}</strong><small>{tenant.status === 'Onboarding' ? 'Validar contrato, identidade e usuários iniciais' : 'Revisar importação e integrações do ambiente'}</small></div><b>{tenant.status}</b><button className="button button-ghost button-small" onClick={() => onManage(tenant)}>Abrir</button></article>)}{pending.length === 0 && <p>Nenhuma implantação pendente.</p>}</div>
    <footer><button className="button button-primary" onClick={onClose}>Fechar fila</button></footer>
  </section></div>;
}

export function PlatformAdminPage() {
  const app = useApp();
  const [tenants, setTenants] = useState(initialPlatformTenants);
  const [formTenant, setFormTenant] = useState<PlatformTenant | null | undefined>(undefined);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (app.dataMode !== 'firebase') return;
    const services = getFirebaseServices();
    if (!services) return;
    let seeding = false;
    const unsubscribe = subscribePlatformTenants(services.firestore, (items) => {
      if (!items.length && !seeding) {
        seeding = true;
        void seedPlatformTenants(services.firestore).catch((error: unknown) => setSyncMessage(error instanceof Error ? error.message : 'Não foi possível criar os ambientes iniciais.'));
        return;
      }
      setTenants(items);
      setSyncMessage('');
    }, (error) => setSyncMessage(`Não foi possível carregar as organizadoras: ${error.message}`));
    return unsubscribe;
  }, [app.dataMode]);

  const totals = useMemo(() => ({ exhibitors: tenants.reduce((sum, tenant) => sum + tenant.exhibitors, 0), users: tenants.reduce((sum, tenant) => sum + tenant.users, 0) }), [tenants]);
  const saveTenant = async (input: PlatformTenantInput) => {
    const services = getFirebaseServices();
    if (app.dataMode === 'firebase') {
      if (!services) throw new Error('Firebase indisponível. Atualize a página e tente novamente.');
      if (formTenant) await updatePlatformTenant(services.firestore, formTenant, input);
      else await createPlatformTenant(services.firestore, input);
      return;
    }
    if (formTenant) setTenants((current) => current.map((tenant) => tenant.id === formTenant.id ? { ...tenant, ...input, updatedAt: new Date().toISOString() } : tenant));
    else setTenants((current) => [...current, { id: `tenant-${Date.now()}`, events: 0, users: 0, exhibitors: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...input }]);
  };
  const manage = (tenant: PlatformTenant) => { setContractsOpen(false); setOperationsOpen(false); setFormTenant(tenant); };

  return <RoleWorkspace roleLabel="Administrador da plataforma" organization="CAEXOne" personId="ana-ribeiro" accent="#18181b" navigationVariant="platform">
    <RolePageHeader eyebrow="Operação SaaS multi-tenant" title="Administração da plataforma" description="Acompanhe organizadoras, eventos, implantação e saúde técnica do produto." actions={<button className="button button-primary" onClick={() => setFormTenant(null)}><Plus /> Nova organizadora</button>} />
    {syncMessage && <div className="login-feedback error platform-sync-message" role="alert">{syncMessage}</div>}
    <section className="metrics-grid role-metrics"><MetricCard icon={Building2} value={tenants.length} label="Organizadoras" trend={`${tenants.filter((tenant) => ['Ativo', 'Operando'].includes(tenant.status)).length} ativas · ${tenants.filter((tenant) => ['Onboarding', 'Implantação'].includes(tenant.status)).length} em implantação`} /><MetricCard icon={Store} value={totals.exhibitors} label="Expositores ativos" trend={`Em ${tenants.reduce((sum, tenant) => sum + tenant.events, 0)} eventos`} /><MetricCard icon={UsersRound} value={totals.users} label="Usuários mensais" trend="Contas das organizadoras" /><MetricCard icon={Activity} value="99,98%" label="Disponibilidade" trend="Últimos 30 dias" tone="success" /></section>

    <section className="platform-grid role-queue"><article className="panel tenant-panel"><div className="role-section-header"><div><span className="panel-icon"><Building2 /></span><span><h2>Organizadoras clientes</h2><p>Ambientes e consumo da plataforma</p></span></div><button className="button button-ghost" onClick={() => setContractsOpen(true)}>Ver contratos</button></div><div className="tenant-grid">{tenants.map((tenant) => <article key={tenant.id}><span className="tenant-logo" style={{ background: tenant.color }}>{tenant.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><div className="tenant-title"><h3>{tenant.name}</h3><span className={`tenant-status status-${tenant.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>{tenant.status}</span></div><p><span><b>{tenant.events}</b> eventos</span><span><b>{tenant.users}</b> usuários</span><span><b>{tenant.exhibitors}</b> expositores</span></p><footer><span><CreditCard /> {tenant.plan}</span><button onClick={() => manage(tenant)}>Gerenciar</button></footer></article>)}</div></article><aside className="platform-side"><section className="panel platform-health"><div className="role-section-header"><div><span className="panel-icon"><ServerCog /></span><span><h2>Saúde dos serviços</h2><p>Ambiente de produção</p></span></div></div><div><p><span><i /> Aplicação web</span><b>Operacional</b></p><p><span><i /> Firestore</span><b>Operacional</b></p><p><span><i /> Cloud Functions</span><b>Operacional</b></p><p><span><i className="warning" /> WhatsApp API</span><b className="warning-text">Configuração pendente</b></p><p><span><i className="warning" /> Resend</span><b className="warning-text">Configuração pendente</b></p></div></section><section className="panel platform-support"><Headphones /><div><strong>{tenants.filter((tenant) => ['Onboarding', 'Implantação'].includes(tenant.status)).length} solicitações de implantação</strong><p>Importação e organização de dados contratadas à parte.</p></div><button className="button button-ghost full-button" onClick={() => setOperationsOpen(true)}>Abrir fila operacional</button></section></aside></section>

    <section className="panel onboarding-pipeline role-agenda role-team"><div className="role-section-header"><div><span className="panel-icon"><CloudCog /></span><span><h2>Pipeline de implantação</h2><p>Etapas necessárias para colocar uma nova organizadora em produção</p></span></div></div><div className="onboarding-steps"><span className="done"><i><CheckCircle2 /></i><strong>Contrato</strong><small>Plano e limites</small></span><b /><span className="done"><i><CheckCircle2 /></i><strong>Identidade</strong><small>Marca e domínio</small></span><b /><span className="active"><i>3</i><strong>Dados</strong><small>Importação inicial</small></span><b /><span><i>4</i><strong>Integrações</strong><small>E-mail e WhatsApp</small></span><b /><span><i>5</i><strong>Go live</strong><small>Validação final</small></span></div></section>

    {formTenant !== undefined && <TenantFormModal key={formTenant?.id ?? 'new'} tenant={formTenant} onClose={() => setFormTenant(undefined)} onSave={saveTenant} />}
    {contractsOpen && <ContractsModal tenants={tenants} onClose={() => setContractsOpen(false)} onManage={manage} />}
    {operationsOpen && <OperationsModal tenants={tenants} onClose={() => setOperationsOpen(false)} onManage={manage} />}
  </RoleWorkspace>;
}
