import { AlertTriangle, Armchair, ArrowLeft, Bell, CheckCircle2, ChevronRight, Clock3, Download, FileText, FolderOpen, Globe2, Headphones, ImagePlus, MessageCircle, Plus, QrCode, ShieldCheck, UsersRound, X, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { serviceCategories } from '../domain/catalog';
import { availableCategories, resolveServiceAssignment } from '../domain/routing';
import type { Priority, ServiceCategoryId, Ticket, TicketStatus } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Avatar } from '../components/ui';

type PortalView = 'home' | 'new' | 'ticket';

export function PortalPage() {
  const app = useApp();
  const { t, i18n } = useTranslation();
  const requestedExhibitorId = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('exhibitor');
  const exhibitor = app.exhibitors.find((item) => item.id === requestedExhibitorId) ?? app.exhibitors.find((item) => item.id === 'aurora-tech') ?? app.exhibitors[0];
  const [view, setView] = useState<PortalView>('home');
  const [selectedTicketId, setSelectedTicketId] = useState<string>('CH-7482');
  const [qrOpen, setQrOpen] = useState(false);
  const ticket = app.tickets.find((item) => item.id === selectedTicketId);
  const language = i18n.resolvedLanguage?.split('-')[0] ?? 'pt';

  const changeLanguage = (value: string) => {
    localStorage.setItem('caex-language', value);
    document.documentElement.lang = value === 'pt' ? 'pt-BR' : value;
    void i18n.changeLanguage(value);
  };

  return <main className="portal-shell" style={{ '--event-primary': app.event.brand.primaryColor } as React.CSSProperties}>
    <header className="portal-header">
      <button className="portal-brand" onClick={() => setView('home')}><span>{app.event.brand.logoText}</span><strong>{app.event.brand.name}</strong></button>
      <div>
        <label className="portal-language" title={t('language')}><Globe2 /><select aria-label={t('language')} value={language} onChange={(event) => changeLanguage(event.target.value)}><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select></label>
        <button className="icon-button" aria-label="Notificações"><Bell /></button><Avatar initials="MA" color="#bb5267" />
      </div>
    </header>
    {view === 'home' && <PortalHome exhibitor={exhibitor} onNew={() => setView('new')} onTicket={(id) => { setSelectedTicketId(id); setView('ticket'); }} onQr={() => setQrOpen(true)} />}
    {view === 'new' && <NewPortalTicket exhibitorId={exhibitor.id} onBack={() => setView('home')} onCreated={(created) => { setSelectedTicketId(created.id); setView('ticket'); }} />}
    {view === 'ticket' && ticket && <PortalTicketDetail ticket={ticket} onBack={() => setView('home')} />}
    <PortalQrModal open={qrOpen} exhibitor={exhibitor} onClose={() => setQrOpen(false)} />
  </main>;
}

function PortalStatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation();
  return <span className={`badge status-${status}`}>{t(`status.${status}`)}</span>;
}

function PortalPriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  return <span className={`badge priority-${priority}`}>{t(`priority.${priority}`)}</span>;
}

function PortalHome({ exhibitor, onNew, onTicket, onQr }: { exhibitor: ReturnType<typeof useApp>['exhibitors'][number]; onNew(): void; onTicket(id: string): void; onQr(): void }) {
  const app = useApp();
  const { t } = useTranslation();
  const tickets = app.tickets.filter((ticket) => ticket.exhibitorId === exhibitor.id);
  const active = tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
  return <div className="portal-content">
    <section className="portal-welcome"><span className="phase-chip">{t(`phase.${app.phase}`)}</span><h1>{t('home.hello')} <span>👋</span></h1><p>{t('home.tagline')}</p></section>
    <section className="portal-stand-card"><div className="stand-visual"><span>{t('home.standPreparing')}</span><strong>{exhibitor.name}</strong></div><div><span><strong>{t('home.stand', { number: exhibitor.stand })}</strong><small>{exhibitor.pavilion} · {exhibitor.areaSqm} m²</small></span><ChevronRight /></div></section>
    <button className="portal-primary-action" onClick={onNew}><Plus /> {t('home.openTicket')}</button>
    <section className="portal-status-card"><div><h2>{t('home.ticketStatus')}</h2><button onClick={() => active[0] && onTicket(active[0].id)}>{t('home.inProgressCount', { count: active.length })} <ChevronRight /></button></div><div className="portal-status-numbers"><span><CheckCircle2 /><b>{tickets.filter((item) => item.status === 'resolved').length}</b><small>{t('home.resolved')}</small></span><span><Clock3 /><b>{active.filter((item) => item.status !== 'open').length}</b><small>{t('home.inService')}</small></span><span><Headphones /><b>{active.filter((item) => item.status === 'open').length}</b><small>{t('home.open')}</small></span></div></section>
    <section className="portal-shortcuts four"><button><FolderOpen /><span>{t('home.myProject')}</span></button><button><FileText /><span>{t('home.memorial')}</span></button><button><UsersRound /><span>{t('home.team')}</span></button><button onClick={onQr}><QrCode /><span>{t('home.qrAccess')}</span></button></section>
    <section className="portal-furniture-card"><div><span><Armchair /></span><div><h2>{t('home.furniture')}</h2><p>{t('home.furnitureTypes', { count: exhibitor.furniture?.length ?? 0 })}</p></div></div><div className="portal-furniture-list">{exhibitor.furniture?.map((item, index) => <span key={`${item.type}-${index}`}><b>{item.quantity}</b>{item.type}</span>)}</div></section>
    <section className="portal-recent"><div><h2>{t('home.recent')}</h2><button>{t('home.seeAll')}</button></div>{tickets.slice(0, 3).map((ticket) => <button className="portal-ticket-row" key={ticket.id} onClick={() => onTicket(ticket.id)}><span className="portal-ticket-icon"><Zap /></span><span><strong>{ticket.id} · {t(`category.${ticket.reportedCategory}`)}</strong><small>{ticket.description}</small></span><PortalStatusBadge status={ticket.status} /><ChevronRight /></button>)}</section>
  </div>;
}

