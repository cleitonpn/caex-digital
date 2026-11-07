import {
  Building2,
  Check,
  KeyRound,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Avatar, PageHeader } from '../components/ui';
import type { Person, UserRole } from '../domain/types';
import { useApp } from '../state/AppContext';

const roleLabels: Record<UserRole, string> = {
  platform_admin: 'Administrador da plataforma',
  organizer_admin: 'Administrador da organizadora',
  event_manager: 'Gestor da feira',
  organizer_producer: 'Produtor da organizadora',
  organizer_service: 'Atendimento da organizadora',
  provider_admin: 'Administrador do fornecedor',
  provider_service: 'Atendimento do fornecedor',
  provider_producer: 'Produtor do fornecedor',
  exhibitor_admin: 'Responsável do expositor',
  exhibitor_member: 'Equipe do expositor',
};

const roleGroups = {
  organizer: ['organizer_admin', 'event_manager', 'organizer_producer', 'organizer_service'] as UserRole[],
  provider: ['provider_admin', 'provider_service', 'provider_producer'] as UserRole[],
  exhibitor: ['exhibitor_admin', 'exhibitor_member'] as UserRole[],
};

export function UsersPage() {
  const app = useApp();
  const [users, setUsers] = useState<Person[]>(app.people);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState('');

  const filtered = useMemo(() => users.filter((user) => {
    const term = search.toLowerCase().trim();
    return (!term || [user.name, user.email, user.title].some((value) => value.toLowerCase().includes(term)))
      && (companyFilter === 'all' || user.companyId === companyFilter)
      && (roleFilter === 'all' || user.role === roleFilter);
  }), [users, search, companyFilter, roleFilter]);

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? 'Novo usuário');
    const role = String(form.get('role') ?? 'organizer_service') as UserRole;
    const newUser: Person = {
      id: `person-${Date.now()}`,
      companyId: String(form.get('companyId') ?? app.event.tenantId),
      name,
      role,
      title: roleLabels[role],
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
      avatarColor: '#5f50d5',
      email: String(form.get('email') ?? ''),
      active: true,
      available: false,
    };
    setUsers((current) => [newUser, ...current]);
    setInviteSent(newUser.email);
    setShowInvite(false);
    window.setTimeout(() => setInviteSent(''), 4000);
  };

  const toggleUser = (id: string) => setDisabledUsers((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const activeCount = users.filter((user) => !disabledUsers.has(user.id)).length;
  const organizerCount = users.filter((user) => roleGroups.organizer.includes(user.role)).length;
  const providerCount = users.filter((user) => roleGroups.provider.includes(user.role)).length;

  return <>
    <PageHeader
      eyebrow="Acesso e governança"
      title="Usuários e permissões"
      description="Controle quem acessa cada evento, empresa, stand e função da operação."
      actions={<button className="button button-primary" onClick={() => setShowInvite(true)}><UserPlus /> Convidar usuário</button>}
    />

    {inviteSent && <div className="inline-success"><Check /> Convite enviado para <strong>{inviteSent}</strong></div>}

    <section className="metrics-grid user-metrics">
      <article className="metric-card"><span className="metric-icon metric-primary"><UsersRound /></span><div className="metric-copy"><strong>{users.length}</strong><span>Usuários cadastrados</span></div><small>Todas as empresas</small></article>
      <article className="metric-card"><span className="metric-icon metric-success"><UserCheck /></span><div className="metric-copy"><strong>{activeCount}</strong><span>Acessos ativos</span></div><small>{users.length - activeCount} suspenso</small></article>
      <article className="metric-card"><span className="metric-icon metric-primary"><ShieldCheck /></span><div className="metric-copy"><strong>{organizerCount}</strong><span>Equipe organizadora</span></div><small>Gestão e operação</small></article>
      <article className="metric-card"><span className="metric-icon metric-warning"><Building2 /></span><div className="metric-copy"><strong>{providerCount}</strong><span>Usuários de fornecedores</span></div><small>Acesso por escopo</small></article>
    </section>

    <section className="toolbar panel users-toolbar">
      <label className="search-field"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou função" /></label>
      <label className="field-inline"><Building2 /><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}><option value="all">Todas as empresas</option>{app.companies.filter((company) => company.type !== 'exhibitor').map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
      <label className="field-inline"><KeyRound /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Todas as funções</option>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <span className="result-count">{filtered.length} usuários</span>
    </section>

    <section className="panel users-panel">
      <div className="users-table-wrap"><table className="data-table users-table"><thead><tr><th>Usuário</th><th>Empresa</th><th>Função</th><th>Escopo de acesso</th><th>Última atividade</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((user, index) => {
        const company = app.companies.find((item) => item.id === user.companyId);
        const disabled = disabledUsers.has(user.id);
        return <tr key={user.id} className={disabled ? 'user-disabled' : undefined}>
          <td><div className="user-identity"><Avatar initials={user.initials} color={user.avatarColor} /><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td>
          <td><strong>{company?.name ?? 'Expositor'}</strong><small>{company?.type === 'organizer' ? 'Organizadora' : 'Fornecedor parceiro'}</small></td>
          <td><span className={`role-badge role-${user.role.split('_')[0]}`}>{roleLabels[user.role]}</span></td>
          <td><span className="access-scope"><LockKeyhole /> {user.role.includes('organizer') || user.role === 'event_manager' ? 'Todos os stands do evento' : user.role.includes('provider') ? 'Clientes atribuídos' : 'Próprio stand'}</span></td>
          <td><strong>{index < 3 ? 'Agora' : index < 7 ? 'Há 18 min' : 'Ontem'}</strong><small>Web · São Paulo</small></td>
          <td><button className={`user-status-toggle ${disabled ? 'disabled' : 'active'}`} onClick={() => toggleUser(user.id)}><i /> {disabled ? 'Suspenso' : 'Ativo'}</button></td>
          <td><button className="icon-button"><MoreHorizontal /></button></td>
        </tr>;
      })}</tbody></table></div>
    </section>

    <section className="panel permissions-panel">
      <div className="panel-header"><div><span className="panel-icon"><ShieldCheck /></span><div><h2>Matriz de permissões</h2><p>Resumo das capacidades de cada perfil no evento atual</p></div></div><button className="button button-ghost"><KeyRound /> Personalizar perfis</button></div>
      <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>Permissão</th><th>Gestor da feira</th><th>Produtor organizadora</th><th>Atendimento fornecedor</th><th>Produtor fornecedor</th><th>Expositor</th></tr></thead><tbody>
        <PermissionRow label="Ver classificação interna do expositor" values={[true, true, true, true, false]} />
        <PermissionRow label="Abrir e priorizar chamados" values={[true, true, false, false, true]} />
        <PermissionRow label="Aceitar e executar chamados" values={[true, false, true, true, false]} />
        <PermissionRow label="Alterar categoria técnica" values={[true, true, true, true, false]} />
        <PermissionRow label="Interceptar responsabilidade" values={[true, true, false, false, false]} />
        <PermissionRow label="Ver relatórios de fornecedores" values={[true, true, false, false, false]} />
      </tbody></table></div>
    </section>

    {showInvite && <div className="modal-backdrop" onClick={() => setShowInvite(false)}><form className="modal-card invite-modal" onSubmit={invite} onClick={(event) => event.stopPropagation()}>
      <header><div><span className="panel-icon"><UserPlus /></span><div><h2>Convidar usuário</h2><p>O usuário receberá um e-mail com link para criar a senha.</p></div></div><button type="button" className="icon-button" onClick={() => setShowInvite(false)}><X /></button></header>
      <div className="modal-form-grid">
        <label className="form-field full-span"><span>Nome completo</span><input name="name" required placeholder="Nome e sobrenome" /></label>
        <label className="form-field full-span"><span>E-mail profissional</span><input name="email" type="email" required placeholder="nome@empresa.com" /></label>
        <label className="form-field"><span>Empresa</span><select name="companyId" defaultValue={app.event.tenantId}>{app.companies.filter((company) => company.type !== 'exhibitor').map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
        <label className="form-field"><span>Perfil de acesso</span><select name="role" defaultValue="organizer_service">{Object.entries(roleLabels).filter(([role]) => role !== 'platform_admin').map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      </div>
      <div className="invite-note"><Mail /><span><strong>Convite com acesso temporário</strong>O link será válido por 72 horas e o usuário deverá cadastrar uma senha no primeiro acesso.</span></div>
      <footer><button type="button" className="button button-ghost" onClick={() => setShowInvite(false)}>Cancelar</button><button className="button button-primary"><Send /> Enviar convite</button></footer>
    </form></div>}
  </>;
}

function PermissionRow({ label, values }: { label: string; values: boolean[] }) {
  return <tr><td>{label}</td>{values.map((value, index) => <td key={`${label}-${index}`}><span className={value ? 'permission-yes' : 'permission-no'}>{value ? <Check /> : <X />}</span></td>)}</tr>;
}
