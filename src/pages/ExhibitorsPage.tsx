import { Building2, ExternalLink, FileText, FolderOpen, Search, SlidersHorizontal, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categoryById } from '../domain/catalog';
import { useApp } from '../state/AppContext';
import { PageHeader, PriorityBadge, StatusBadge } from '../components/ui';

export function ExhibitorsPage() {
  const app = useApp();
  const [search, setSearch] = useState('');
  const exhibitors = useMemo(() => {
    const term = search.toLowerCase().trim();
    return app.exhibitors.filter((item) => !term || [item.name, item.stand, item.pavilion, item.contactName].some((value) => value.toLowerCase().includes(term)));
  }, [app.exhibitors, search]);

  return (
    <>
      <PageHeader title="Expositores" description="Stands, documentos, criticidade interna e responsabilidades em um só lugar." actions={<button className="button button-primary"><Store size={17} /> Cadastrar expositor</button>} />
      <section className="toolbar panel"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar expositor, stand ou responsável" /></label><button className="button button-ghost"><SlidersHorizontal size={16} /> Filtros</button><span className="result-count">{exhibitors.length} expositores</span></section>
      <section className="exhibitor-grid">
        {exhibitors.map((exhibitor) => {
          const assignments = app.assignments.filter((item) => item.exhibitorId === exhibitor.id);
          const activeTickets = app.tickets.filter((ticket) => ticket.exhibitorId === exhibitor.id && !['resolved', 'closed_not_performed'].includes(ticket.status));
          const uniqueProviders = new Set(assignments.map((item) => item.providerId));
          return <article className="panel exhibitor-card" key={exhibitor.id}>
            <div className="exhibitor-card-top"><span className="stand-badge">{exhibitor.stand}</span><span className="tier-badge">Interno · {exhibitor.internalTier}</span></div>
            <h2>{exhibitor.name}</h2><p>{exhibitor.pavilion} · {exhibitor.areaSqm} m²</p>
            <div className="exhibitor-contact"><span><strong>{exhibitor.contactName}</strong><small>{exhibitor.contactEmail}</small></span></div>
            <div className="exhibitor-stats"><span><b>{activeTickets.length}</b> chamados ativos</span><span><b>{uniqueProviders.size}</b> fornecedores</span><span><b>{assignments.length}</b> escopos</span></div>
            <div className="service-tags">{[...new Set(assignments.map((item) => item.category))].slice(0, 5).map((category) => <span key={category}>{categoryById[category].shortLabel}</span>)}</div>
            <div className="document-links">{exhibitor.projectUrl ? <a href={exhibitor.projectUrl} target="_blank" rel="noreferrer"><FolderOpen /> Projeto <ExternalLink /></a> : <span><FolderOpen /> Sem projeto</span>}{exhibitor.memorialUrl ? <a href={exhibitor.memorialUrl} target="_blank" rel="noreferrer"><FileText /> Memorial <ExternalLink /></a> : <span><FileText /> Sem memorial</span>}</div>
            {activeTickets.slice(0, 1).map((ticket) => <div className="exhibitor-ticket" key={ticket.id}><PriorityBadge priority={ticket.priority} /><span><strong>{ticket.id} · {categoryById[ticket.reportedCategory].label}</strong><small>{ticket.description}</small></span><StatusBadge status={ticket.status} /></div>)}
            <button className="button button-ghost full-button"><Building2 size={16} /> Ver ficha completa</button>
          </article>;
        })}
      </section>
    </>
  );
}
