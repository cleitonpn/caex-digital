import {
  Bell,
  CalendarDays,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  FileUp,
  Gauge,
  Menu,
  Search,
  Settings,
  Store,
  TicketCheck,
  UserRoundCog,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { Avatar } from './ui';
import { getFirebaseServices } from '../services/firebase';

const navItems = [
  { to: '/', label: 'Visão geral', icon: Gauge, end: true },
  { to: '/chamados', label: 'Chamados', icon: TicketCheck },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/expositores', label: 'Expositores', icon: Store },
  { to: '/fornecedores', label: 'Fornecedores', icon: Building2 },
  { to: '/equipes', label: 'Equipes', icon: Users },
  { to: '/relatorios', label: 'Relatórios', icon: ChartNoAxesCombined },
  { to: '/usuarios', label: 'Usuários', icon: UserRoundCog },
  { to: '/importar', label: 'Importar dados', icon: FileUp },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const phaseLabel = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };

export function AppLayout() {
  const { event, phase, tickets, dataMode, syncStatus, syncError } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const openProfile = () => {
    if (dataMode === 'firebase') {
      const services = getFirebaseServices();
      if (services) void services.auth.signOut().then(() => navigate('/entrar'));
      return;
    }
    navigate('/perfis');
  };
  const openTickets = tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status)).length;

  const sidebar = (
    <>
      <div className="brand">
        <span className="brand-mark"><Wrench size={18} /></span>
        <span>CAEX<span>One</span></span>
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <Icon size={19} />
            <span>{label}</span>
            {to === '/chamados' && <b>{openTickets}</b>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className={`mode-pill mode-${syncStatus}`}><span /> {dataMode === 'firebase' ? 'Firebase conectado' : 'Modo demonstração'}</div>
        <p title={syncError}>{dataMode === 'firebase' ? syncStatus === 'saving' ? 'Salvando alterações...' : syncStatus === 'loading' ? 'Carregando dados...' : syncStatus === 'signed_out' ? 'Entre para sincronizar' : syncStatus === 'error' ? 'Falha de sincronização' : 'Dados sincronizados' : 'Dados locais, sem Firebase'}</p>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      {mobileOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button drawer-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="app-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <button className="event-selector" onClick={() => navigate('/eventos')}>
            <span className="event-logo">{event.brand.logoText}</span>
            <span><strong>{event.name}</strong><small>{event.venue}</small></span>
            <ChevronDown size={16} />
          </button>
          {phase && <span className="phase-chip"><Wrench size={14} /> {phaseLabel[phase]}</span>}
          <span className="live-chip"><i /> Operação ao vivo</span>
          <div className="topbar-spacer" />
          <label className="global-search">
            <Search size={17} />
            <input aria-label="Buscar" placeholder="Buscar chamados, stands, expositores..." />
          </label>
          <NavLink to="/notificacoes" className={({ isActive }) => `icon-button notification-button${isActive ? ' active' : ''}`} aria-label="Notificações"><Bell /><span /></NavLink>
          <button className="topbar-profile-button" onClick={openProfile} aria-label={dataMode === 'firebase' ? 'Sair' : 'Trocar perfil'}><Avatar initials="AR" color="#5f50d5" /></button>
        </header>
        <div className={`page-content page-${location.pathname.replace('/', '') || 'home'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
