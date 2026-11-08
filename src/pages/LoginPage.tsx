import { ArrowRight, CheckCircle2, Eye, Globe2, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdTokenResult, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '../state/AppContext';
import { firebaseIsConfigured, getFirebaseServices } from '../services/firebase';

export function LoginPage() {
  const app = useApp();
  const navigate = useNavigate();
  const firebaseMode = import.meta.env.VITE_DATA_MODE === 'firebase' && firebaseIsConfigured();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('PT');
  const [email, setEmail] = useState(firebaseMode ? '' : 'ana@nexoeventos.example');
  const [password, setPassword] = useState(firebaseMode ? '' : 'demonstracao');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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
  const openPasswordReset = () => {
    setError('');
    setMessage('');
    setResetOpen(true);
  };
  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    const services = getFirebaseServices();
    if (!firebaseMode || !services) { setMessage('No modo demonstração, use o acesso de perfis abaixo.'); return; }
    if (!email.trim().includes('@')) { setError('Informe um e-mail válido para receber o link.'); return; }
    setResetLoading(true);
    setError('');
    setMessage('');
    try {
      services.auth.languageCode = language === 'PT' ? 'pt-BR' : language === 'ES' ? 'es' : 'en';
      await sendPasswordResetEmail(services.auth, email.trim(), {
        url: `${window.location.origin}${window.location.pathname}#/entrar`,
        handleCodeInApp: false,
      });
      setMessage(`Link enviado para ${email.trim()}. Confira também a caixa de spam.`);
    } catch (resetError) {
      const code = resetError && typeof resetError === 'object' && 'code' in resetError ? String(resetError.code) : '';
      setError(code === 'auth/too-many-requests'
        ? 'Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente.'
        : code === 'auth/network-request-failed'
          ? 'Não foi possível acessar o Firebase. Confira sua conexão e tente novamente.'
          : 'Não foi possível enviar o link agora. Confira o e-mail e tente novamente.');
    } finally { setResetLoading(false); }
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
        <div className="login-options"><label><input type="checkbox" defaultChecked /> Manter conectado</label><button type="button" onClick={openPasswordReset}>Esqueci minha senha</button></div>
        {!resetOpen && error && <div className="login-feedback error" role="alert">{error}</div>}
        <button className="login-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'} {!loading && <ArrowRight />}</button>
        {!firebaseMode && <div className="login-demo"><span>Demonstração</span><p>O acesso abaixo permite escolher qualquer perfil sem autenticação real.</p><button type="button" onClick={() => navigate('/perfis')}>Explorar perfis da plataforma</button></div>}
      </form>
    </section>
    {resetOpen && <div className="password-reset-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !resetLoading) setResetOpen(false); }}>
      <form className="password-reset-dialog" onSubmit={resetPassword} role="dialog" aria-modal="true" aria-labelledby="password-reset-title">
        <button className="password-reset-close" type="button" aria-label="Fechar" onClick={() => setResetOpen(false)} disabled={resetLoading}><X /></button>
        {message ? <>
          <span className="password-reset-icon success"><CheckCircle2 /></span>
          <h2 id="password-reset-title">Verifique seu e-mail</h2>
          <p>{message}</p>
          <button className="login-submit" type="button" onClick={() => setResetOpen(false)}>Voltar ao login</button>
        </> : <>
          <span className="password-reset-icon"><LockKeyhole /></span>
          <h2 id="password-reset-title">Recuperar acesso</h2>
          <p>Informe o e-mail cadastrado. Você receberá um link para criar uma nova senha.</p>
          <label><span>E-mail</span><div><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus required placeholder="seuemail@empresa.com" /></div></label>
          {error && <div className="login-feedback error" role="alert">{error}</div>}
          <button className="login-submit" disabled={resetLoading}>{resetLoading ? <><LoaderCircle className="spin" /> Enviando link...</> : <>Enviar link de recuperação <ArrowRight /></>}</button>
        </>}
      </form>
    </div>}
  </main>;
}
