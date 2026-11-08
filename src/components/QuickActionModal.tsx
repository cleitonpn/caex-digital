import { Clock3, MessageCircle, Send, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import type { Ticket } from '../domain/types';

export function QuickActionModal({ open, title, description, label = 'Mensagem', placeholder, confirmLabel = 'Enviar', onClose, onConfirm }: { open: boolean; title: string; description: string; label?: string; placeholder?: string; confirmLabel?: string; onClose(): void; onConfirm(value: string): void }) {
  const [value, setValue] = useState('');
  useEffect(() => { if (open) setValue(''); }, [open]);
  if (!open) return null;
  const submit = (event: FormEvent) => { event.preventDefault(); onConfirm(value.trim()); onClose(); };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal-card quick-action-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><MessageCircle /></span><span><h2>{title}</h2><p>{description}</p></span></div><button type="button" className="icon-button" onClick={onClose}><X /></button></header>
    <div className="quick-action-body"><label className="form-field"><span>{label}</span><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} autoFocus required minLength={4} /></label></div>
    <footer><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={value.trim().length < 4}><Send /> {confirmLabel}</button></footer>
  </form></div>;
}

export function TicketTimelineModal({ ticket, onClose }: { ticket: Ticket | null; onClose(): void }) {
  if (!ticket) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card ticket-timeline-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="modal-heading-icon"><Clock3 /></span><span><h2>Histórico do chamado</h2><p>{ticket.id} · rastreabilidade completa da ocorrência</p></span></div><button className="icon-button" onClick={onClose}><X /></button></header>
    <div className="ticket-timeline-list">{[...ticket.timeline].reverse().map((entry) => <article key={entry.id}><i /><div><strong>{entry.action}</strong><span>{entry.actorName}</span>{entry.note && <p>{entry.note}</p>}</div><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.at))}</time></article>)}</div>
    <footer><button className="button button-primary" onClick={onClose}>Fechar histórico</button></footer>
  </section></div>;
}
