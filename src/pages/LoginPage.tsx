import { ArrowRight, Eye, Globe2, LockKeyhole, Mail, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';

export function LoginPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('PT');
  const submit = (event: FormEvent) => { event.preventDefault(); navigate('/perfis'); };

  return <main className="login-page" style={{ '--login-accent': app.event.brand.primaryColor } as React.CSSProperties}>
    <section className="login-visual">
      <div className="login-brand"><span><Wrench /></span><strong>CAEXOne</strong></div>
      <div className="login-event-brand"><span>{app.event.brand.logoText}</span><div><small>Ambiente do evento</small><strong>{app.event.brand.name}</strong></div></div>
      <div className="login-visual-copy"><span><Sparkles /> Operação conectada</span><h1>A feira inteira trabalhando na mesma direção.</h1><p>Organizadora, fornecedores, produtores e expositores acompanham cada chamado do início à validação.</p><div><span><ShieldCheck /><b>Responsabilidades claras</b><small>Roteamento automático por contrato e fase</small></span><span><LockKeyhole /><b>Acesso por perfil</b><small>Cada pessoa visualiza somente o necessário</small></span></div></div>
      <footer>© 2027 CAEXOne · Operação digital para eventos</footer>
    </section>
    <section className="login-form-side">
      <div className="login-language"><Globe2 /><button className={language === 'PT' ? 'active' : ''} onClick={() => setLanguage('PT')}>PT</button><button className={language === 'EN' ? 'active' : ''} onClick={() => setLanguage('EN')}>EN</button><button className={language === 'ES' ? 'active' : ''} onClick={() => setLanguage('ES')}>ES</button></div>
      <form className="login-form" onSubmit={submit}>
        <div className="login-mobile-brand"><span>{app.event.brand.logoText}</span><strong>{app.event.brand.name}</strong></div>
        <span className="login-kicker">Bem-vindo de volta</span><h2>Acesse sua operação</h2><p>Use o e-mail cadastrado pela sua empresa.</p>
        <label><span>E-mail</span><div><Mail /><input type="email" defaultValue="ana@nexoeventos.example" required /></div></label>
        <label><span>Senha</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} defaultValue="demonstracao" required /><button type="button" onClick={() => setShowPassword((current) => !current)}><Eye /></button></div></label>
        <div className="login-options"><label><input type="checkbox" defaultChecked /> Manter conectado</label><button type="button">Esqueci minha senha</button></div>
        <button className="login-submit">Entrar <ArrowRight /></button>
        <div className="login-demo"><span>Demonstração</span><p>O acesso abaixo permite escolher qualquer perfil sem autenticação real.</p><button type="button" onClick={() => navigate('/perfis')}>Explorar perfis da plataforma</button></div>
      </form>
    </section>
  </main>;
}
