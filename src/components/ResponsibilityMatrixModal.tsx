import { AlertCircle, CheckCircle2, CopyCheck, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { serviceCategories } from '../domain/catalog';
import type { Exhibitor, OperationalPhase, ServiceCategoryId } from '../domain/types';
import { type ResponsibilityInput, useApp } from '../state/AppContext';

const phaseLabels: Record<OperationalPhase, string> = { setup: 'Montagem', event: 'Evento', teardown: 'Desmontagem' };

export function ResponsibilityMatrixModal({ open, exhibitor, onClose }: { open: boolean; exhibitor: Exhibitor | null; onClose(): void }) {
  const app = useApp();
  const [phase, setPhase] = useState<OperationalPhase>('setup');
  const [rows, setRows] = useState<ResponsibilityInput[]>([]);
  const [saved, setSaved] = useState(false);
  const providers = app.companies.filter((company) => company.type === 'provider');

  useEffect(() => {
    if (!open || !exhibitor) return;
    setRows(serviceCategories.map((category) => {
      const assignment = app.assignments.find((item) => item.exhibitorId === exhibitor.id && item.category === category.id && item.phases.includes(phase));
      return assignment ? {
        category: category.id,
        providerId: assignment.providerId,
        contractStatus: assignment.contractStatus,
        primaryProducerId: assignment.primaryProducerId,
        secondaryProducerId: assignment.secondaryProducerId,
        providerServiceId: assignment.providerServiceId,
      } : { category: category.id, providerId: '', contractStatus: 'not_contracted' };
    }));
    setSaved(false);
  }, [open, exhibitor, phase]);

  if (!open || !exhibitor) return null;

  const update = (category: ServiceCategoryId, patch: Partial<ResponsibilityInput>) => setRows((current) => current.map((row) => row.category === category ? { ...row, ...patch } : row));
  const chooseProvider = (category: ServiceCategoryId, providerId: string) => {
    const producers = app.people.filter((person) => person.companyId === providerId && person.role === 'provider_producer');
    const service = app.people.find((person) => person.companyId === providerId && person.role === 'provider_service');
    update(category, { providerId, contractStatus: providerId ? 'included' : 'not_contracted', primaryProducerId: producers[0]?.id, secondaryProducerId: producers[1]?.id, providerServiceId: service?.id });
  };
  const copyMontaExpo = () => setRows((current) => current.map((row) => {
    const supported = providers.find((provider) => provider.id === 'monta-expo')?.specialties?.includes(row.category);
    return supported ? { ...row, providerId: 'monta-expo', contractStatus: 'included', primaryProducerId: 'carlos-mendes', secondaryProducerId: 'marcos-lima', providerServiceId: 'bianca-souza' } : row;
  }));
  const save = () => {
    app.replaceResponsibilities(exhibitor.id, phase, rows);
    setSaved(true);
  };
  const configured = rows.filter((row) => row.providerId).length;

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal-card responsibility-modal" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="modal-heading-icon"><ShieldCheck /></span><span><h2>Matriz de responsabilidades</h2><p>{exhibitor.name} · Stand {exhibitor.stand}</p></span></div><button className="icon-button" onClick={onClose}><X /></button></header>
      <div className="responsibility-modal-body">
        <div className="phase-tabs">{(Object.keys(phaseLabels) as OperationalPhase[]).map((item) => <button key={item} className={phase === item ? 'active' : ''} onClick={() => setPhase(item)}>{phaseLabels[item]}</button>)}</div>
        <div className="responsibility-toolbar"><span>{saved ? <CheckCircle2 /> : <AlertCircle />}<strong>{saved ? 'Alterações salvas' : `${configured} de ${rows.length} serviços configurados`}</strong><small>{phaseLabels[phase]}</small></span><button className="button button-ghost button-small" onClick={copyMontaExpo}><CopyCheck /> Aplicar montadora aos escopos dela</button></div>
        <div className="matrix-editor-list">{rows.map((row) => {
          const category = serviceCategories.find((item) => item.id === row.category)!;
          const eligibleProviders = providers.filter((provider) => provider.specialties?.includes(row.category) || provider.id === row.providerId);
          const producers = app.people.filter((person) => person.companyId === row.providerId && person.role === 'provider_producer');
          const servicePeople = app.people.filter((person) => person.companyId === row.providerId && person.role === 'provider_service');
          return <article key={row.category} className={row.providerId ? 'configured' : ''}>
            <div className="matrix-category"><span className={`ticket-category-icon category-${row.category}`}>{category.shortLabel.slice(0, 2)}</span><span><strong>{category.label}</strong><small>{category.description}</small></span></div>
            <label><span>Fornecedor</span><select value={row.providerId} onChange={(event) => chooseProvider(row.category, event.target.value)}><option value="">Sem responsável</option>{eligibleProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></label>
            <label><span>Contratação</span><select value={row.contractStatus} disabled={!row.providerId} onChange={(event) => update(row.category, { contractStatus: event.target.value as ResponsibilityInput['contractStatus'] })}><option value="included">Incluso</option><option value="contracted">Contratado à parte</option><option value="not_contracted">Não contratado</option></select></label>
            <label><span>Produtor principal</span><select value={row.primaryProducerId ?? ''} disabled={!row.providerId} onChange={(event) => update(row.category, { primaryProducerId: event.target.value || undefined })}><option value="">A definir</option>{producers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            <label><span>Atendimento</span><select value={row.providerServiceId ?? ''} disabled={!row.providerId} onChange={(event) => update(row.category, { providerServiceId: event.target.value || undefined })}><option value="">A definir</option>{servicePeople.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          </article>;
        })}</div>
      </div>
      <footer><button className="button button-ghost" onClick={onClose}>Fechar</button><button className="button button-primary" onClick={save}><ShieldCheck /> Salvar {phaseLabels[phase].toLowerCase()}</button></footer>
    </section>
  </div>;
}