function PortalQrModal({ open, exhibitor, onClose }: { open: boolean; exhibitor: ReturnType<typeof useApp>['exhibitors'][number]; onClose(): void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState('');
  useEffect(() => {
    if (!open) return;
    const url = `${window.location.origin}${window.location.pathname}#/portal?exhibitor=${encodeURIComponent(exhibitor.id)}`;
    void QRCode.toDataURL(url, { width: 360, margin: 2, color: { dark: '#241873', light: '#ffffff' }, errorCorrectionLevel: 'H' }).then(setImage);
  }, [open, exhibitor.id]);
  if (!open) return null;
  return <div className="portal-qr-backdrop" onMouseDown={onClose}><section className="portal-qr-modal" onMouseDown={(event) => event.stopPropagation()}><button className="icon-button" onClick={onClose}><X /></button><span className="portal-qr-event">{exhibitor.stand}</span><h2>{t('home.qrTitle')}</h2><p>{t('home.qrHelp')}</p>{image ? <img src={image} alt={t('home.qrAccess')} /> : <span className="portal-qr-loading" /> }<strong>{exhibitor.name} · {t('home.stand', { number: exhibitor.stand })}</strong><a className="portal-submit" href={image} download={`acesso-${exhibitor.stand}.png`}><Download /> {t('home.downloadQr')}</a></section></div>;
}

function NewPortalTicket({ exhibitorId, onBack, onCreated }: { exhibitorId: string; onBack(): void; onCreated(ticket: Ticket): void }) {
  const app = useApp();
  const { t } = useTranslation();
  const categories = availableCategories(app.assignments, exhibitorId, app.phase, 'exhibitor_admin');
  const [category, setCategory] = useState<ServiceCategoryId>(categories[0] ?? 'carpentry');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<'high' | 'medium' | 'low'>('medium');
  const [safetyRisk, setSafetyRisk] = useState(false);
  const [error, setError] = useState('');
  const cleaningDecision = resolveServiceAssignment(app.assignments, exhibitorId, 'cleaning', app.phase, 'exhibitor_admin');
  const provider = useMemo(() => { const decision = resolveServiceAssignment(app.assignments, exhibitorId, category, app.phase, 'exhibitor_admin'); return app.companies.find((item) => item.id === decision.assignment?.providerId); }, [app, exhibitorId, category]);
  const submit = () => {
    const result = app.createTicket({ exhibitorId, category, description, actorRole: 'exhibitor_admin', origin: 'exhibitor', safetyRisk, standBlocked: impact === 'high', affectsOperation: impact !== 'low', createdBy: 'Marina Alves' });
    if (result.error) setError(result.error); else if (result.ticket) onCreated(result.ticket);
  };
  return <div className="portal-content portal-form">
    <button className="portal-back" onClick={onBack}><ArrowLeft /> {t('form.back')}</button><h1>{t('form.title')}</h1><p>{t('form.intro')}</p>
    <div className="category-picker">{serviceCategories.filter((item) => categories.includes(item.id)).map((item) => <button key={item.id} className={category === item.id ? 'selected' : ''} onClick={() => setCategory(item.id)}>{t(`category.${item.id}`)}</button>)}</div>
    {!cleaningDecision.available && <div className="portal-info"><ShieldCheck /><span><strong>{t('form.cleaningTitle')}</strong>{t('form.cleaningUnavailable')}</span></div>}
    {category === 'electrical' && <div className="portal-warning"><AlertTriangle /><span><strong>{t('form.electricalTitle')}</strong>{t('form.electricalBody')}</span></div>}
    <label className="portal-field"><span>{t('form.describe')}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder={t('form.placeholder')} /><small>{description.length}/500</small></label>
    <label className="portal-upload"><ImagePlus /><span><strong>{t('form.addPhotos')}</strong><small>{t('form.photosHelp')}</small></span></label>
    <fieldset className="impact-options"><legend>{t('form.impact')}</legend><label className={impact === 'high' ? 'selected' : ''}><input type="radio" checked={impact === 'high'} onChange={() => setImpact('high')} /><span><strong>{t('form.high')}</strong>{t('form.highHelp')}</span></label><label className={impact === 'medium' ? 'selected' : ''}><input type="radio" checked={impact === 'medium'} onChange={() => setImpact('medium')} /><span><strong>{t('form.medium')}</strong>{t('form.mediumHelp')}</span></label><label className={impact === 'low' ? 'selected' : ''}><input type="radio" checked={impact === 'low'} onChange={() => setImpact('low')} /><span><strong>{t('form.low')}</strong>{t('form.lowHelp')}</span></label></fieldset>
    {category === 'electrical' && <label className="safety-check"><input type="checkbox" checked={safetyRisk} onChange={(event) => setSafetyRisk(event.target.checked)} /><span><strong>{t('form.safety')}</strong>{t('form.safetyHelp')}</span></label>}
    <div className="routing-preview"><ShieldCheck /><span>{t('form.routing')} <strong>{provider?.name ?? t('form.organizerTriage')}</strong></span></div>{error && <div className="form-error">{error}</div>}<button className="portal-submit" disabled={description.trim().length < 8} onClick={submit}>{t('form.submit')}</button>
  </div>;
}

function PortalTicketDetail({ ticket, onBack }: { ticket: Ticket; onBack(): void }) {
  const app = useApp();
  const { t } = useTranslation();
  const exhibitor = app.exhibitors.find((item) => item.id === ticket.exhibitorId)!;
  const producer = app.people.find((item) => item.id === ticket.assignedProducerId);
  const service = app.people.find((item) => item.id === ticket.assignedServiceId);
  const organizer = app.people.find((item) => item.id === 'rafael-lima')!;
  const resolutionMinutes = Math.max(0, Math.round((new Date(ticket.resolveDueAt).getTime() - new Date(app.now).getTime()) / 60_000));
  const forecast = resolutionMinutes > 60 ? t('detail.inHoursMinutes', { hours: Math.floor(resolutionMinutes / 60), minutes: resolutionMinutes % 60 }) : t('detail.inMinutes', { minutes: resolutionMinutes });
  return <div className="portal-content portal-detail">
    <button className="portal-back" onClick={onBack}><ArrowLeft /> {t('detail.back')}</button><div className="portal-ticket-title"><span className="portal-ticket-icon large"><Zap /></span><div><h1>{ticket.id}</h1><p>{t(`category.${ticket.reportedCategory}`)} · {t('home.stand', { number: exhibitor.stand })}</p></div><PortalStatusBadge status={ticket.status} /></div>
    <div className="portal-timeline"><span className="done"><i><CheckCircle2 /></i><strong>{t('detail.opened')}</strong><small>09:02</small></span><b /><span className={ticket.acceptedAt ? 'done' : ''}><i>{ticket.acceptedAt ? <CheckCircle2 /> : '2'}</i><strong>{t('detail.accepted')}</strong><small>{ticket.acceptedAt ? '09:10' : t('detail.waiting')}</small></span><b /><span className={ticket.startedAt ? 'active' : ''}><i>3</i><strong>{t('detail.inService')}</strong><small>{ticket.startedAt ? '09:24' : t('detail.nextStep')}</small></span></div>
    <div className="portal-sla"><Clock3 /><span>{t('detail.forecast')}</span><strong>{forecast}</strong></div>
    <section className="portal-detail-section"><h2>{t('detail.description')}</h2><p>{ticket.description}</p><PortalPriorityBadge priority={ticket.priority} /></section>
    <section className="portal-detail-section"><h2>{t('detail.serviceTeam')}</h2><p>{t('detail.teamHelp')}</p><div className="portal-people">{[producer, service, organizer].filter(Boolean).map((person) => <span key={person!.id}><Avatar initials={person!.initials} color={person!.avatarColor} size="lg" /><strong>{person!.name.split(' ')[0]}</strong><small>{person!.title}</small></span>)}</div></section>
    <section className="portal-update"><MessageCircle /><div><strong>{t('detail.teamUpdate')}</strong><p>{t('detail.updateBody')}</p></div></section><label className="portal-message"><input placeholder={t('detail.message')} /><button>➤</button></label><button className="portal-submit" disabled={ticket.status !== 'awaiting_validation'} onClick={() => app.updateTicketStatus(ticket.id, 'resolved')}><CheckCircle2 /> {t('detail.validate')}</button>
  </div>;
}
