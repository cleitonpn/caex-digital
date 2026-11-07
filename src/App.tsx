import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { useApp } from './state/AppContext';

const WarRoomPage = lazy(async () => ({ default: (await import('./pages/WarRoomPage')).WarRoomPage }));
const TicketsPage = lazy(async () => ({ default: (await import('./pages/TicketsPage')).TicketsPage }));
const ExhibitorsPage = lazy(async () => ({ default: (await import('./pages/ExhibitorsPage')).ExhibitorsPage }));
const ProvidersPage = lazy(async () => ({ default: (await import('./pages/ProvidersPage')).ProvidersPage }));
const TeamsPage = lazy(async () => ({ default: (await import('./pages/TeamsPage')).TeamsPage }));
const ImportPage = lazy(async () => ({ default: (await import('./pages/ImportPage')).ImportPage }));
const SettingsPage = lazy(async () => ({ default: (await import('./pages/SettingsPage')).SettingsPage }));
const EventsPage = lazy(async () => ({ default: (await import('./pages/EventsPage')).EventsPage }));
const ReportsPage = lazy(async () => ({ default: (await import('./pages/ReportsPage')).ReportsPage }));
const UsersPage = lazy(async () => ({ default: (await import('./pages/UsersPage')).UsersPage }));
const NotificationsPage = lazy(async () => ({ default: (await import('./pages/NotificationsPage')).NotificationsPage }));
const PortalPage = lazy(async () => ({ default: (await import('./pages/PortalPage')).PortalPage }));
const LoginPage = lazy(async () => ({ default: (await import('./pages/LoginPage')).LoginPage }));
const RoleSelectorPage = lazy(async () => ({ default: (await import('./pages/RoleSelectorPage')).RoleSelectorPage }));
const ManagerPage = lazy(async () => ({ default: (await import('./pages/roles/ManagerPage')).ManagerPage }));
const OrganizerProducerPage = lazy(async () => ({ default: (await import('./pages/roles/OrganizerProducerPage')).OrganizerProducerPage }));
const OrganizerServicePage = lazy(async () => ({ default: (await import('./pages/roles/OrganizerServicePage')).OrganizerServicePage }));
const ProviderAdminPage = lazy(async () => ({ default: (await import('./pages/roles/ProviderAdminPage')).ProviderAdminPage }));
const ProviderServicePage = lazy(async () => ({ default: (await import('./pages/roles/ProviderServicePage')).ProviderServicePage }));
const ProviderProducerPage = lazy(async () => ({ default: (await import('./pages/roles/ProviderProducerPage')).ProviderProducerPage }));
const PlatformAdminPage = lazy(async () => ({ default: (await import('./pages/roles/PlatformAdminPage')).PlatformAdminPage }));

function Protected({ children }: { children: React.ReactNode }) {
  const app = useApp();
  if (app.dataMode === 'demo') return children;
  if (app.syncStatus === 'signed_out') return <Navigate to="/entrar" replace />;
  if (app.syncStatus === 'loading') return <div className="route-loading"><span /> Conectando ao Firebase...</div>;
  if (app.syncStatus === 'error') return <main className="sync-error-page"><h1>Não foi possível carregar a operação</h1><p>{app.syncError}</p><a href="#/entrar">Voltar ao acesso</a></main>;
  return children;
}

export function App() {
  return (
    <Suspense fallback={<div className="route-loading"><span /> Carregando operação...</div>}>
      <Routes>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/perfis" element={<Protected><RoleSelectorPage /></Protected>} />
        <Route path="/portal" element={<Protected><PortalPage /></Protected>} />
        <Route path="/gestor" element={<Protected><ManagerPage /></Protected>} />
        <Route path="/organizador/producao" element={<Protected><OrganizerProducerPage /></Protected>} />
        <Route path="/organizador/atendimento" element={<Protected><OrganizerServicePage /></Protected>} />
        <Route path="/fornecedor" element={<Protected><ProviderAdminPage /></Protected>} />
        <Route path="/fornecedor/atendimento" element={<Protected><ProviderServicePage /></Protected>} />
        <Route path="/fornecedor/producao" element={<Protected><ProviderProducerPage /></Protected>} />
        <Route path="/admin-plataforma" element={<Protected><PlatformAdminPage /></Protected>} />
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route index element={<WarRoomPage />} />
          <Route path="chamados" element={<TicketsPage />} />
          <Route path="expositores" element={<ExhibitorsPage />} />
          <Route path="fornecedores" element={<ProvidersPage />} />
          <Route path="equipes" element={<TeamsPage />} />
          <Route path="eventos" element={<EventsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="importar" element={<ImportPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
