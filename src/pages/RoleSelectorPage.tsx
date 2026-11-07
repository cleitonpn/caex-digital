import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Crown,
  Headphones,
  ShieldCheck,
  Store,
  UserCog,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui';
import { useApp } from '../state/AppContext';

const profiles = [
  { route: '/', person: 'ana-ribeiro', icon: ShieldCheck, group: 'Organizadora', title: 'Administrador da organizadora', description: 'Configura evento, contratos, cadastros, importações e acessos.', color: '#4431bd', ready: 'Existente' },
  { route: '/gestor', person: 'ana-ribeiro', icon: Crown, group: 'Organizadora', title: 'Gestor da feira', description: 'Decisões críticas, escalonamentos e desempenho geral.', color: '#7c3aed', ready: 'Novo' },
  { route: '/organizador/producao', person: 'rafael-lima', icon: Wrench, group: 'Organizadora', title: 'Produtor da organizadora', description: 'Triagem em campo, rondas, reaberturas e interceptações.', color: '#0f766e', ready: 'Novo' },
  { route: '/organizador/atendimento', person: 'julia-costa', icon: Headphones, group: 'Organizadora', title: 'Atendimento da organizadora', description: 'Central de relacionamento, exceções e validações.', color: '#c05c34', ready: 'Novo' },
  { route: '/fornecedor', person: 'bianca-souza', icon: Building2, group: 'Fornecedor', title: 'Administrador do fornecedor', description: 'Clientes, equipe, contratos e indicadores da empresa.', color: '#2563a9', ready: 'Novo' },
  { route: '/fornecedor/atendimento', person: 'bianca-souza', icon: BriefcaseBusiness, group: 'Fornecedor', title: 'Atendimento do fornecedor', description: 'Distribuição de chamados e comunicação com clientes.', color: '#a64d79', ready: 'Novo' },
  { route: '/fornecedor/producao', person: 'carlos-mendes', icon: UserRoundCheck, group: 'Fornecedor', title: 'Produtor do fornecedor', description: 'Fila inteligente, aceite, execução e conclusão em campo.', color: '#315ec2', ready: 'Novo' },
  { route: '/portal', person: null, icon: Store, group: 'Expositor', title: 'Responsável do expositor', description: 'Documentos, equipe responsável e abertura de chamados.', color: '#b45309', ready: 'Existente' },
  { route: '/portal', person: null, icon: UsersRound, group: 'Expositor', title: 'Equipe do expositor', description: 'Acesso simplificado aos chamados do próprio stand.', color: '#6b7280', ready: 'Compartilhado' },
  { route: '/admin-plataforma', person: 'ana-ribeiro', icon: UserCog, group: 'CAEXOne', title: 'Administrador da plataforma', description: 'Organizadoras, eventos, implantação e saúde da plataforma.', color: '#18181b', ready: 'Novo' },
];

export function RoleSelectorPage() {
  const app = useApp();
  return <main className="profile-selector-page">
    <header className="profile-selector-top"><Link to="/entrar" className="login-brand"><span><Wrench /></span><strong>CAEXOne</strong></Link><div><span className="event-logo">{app.event.brand.logoText}</span><span><strong>{app.event.name}</strong><small>Ambiente de demonstração</small></span></div></header>
    <section className="profile-selector-content"><div className="profile-selector-heading"><span>Visualização por perfil</span><h1>Escolha como deseja testar a plataforma</h1><p>Cada acesso apresenta informações e ações adequadas à responsabilidade daquele usuário.</p></div>
      <div className="profile-groups">{['Organizadora', 'Fornecedor', 'Expositor', 'CAEXOne'].map((group) => <section key={group}><div className="profile-group-title"><h2>{group}</h2><span>{profiles.filter((profile) => profile.group === group).length} perfis</span></div><div className="profile-card-grid">{profiles.filter((profile) => profile.group === group).map((profile) => {
        const person = profile.person ? app.people.find((item) => item.id === profile.person) : undefined;
        const Icon = profile.icon;
        return <Link to={profile.route} className="profile-card" key={profile.title} style={{ '--profile-color': profile.color } as React.CSSProperties}><div className="profile-card-top"><span className="profile-icon"><Icon /></span><span className={`profile-ready profile-ready-${profile.ready.toLowerCase()}`}>{profile.ready}</span></div><h3>{profile.title}</h3><p>{profile.description}</p><div className="profile-person">{person ? <Avatar initials={person.initials} color={person.avatarColor} /> : <span className="profile-generic-avatar"><Store /></span>}<span><strong>{person?.name ?? 'Marina Alves'}</strong><small>{person?.email ?? 'marina@auroratech.example'}</small></span><ArrowRight /></div></Link>;
      })}</div></section>)}</div>
    </section>
  </main>;
}
