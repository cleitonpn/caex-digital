import { AlertTriangle, CheckCircle2, FileImage, Plus, ShieldAlert, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { serviceCategories } from '../domain/catalog';
import { resolveServiceAssignment } from '../domain/routing';
import type { ServiceCategoryId, Ticket, UserRole } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Notice } from './ui';

export function CreateTicketModal({
  open,
  onClose,
  onCreated,
  actorRole = 'organizer_admin',
  origin = 'organizer',
  createdBy = 'Equipe da organizadora',
  defaultExhibitorId,
}: {
  open: boolean;
  onClose(): void;
  onCreated?(ticket: Ticket): void;
  actorRole?: UserRole;
  origin?: Ticket['origin'];
  createdBy?: string;
  defaultExhibitorId?: string;
}) {
  const app = useApp();
  const [exhibitorId, setExhibitorId] = useState(defaultExhibitorId ?? app.exhibitors[0]?.id ?? '');
  const [category, setCategory] = useState<ServiceCategoryId>('carpentry');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<'low' | 'operation' | 'blocked'>('operation');
  const [safetyRisk, setSafetyRisk] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setExhibitorId(defaultExhibitorId ?? app.exhibitors[0]?.id ?? '');
    setCategory('carpentry');
    setDescription('');
    setImpact('operation');
    setSafetyRisk(false);
    setAttachments([]);
    setError('');
  }, [open, defaultExhibitorId, app.exhibitors]);

  const routing = useMemo(() => resolveServiceAssignment(app.assignments, exhibitorId, category, app.phase, actorRole), [app.assignments, app.phase, exhibitorId, category, actorRole]);
  const provider = app.companies.find((company) => company.id === routing.assignment?.providerId);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const result = app.createTicket({
      exhibitorId,
      category,
      description: description.trim(),
      actorRole,
      origin,
      safetyRisk,
      standBlocked: impact === 'blocked',
      affectsOperation: impact !== 'low',
      createdBy,
      attachments,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.ticket) onCreated?.(result.ticket);
    onClose();
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <form className="modal-card ticket-create-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="modal-heading-icon"><Plus /></span><span><h2>Novo chamado</h2><p>A prioridade e o encaminhamento são calculados automaticamente.</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
      <div className="modal-form-grid">
        {error && <div className="full-span"><Notice title="Não foi possível abrir o chamado" tone="danger">{error}</Notice></div>}
        <label className="form-field full-span"><span>Expositor e stand</span><select value={exhibitorId} onChange={(event) => setExhibitorId(event.target.value)} required>{app.exhibitors.map((exhibitor) => <option key={exhibitor.id} value={exhibitor.id}>{exhibitor.name} · Stand {exhibitor.stand}</option>)}</select></label>
        <label className="form-field full-span"><span>Tipo do chamado</span><select value={category} onChange={(event) => setCategory(event.target.value as ServiceCategoryId)}>{serviceCategories.map((item) => <option key={item.id} value={item.id}>{item.label} — {item.description}</option>)}</select></label>
        <div className={`routing-preview full-span ${routing.available ? '' : 'routing-unavailable'}`}>
          {routing.available ? <><CheckCircle2 /><span><small>Encaminhamento automático</small><strong>{provider?.name ?? 'Fornecedor definido'}</strong><em>{app.phase === 'setup' ? 'Montagem' : app.phase === 'event' ? 'Evento' : 'Desmontagem'}</em></span></> : <><AlertTriangle /><span><small>Serviço indisponível</small><strong>{routing.reason}</strong></span></>}
        </div>
        <label className="form-field full-span"><span>Descrição do problema</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={600} required placeholder="Descreva o que está acontecendo, onde fica o problema e o impacto percebido." /><small className="field-help">{description.length}/600 caracteres</small></label>
        <fieldset className="impact-field full-span"><legend>Impacto no stand</legend><label><input type="radio" name="impact" checked={impact === 'low'} onChange={() => setImpact('low')} /><span><strong>Baixo</strong><small>Ajuste pontual</small></span></label><label><input type="radio" name="impact" checked={impact === 'operation'} onChange={() => setImpact('operation')} /><span><strong>Afeta a operação</strong><small>Prejudica parcialmente</small></span></label><label><input type="radio" name="impact" checked={impact === 'blocked'} onChange={() => setImpact('blocked')} /><span><strong>Stand impedido</strong><small>Não consegue operar</small></span></label></fieldset>
        <label className={`safety-check full-span ${safetyRisk ? 'selected' : ''}`}><input type="checkbox" checked={safetyRisk} onChange={(event) => setSafetyRisk(event.target.checked)} /><ShieldAlert /><span><strong>Existe risco à segurança</strong><small>Faísca, fumaça, cheiro de queimado, queda ou risco de choque.</small></span></label>
        <label className="attachment-field full-span"><FileImage /><span><strong>Adicionar evidências</strong><small>{attachments.length ? attachments.join(', ') : 'Fotos ou documentos ajudam a equipe a preparar o atendimento.'}</small></span><input type="file" accept="image/*,.pdf" multiple onChange={(event) => setAttachments(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>
      </div>
      <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={!routing.available || description.trim().length < 10}><Plus /> Abrir chamado</button></footer>
    </form>
  </div>;
}
