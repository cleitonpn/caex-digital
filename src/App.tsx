import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';

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

export function App() {
  return (
    <Suspense fallback={<div className="route-loading"><span /> Carregando operação...</div>}>
      <Routes>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/perfis" element={<RoleSelectorPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/gestor" element={<ManagerPage />} />
        <Route path="/organizador/producao" element={<OrganizerProducerPage />} />
        <Route path="/organizador/atendimento" element={<OrganizerServicePage />} />
        <Route path="/fornecedor" element={<ProviderAdminPage />} />
        <Route path="/fornecedor/atendimento" element={<ProviderServicePage />} />
        <Route path="/fornecedor/producao" element={<ProviderProducerPage />} />
        <Route path="/admin-plataforma" element={<PlatformAdminPage />} />
        <Route element={<AppLayout />}>
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
