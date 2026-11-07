import { ArrowRight, Eye, Globe2, LockKeyhole, Mail, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdTokenResult, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../state/AppContext';
import { firebaseIsConfigured, getFirebaseServices } from '../services/firebase';

export function LoginPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('PT');
  const [email, setEmail] = useState('ana@nexoeventos.example');
  const [password, setPassword] = useState('demonstracao');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const firebaseMode = import.meta.env.VITE_DATA_MODE === 'firebase' && firebaseIsConfigured();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firebaseMode) { navigate('/perfis'); return; }
    const services = getFirebaseServices();
    if (!services) { setError('A configuração pública do Firebase ainda não foi carregada.'); return; }
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(services.auth, email, password);
      const token = await getIdTokenResult(credential.user);
      const role = String(token.claims.role ?? '');
      const destination = role === 'platform_admin' ? '/admin-plataforma' : role === 'event_manager' ? '/gestor' : role === 'organizer_producer' ? '/organizador/producao' : role === 'organizer_service' ? '/organizador/atendimento' : role === 'provider_admin' ? '/fornecedor' : role === 'provider_service' ? '/fornecedor/atendimento' : role === 'provider_producer' ? '/fornecedor/producao' : role.startsWith('exhibitor') ? '/portal' : '/';
      navigate(destination);
    } catch {
      setError('E-mail ou senha inválidos. Confira os dados e tente novamente.');
    } finally { setLoading(false); }
  };
  const resetPassword = async () => {
    const services = getFirebaseServices();
    if (!firebaseMode || !services) { setMessage('No modo demonstração, use o acesso de perfis abaixo.'); return; }
    if (!email.includes('@')) { setError('Informe seu e-mail antes de solicitar a recuperação.'); return; }
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(services.auth, email);
      setMessage('Enviamos o link de recuperação para o seu e-mail.');
    } catch {
      setError('Não foi possível enviar o link agora. Confira o e-mail e tente novamente.');
    }
  };

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
        <label><span>E-mail</span><div><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></label>
        <label><span>Senha</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((current) => !current)}><Eye /></button></div></label>
        <div className="login-options"><label><input type="checkbox" defaultChecked /> Manter conectado</label><button type="button" onClick={resetPassword}>Esqueci minha senha</button></div>
        {error && <div className="login-feedback error">{error}</div>}{message && <div className="login-feedback">{message}</div>}
        <button className="login-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'} {!loading && <ArrowRight />}</button>
        {!firebaseMode && <div className="login-demo"><span>Demonstração</span><p>O acesso abaixo permite escolher qualquer perfil sem autenticação real.</p><button type="button" onClick={() => navigate('/perfis')}>Explorar perfis da plataforma</button></div>}
      </form>
    </section>
  </main>;
}
