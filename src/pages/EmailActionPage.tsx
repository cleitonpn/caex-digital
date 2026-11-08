import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldAlert, Wrench } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { getFirebaseServices } from '../services/firebase';

type ActionStatus = 'checking' | 'ready' | 'saving' | 'success' | 'error';

function loginUrl() {
  return `${window.location.origin}${window.location.pathname}#/entrar`;
}

export function EmailActionPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const mode = params.get('mode') ?? '';
  const code = params.get('oobCode') ?? '';
  const [status, setStatus] = useState<ActionStatus>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services || !code || !['resetPassword', 'verifyEmail', 'recoverEmail'].includes(mode)) {
      setError('Este link é inválido. Solicite um novo e-mail de recuperação.');
      setStatus('error');
      return;
    }

    let active = true;
    const verify = async () => {
      try {
        if (mode === 'resetPassword') {
          const actionEmail = await verifyPasswordResetCode(services.auth, code);
          if (active) { setEmail(actionEmail); setStatus('ready'); }
          return;
        }
        await applyActionCode(services.auth, code);
        if (active) setStatus('success');
      } catch {
        if (active) {
          setError('Este link expirou, já foi utilizado ou não é válido. Solicite um novo link.');
          setStatus('error');
        }
      }
    };
    void verify();
    return () => { active = false; };
  }, [code, mode]);

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { setError('Crie uma senha com pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As duas senhas precisam ser iguais.'); return; }
    const services = getFirebaseServices();
    if (!services) { setError('O Firebase não está disponível agora. Tente novamente.'); return; }
    setStatus('saving');
    setError('');
    try {
      await confirmPasswordReset(services.auth, code, password);
      setStatus('success');
    } catch {
      setError('Não foi possível salvar a senha. O link pode ter expirado; solicite um novo.');
      setStatus('error');
    }
  };

  const successTitle = mode === 'resetPassword' ? 'Senha criada com sucesso' : mode === 'verifyEmail' ? 'E-mail confirmado' : 'E-mail recuperado';

  return <main className="email-action-page">
    <section className="email-action-card">
      <div className="email-action-brand"><span><Wrench /></span><strong>CAEXOne</strong></div>
      {status === 'checking' && <div className="email-action-state"><span className="password-reset-icon"><LoaderCircle className="spin" /></span><h1>Validando seu link</h1><p>Aguarde enquanto confirmamos a solicitação com segurança.</p></div>}
      {(status === 'ready' || status === 'saving') && <form onSubmit={savePassword}>
        <span className="password-reset-icon"><LockKeyhole /></span>
        <h1>Crie uma nova senha</h1>
        <p>Defina a nova senha de acesso para <strong>{email}</strong>.</p>
        <label><span>Nova senha</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" autoFocus required minLength={8} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        <label><span>Confirmar nova senha</span><div><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required minLength={8} /></div></label>
        {error && <div className="login-feedback error" role="alert">{error}</div>}
        <button className="login-submit" disabled={status === 'saving'}>{status === 'saving' ? <><LoaderCircle className="spin" /> Salvando senha...</> : <>Salvar nova senha <ArrowRight /></>}</button>
      </form>}
      {status === 'success' && <div className="email-action-state"><span className="password-reset-icon success"><CheckCircle2 /></span><h1>{successTitle}</h1><p>Você já pode acessar o CAEXOne com seus dados atualizados.</p><a className="login-submit" href={loginUrl()}>Ir para o login <ArrowRight /></a></div>}
      {status === 'error' && <div className="email-action-state"><span className="password-reset-icon error"><ShieldAlert /></span><h1>Link indisponível</h1><p>{error}</p><a className="login-submit" href={loginUrl()}>Solicitar um novo link <ArrowRight /></a></div>}
    </section>
  </main>;
}
