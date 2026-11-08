import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  CloudCog,
  Home,
  LogOut,
  Menu,
  ServerCog,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { getFirebaseServices } from '../services/firebase';
import { Avatar } from './ui';

const phaseLabels = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };

export function RoleWorkspace({
  roleLabel,
  organization,
  personId,
  accent = '#4431bd',
  navigationVariant = 'default',
  children,
}: {
  roleLabel: string;
  organization: string;
  personId: string;
  accent?: string;
  navigationVariant?: 'default' | 'platform';
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

  const exit = async () => {
    const services = getFirebaseServices();
    if (app.dataMode === 'firebase' && services) await signOut(services.auth);
    navigate('/entrar', { replace: true });
  };

  const openAccount = () => navigate(app.dataMode === 'firebase' ? '/usuarios' : '/perfis');

  const defaultNavigation = <>
    <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Home /><span>Início</span></button>
    <button onClick={() => scrollTo('.role-queue')}><ClipboardList /><span>Chamados</span></button>
    <button onClick={() => scrollTo('.role-agenda')}><CalendarClock /><span>Agenda</span></button>
    <button onClick={() => scrollTo('.role-team')}><UsersRound /><span>Equipe</span></button>
    <button onClick={() => navigate('/relatorios')}><BarChart3 /><span>Indicadores</span></button>
  </>;
  const platformNavigation = <>
    <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Home /><span>Início</span></button>
    <button onClick={() => scrollTo('.role-queue')}><Building2 /><span>Organizadoras</span></button>
    <button onClick={() => scrollTo('.role-agenda')}><CloudCog /><span>Implantação</span></button>
    <button onClick={() => scrollTo('.platform-health')}><ServerCog /><span>Serviços</span></button>
    <button onClick={() => navigate('/relatorios')}><BarChart3 /><span>Indicadores</span></button>
  </>;
  const navigation = navigationVariant === 'platform' ? platformNavigation : defaultNavigation;

  return <div className="role-workspace" style={{ '--role-accent': accent } as React.CSSProperties}>
    <aside className="role-sidebar">
      <button className="role-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span><Wrench /></span><strong>CAEXOne</strong></button>
      <nav>{navigation}</nav>
      <div className="role-sidebar-footer"><button onClick={openAccount}><ArrowLeftRight /> {app.dataMode === 'firebase' ? 'Minha conta' : 'Trocar perfil'}</button><button onClick={() => void exit()}><LogOut /> Sair</button></div>
    </aside>

    {mobileMenu && <div className="role-mobile-menu" onClick={() => setMobileMenu(false)}><aside onClick={(event) => event.stopPropagation()}><button className="role-brand" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenu(false); }}><span><Wrench /></span><strong>CAEXOne</strong></button><nav>{navigation}</nav><div className="role-sidebar-footer"><button onClick={openAccount}><ArrowLeftRight /> {app.dataMode === 'firebase' ? 'Minha conta' : 'Trocar perfil'}</button><button onClick={() => void exit()}><LogOut /> Sair</button></div></aside></div>}

    <main className="role-main">
      <header className="role-topbar">
        <button className="icon-button role-menu-button" onClick={() => setMobileMenu(true)}><Menu /></button>
        <div className="role-context"><span className="role-event-logo">{app.event.brand.logoText}</span><span><strong>{app.event.name}</strong><small>{organization}</small></span></div>
        {app.phase && <span className="role-phase"><i /> {phaseLabels[app.phase]}</span>}
        <span className="role-label">{roleLabel}</span>
        <div className="role-topbar-spacer" />
        <button className="icon-button notification-button" onClick={() => navigate('/notificacoes')}><Bell /><span /></button>
        <button className="role-profile" onClick={openAccount}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{roleLabel}</small></span></button>
      </header>
      <div className="role-page-content">{children}</div>
      <nav className="role-bottom-nav">{navigation}</nav>
    </main>
  </div>;
}

export function RolePageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="role-page-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{actions && <div>{actions}</div>}</header>;
}
