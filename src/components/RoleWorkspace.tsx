import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { Avatar } from './ui';

const phaseLabels = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };

export function RoleWorkspace({
  roleLabel,
  organization,
  personId,
  accent = '#4431bd',
  children,
}: {
  roleLabel: string;
  organization: string;
  personId: string;
  accent?: string;
  children: ReactNode;
}) {
  const app = useApp();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const person = app.people.find((item) => item.id === personId) ?? app.people[0];

  const scrollTo = (selector: string) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenu(false);
  };

  const navigation = <>
    <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Home /><span>Início</span></button>
    <button onClick={() => scrollTo('.role-queue')}><ClipboardList /><span>Chamados</span></button>
    <button onClick={() => scrollTo('.role-agenda')}><CalendarClock /><span>Agenda</span></button>
    <button onClick={() => scrollTo('.role-team')}><UsersRound /><span>Equipe</span></button>
    <button onClick={() => navigate('/relatorios')}><BarChart3 /><span>Indicadores</span></button>
  </>;

  return <div className="role-workspace" style={{ '--role-accent': accent } as React.CSSProperties}>
    <aside className="role-sidebar">
      <button className="role-brand" onClick={() => navigate('/perfis')}><span><Wrench /></span><strong>CAEXOne</strong></button>
      <nav>{navigation}</nav>
      <div className="role-sidebar-footer"><button onClick={() => navigate('/perfis')}><ArrowLeftRight /> Trocar perfil</button><button onClick={() => navigate('/entrar')}><LogOut /> Sair</button></div>
    </aside>

    {mobileMenu && <div className="role-mobile-menu" onClick={() => setMobileMenu(false)}><aside onClick={(event) => event.stopPropagation()}><button className="role-brand" onClick={() => navigate('/perfis')}><span><Wrench /></span><strong>CAEXOne</strong></button><nav>{navigation}</nav><div className="role-sidebar-footer"><button onClick={() => navigate('/perfis')}><ArrowLeftRight /> Trocar perfil</button></div></aside></div>}

    <main className="role-main">
      <header className="role-topbar">
        <button className="icon-button role-menu-button" onClick={() => setMobileMenu(true)}><Menu /></button>
        <div className="role-context"><span className="role-event-logo">{app.event.brand.logoText}</span><span><strong>{app.event.name}</strong><small>{organization}</small></span></div>
        {app.phase && <span className="role-phase"><i /> {phaseLabels[app.phase]}</span>}
        <span className="role-label">{roleLabel}</span>
        <div className="role-topbar-spacer" />
        <button className="icon-button notification-button" onClick={() => navigate('/notificacoes')}><Bell /><span /></button>
        <button className="role-profile" onClick={() => navigate('/perfis')}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{roleLabel}</small></span></button>
      </header>
      <div className="role-page-content">{children}</div>
      <nav className="role-bottom-nav">{navigation}</nav>
    </main>
  </div>;
}

export function RolePageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="role-page-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{actions && <div>{actions}</div>}</header>;
}
