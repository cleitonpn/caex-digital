import { CalendarClock, CircleUserRound, UserPlus, UsersRound } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { Avatar, PageHeader } from '../components/ui';

export function TeamsPage() {
  const app = useApp();
  const groups = app.companies.filter((company) => ['organizer', 'provider'].includes(company.type)).map((company) => ({
    company,
    people: app.people.filter((person) => person.companyId === company.id),
  })).filter((group) => group.people.length);
  return <>
    <PageHeader title="Equipes" description="Atendimentos, produtores principais, secundários e disponibilidade do plantão." actions={<button className="button button-primary"><UserPlus size={17} /> Convidar pessoa</button>} />
    <section className="team-summary metrics-grid three-metrics"><article className="metric-card"><span className="metric-icon metric-primary"><UsersRound /></span><div className="metric-copy"><strong>{app.people.length}</strong><span>Pessoas cadastradas</span></div></article><article className="metric-card"><span className="metric-icon metric-success"><CircleUserRound /></span><div className="metric-copy"><strong>{app.people.filter((person) => person.available).length}</strong><span>Disponíveis agora</span></div></article><article className="metric-card"><span className="metric-icon metric-warning"><CalendarClock /></span><div className="metric-copy"><strong>{app.people.filter((person) => !person.available).length}</strong><span>Ausentes ou fora do turno</span></div></article></section>
    <section className="team-groups">{groups.map(({ company, people }) => <article className="panel team-group" key={company.id}><div className="team-group-header"><span className="company-logo"><UsersRound /></span><div><h2>{company.name}</h2><p>{company.type === 'organizer' ? 'Organizadora' : 'Fornecedor'} · {people.length} pessoas</p></div></div><div className="people-list">{people.map((person) => <div className="team-person" key={person.id}><Avatar initials={person.initials} color={person.avatarColor} /><span><strong>{person.name}</strong><small>{person.title}</small><em>{person.email}</em></span><label className="availability-toggle"><input type="checkbox" checked={person.available} onChange={() => app.toggleAvailability(person.id)} /><i /><b>{person.available ? 'Disponível' : 'Ausente'}</b></label></div>)}</div></article>)}</section>
    <section className="panel coverage-panel"><div className="panel-header"><div><span className="panel-icon"><CalendarClock /></span><div><h2>Cobertura automática</h2><p>Quando o produtor principal fica ausente, o secundário recebe seus stands e chamados.</p></div></div><button className="button button-ghost">Configurar turnos</button></div><div className="coverage-row"><span><Avatar initials="CM" color="#3c63bd" /><strong>Carlos Mendes</strong><small>Principal · 4 stands</small></span><span className="coverage-arrow">→</span><span><Avatar initials="ML" color="#8b4c9e" /><strong>Marcos Lima</strong><small>Secundário e plantonista</small></span><span className="badge status-accepted">Cobertura ativa</span></div></section>
  </>;
}
