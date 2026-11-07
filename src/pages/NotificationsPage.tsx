import {
  BellRing,
  CheckCheck,
  ChevronRight,
  Clock3,
  Mail,
  MessageCircle,
  Settings2,
  ShieldAlert,
  Smartphone,
  TicketCheck,
  TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { categoryById } from '../domain/catalog';
import { useApp } from '../state/AppContext';

type NotificationKind = 'ticket' | 'sla' | 'message' | 'system';
type NotificationFilter = 'all' | 'unread' | 'critical';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  meta: string;
  time: string;
  group: 'Agora' | 'Hoje' | 'Ontem';
  critical?: boolean;
  initiallyRead?: boolean;
}

const kindIcons = { ticket: TicketCheck, sla: Clock3, message: MessageCircle, system: BellRing };

export function NotificationsPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [read, setRead] = useState<Set<string>>(new Set(['notification-5', 'notification-6', 'notification-7']));
  const [channels, setChannels] = useState({ app: true, email: true, whatsapp: false, escalations: true, daily: true });

  const notifications = useMemo<NotificationItem[]>(() => {
    const active = app.tickets.filter((ticket) => !['resolved', 'closed_not_performed'].includes(ticket.status));
    const critical = active.find((ticket) => ticket.priority === 'critical') ?? active[0];
    const overdue = active.find((ticket) => new Date(ticket.resolveDueAt).getTime() < new Date(app.now).getTime()) ?? active[1];
    const waiting = active.find((ticket) => ticket.status === 'open') ?? active[2];
    return [
      critical && { id: 'notification-1', kind: 'ticket', title: `Chamado crítico ${critical.id}`, description: critical.description, meta: `${categoryById[critical.reportedCategory].label} · prioridade crítica`, time: 'Agora', group: 'Agora', critical: true },
      overdue && { id: 'notification-2', kind: 'sla', title: 'SLA de resolução ultrapassado', description: `O chamado ${overdue.id} precisa de intervenção da gestão.`, meta: 'Gestor da feira e fornecedor notificados', time: 'Há 4 min', group: 'Agora', critical: true },
      waiting && { id: 'notification-3', kind: 'ticket', title: 'Chamado aguardando aceite', description: `${waiting.id} ainda não foi aceito pelo fornecedor responsável.`, meta: 'Primeiro escalonamento em 12 minutos', time: 'Há 8 min', group: 'Agora' },
      { id: 'notification-4', kind: 'message', title: 'Nova mensagem do expositor', description: 'Marina Alves enviou uma atualização com foto no chamado CH-7482.', meta: 'Aurora Tech · Stand B124', time: 'Há 16 min', group: 'Hoje' },
      { id: 'notification-5', kind: 'ticket', title: 'Solução aguardando validação', description: 'O fornecedor concluiu a troca do mobiliário solicitado.', meta: 'CH-7452 · Horizon Bank', time: 'Há 42 min', group: 'Hoje', initiallyRead: true },
      { id: 'notification-6', kind: 'system', title: 'Importação concluída', description: 'A planilha “expositores_lote_03.csv” foi processada sem erros.', meta: '28 expositores adicionados', time: 'Hoje, 08:14', group: 'Hoje', initiallyRead: true },
      { id: 'notification-7', kind: 'system', title: 'Cobertura de plantão ativada', description: 'Marcos Lima assumiu temporariamente os clientes de Carlos Mendes.', meta: 'MontaExpo · turno da manhã', time: 'Ontem, 21:40', group: 'Ontem', initiallyRead: true },
    ].filter(Boolean) as NotificationItem[];
  }, [app.now, app.tickets]);

  const isRead = (item: NotificationItem) => read.has(item.id) || Boolean(item.initiallyRead);
  const filtered = notifications.filter((item) => filter === 'all' || (filter === 'unread' && !isRead(item)) || (filter === 'critical' && item.critical));
  const unreadCount = notifications.filter((item) => !isRead(item)).length;
  const groups = ['Agora', 'Hoje', 'Ontem'] as const;

  const openNotification = (item: NotificationItem) => {
    setRead((current) => new Set(current).add(item.id));
    if (item.kind !== 'system') navigate('/chamados');
  };

  const markAllRead = () => setRead(new Set(notifications.map((item) => item.id)));

  return <>
    <PageHeader
      eyebrow="Central de alertas"
      title="Notificações"
      description="Acompanhe chamados, prazos, mensagens e mudanças importantes da operação."
      actions={<button className="button button-ghost" onClick={markAllRead}><CheckCheck /> Marcar todas como lidas</button>}
    />

    <section className="notifications-layout">
      <div className="panel notifications-main">
        <div className="notification-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas <b>{notifications.length}</b></button><button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Não lidas <b>{unreadCount}</b></button><button className={filter === 'critical' ? 'active' : ''} onClick={() => setFilter('critical')}>Críticas <b>{notifications.filter((item) => item.critical).length}</b></button></div>
        <div className="notification-feed">
          {groups.map((group) => {
            const groupItems = filtered.filter((item) => item.group === group);
            if (!groupItems.length) return null;
            return <section className="notification-group" key={group}><h2>{group}</h2>{groupItems.map((item) => {
              const Icon = kindIcons[item.kind];
              return <button className={`notification-row ${!isRead(item) ? 'unread' : ''} ${item.critical ? 'critical' : ''}`} key={item.id} onClick={() => openNotification(item)}>
                <span className={`notification-kind kind-${item.kind}`}><Icon /></span>
                <span className="notification-copy"><span><strong>{item.title}</strong>{!isRead(item) && <i />}</span><p>{item.description}</p><small>{item.meta}</small></span>
                <time>{item.time}</time><ChevronRight />
              </button>;
            })}</section>;
          })}
          {!filtered.length && <div className="notifications-empty"><CheckCheck /><h2>Tudo em dia</h2><p>Não há notificações neste filtro.</p></div>}
        </div>
      </div>

      <aside className="notifications-side">
        <section className="panel notification-summary-card"><span className="notification-summary-icon"><BellRing /></span><div><strong>{unreadCount}</strong><span>notificações não lidas</span></div><p><b>{notifications.filter((item) => item.critical && !isRead(item)).length}</b> exigem atenção imediata</p></section>
        <section className="panel notification-settings">
          <div className="panel-header compact"><div><span className="panel-icon"><Settings2 /></span><div><h2>Canais de aviso</h2><p>Preferências deste usuário</p></div></div></div>
          <div className="channel-list">
            <ChannelToggle icon={BellRing} label="No aplicativo" description="Alertas em tempo real" checked={channels.app} onChange={() => setChannels((current) => ({ ...current, app: !current.app }))} />
            <ChannelToggle icon={Mail} label="E-mail" description="Resumo e chamados críticos" checked={channels.email} onChange={() => setChannels((current) => ({ ...current, email: !current.email }))} />
            <ChannelToggle icon={Smartphone} label="WhatsApp" description="Somente escalonamentos" checked={channels.whatsapp} onChange={() => setChannels((current) => ({ ...current, whatsapp: !current.whatsapp }))} />
          </div>
        </section>
        <section className="panel alert-rules-card"><div><ShieldAlert /><span><strong>Regras de escalonamento</strong><small>Configuradas para esta feira</small></span></div><p><TriangleAlert /> Prioridades críticas avisam gestores imediatamente.</p><p><Clock3 /> Após 3 horas vencidas, o gestor do fornecedor é acionado.</p><button className="button button-ghost full-button" onClick={() => navigate('/configuracoes')}>Ver regras e SLA</button></section>
      </aside>
    </section>
  </>;
}

function ChannelToggle({ icon: Icon, label, description, checked, onChange }: { icon: typeof BellRing; label: string; description: string; checked: boolean; onChange(): void }) {
  return <label className="channel-toggle"><span className="channel-icon"><Icon /></span><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={onChange} /><i /></label>;
}
