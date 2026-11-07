import { Building2, ChevronRight, Network, Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ResponsibilityMatrixModal } from '../components/ResponsibilityMatrixModal';
import { CoverageModal, PersonFormModal, ProviderDrawer, ProviderFormModal } from '../components/ProviderManagement';
import { categoryById } from '../domain/catalog';
import { useApp } from '../state/AppContext';
import { Avatar, PageHeader } from '../components/ui';

export function ProvidersPage() {
  const app = useApp();
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixExhibitorId, setMatrixExhibitorId] = useState(app.exhibitors[0]?.id ?? '');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(false);
  const providers = app.companies.filter((company) => company.type === 'provider');
  const matrixExhibitor = app.exhibitors.find((item) => item.id === matrixExhibitorId) ?? null;
  const selectedProvider = selectedProviderId ? providers.find((provider) => provider.id === selectedProviderId) ?? null : null;
  return (
    <>
      <PageHeader title="Fornecedores" description="Empresas, escopos contratados e desempenho por feira." actions={<button className="button button-primary" onClick={() => { setEditingProvider(false); setProviderFormOpen(true); }}><Plus size={17} /> Novo fornecedor</button>} />
      <section className="provider-grid">
        {providers.map((provider) => {
          const assignments = app.assignments.filter((item) => item.providerId === provider.id);
          const exhibitorIds = new Set(assignments.map((item) => item.exhibitorId));
          const members = app.people.filter((person) => person.companyId === provider.id);
          const tickets = app.tickets.filter((ticket) => ticket.providerId === provider.id);
          const open = tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status)).length;
          const breached = tickets.filter((ticket) => new Date(ticket.resolveDueAt) < new Date(app.now) && ticket.status !== 'resolved').length;
          const sla = tickets.length ? Math.round(((tickets.length - breached) / tickets.length) * 100) : 100;
          return <article className="panel provider-card" key={provider.id}>
            <div className="provider-heading"><span className="company-logo"><Building2 /></span><div><h2>{provider.name}</h2><p>{provider.specialties?.map((item) => categoryById[item].shortLabel).join(' · ')}</p></div><button className="icon-button" onClick={() => setSelectedProviderId(provider.id)} aria-label={`Abrir ${provider.name}`}><ChevronRight /></button></div>
            <div className="provider-kpis"><span><b>{exhibitorIds.size}</b><small>stands</small></span><span><b>{open}</b><small>chamados ativos</small></span><span><b className={sla < 90 ? 'warning-text' : 'success-text'}>{sla}%</b><small>dentro do SLA</small></span></div>
            <div className="provider-team"><span>Equipe vinculada</span><div>{members.slice(0, 4).map((person) => <Avatar key={person.id} initials={person.initials} color={person.avatarColor} size="sm" />)}{members.length === 0 && <small>Nenhum usuário cadastrado</small>}</div></div>
            <div className="provider-scope"><Network size={16} /><span>{assignments.length} atribuições na matriz de responsabilidade</span></div>
          </article>;
        })}
      </section>

      <section className="panel responsibility-panel">
        <div className="panel-header"><div><span className="panel-icon"><ShieldCheck /></span><div><h2>Matriz de responsabilidades</h2><p>Fornecedor responsável por stand, serviço e fase operacional</p></div></div><div className="matrix-panel-actions"><select aria-label="Expositor para editar" value={matrixExhibitorId} onChange={(event) => setMatrixExhibitorId(event.target.value)}>{app.exhibitors.map((exhibitor) => <option value={exhibitor.id} key={exhibitor.id}>{exhibitor.name} · {exhibitor.stand}</option>)}</select><button className="button button-ghost" onClick={() => setMatrixOpen(true)}>Editar matriz</button></div></div>
        <div className="queue-table-wrap"><table className="data-table"><thead><tr><th>Expositor</th><th>Stand</th><th>Serviço</th><th>Fases</th><th>Fornecedor</th><th>Contratação</th></tr></thead><tbody>{app.assignments.slice(0, 14).map((assignment) => {
          const exhibitor = app.exhibitors.find((item) => item.id === assignment.exhibitorId)!;
          const provider = providers.find((item) => item.id === assignment.providerId);
          return <tr key={assignment.id}><td><strong>{exhibitor.name}</strong></td><td>{exhibitor.stand}</td><td>{categoryById[assignment.category].label}</td><td><span className="phase-list">{assignment.phases.map((phase) => <i key={phase}>{phase === 'setup' ? 'Montagem' : phase === 'event' ? 'Evento' : 'Desmontagem'}</i>)}</span></td><td>{provider?.name}</td><td><span className={`contract-${assignment.contractStatus}`}>{assignment.contractStatus === 'included' ? 'Incluso' : assignment.contractStatus === 'contracted' ? 'Contratado' : 'Não contratado'}</span></td></tr>;
        })}</tbody></table></div>
      </section>
      <ResponsibilityMatrixModal open={matrixOpen} exhibitor={matrixExhibitor} onClose={() => setMatrixOpen(false)} />
      <ProviderDrawer provider={selectedProvider} onClose={() => setSelectedProviderId(null)} onEdit={() => { setEditingProvider(true); setProviderFormOpen(true); }} onAddPerson={() => setPersonFormOpen(true)} onCoverage={() => setCoverageOpen(true)} />
      <ProviderFormModal open={providerFormOpen} provider={editingProvider ? selectedProvider : null} onClose={() => setProviderFormOpen(false)} onSaved={(provider) => setSelectedProviderId(provider.id)} />
      <PersonFormModal open={personFormOpen} companyId={selectedProvider?.id} onClose={() => setPersonFormOpen(false)} />
      <CoverageModal open={coverageOpen} provider={selectedProvider} onClose={() => setCoverageOpen(false)} />
    </>
  );
}
