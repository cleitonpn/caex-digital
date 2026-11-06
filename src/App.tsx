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
const PortalPage = lazy(async () => ({ default: (await import('./pages/PortalPage')).PortalPage }));

export function App() {
  return (
    <Suspense fallback={<div className="route-loading"><span /> Carregando operação...</div>}>
      <Routes>
        <Route path="/portal" element={<PortalPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<WarRoomPage />} />
          <Route path="chamados" element={<TicketsPage />} />
          <Route path="expositores" element={<ExhibitorsPage />} />
          <Route path="fornecedores" element={<ProvidersPage />} />
          <Route path="equipes" element={<TeamsPage />} />
          <Route path="importar" element={<ImportPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
