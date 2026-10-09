import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Mail, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { AuthFrame } from '@/components/crm/auth-frame';
import { authMessage, verifiedUser } from '@/lib/auth';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Entrar — Minha Carteira' }, { name: 'description', content: 'Entre ou crie sua conta no CRM Minha Carteira.' },
    { property: 'og:title', content: 'Entrar — Minha Carteira' }, { property: 'og:description', content: 'Acesso seguro à sua carteira de clientes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const switchMode = (next: typeof mode) => { setMode(next); setMessage(''); setError(''); setPassword(''); };
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) setError(authMessage(result.error));
        else setMessage('Se houver uma conta com este e-mail, você receberá um link para redefinir sua senha.');
      } else if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (result.error) setError(authMessage(result.error));
        else setMessage('Confira sua caixa de entrada e confirme seu e-mail antes de entrar.');
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) setError(authMessage(result.error));
        else if (await verifiedUser()) await navigate({ to: '/', replace: true });
      }
    } catch { setError('Não foi possível conectar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError('');
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) setError('Não foi possível entrar com Google. Tente novamente.');
      else if (!result.redirected && await verifiedUser()) await navigate({ to: '/', replace: true });
    } catch { setError('Não foi possível entrar com Google. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame title={mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Recuperar senha' : 'Entrar'}>
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-semibold">E-mail<input className="field mt-1.5" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      {mode !== 'forgot' && <label className="block text-sm font-semibold">Senha<input className="field mt-1.5" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} required /></label>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-success">{message}</p>}
      <Button className="w-full" disabled={busy} type="submit">{mode === 'forgot' ? <Mail /> : mode === 'signup' ? <UserPlus /> : <LogIn />}{busy ? 'Aguarde…' : mode === 'forgot' ? 'Enviar link' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</Button>
    </form>
    {mode !== 'forgot' && <><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div><Button variant="outline" className="w-full" disabled={busy} onClick={google}><span className="text-lg font-bold" aria-hidden="true">G</span>Continuar com Google</Button></>}
    <div className="mt-5 flex flex-wrap justify-center gap-1">
      {mode === 'login' && <Button variant="link" disabled={busy} onClick={() => switchMode('forgot')}>Esqueci minha senha</Button>}
      <Button variant="link" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Criar conta' : 'Voltar para entrar'}</Button>
    </div>
  </AuthFrame>;
}