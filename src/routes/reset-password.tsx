import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AuthFrame } from '@/components/crm/auth-frame';
import { authMessage, passwordChangeInput, verifiedUser } from '@/lib/auth';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [{ title: 'Redefinir senha — Minha Carteira' }, { name: 'description', content: 'Defina uma nova senha para sua conta.' }, { property: 'og:title', content: 'Redefinir senha — Minha Carteira' }, { property: 'og:description', content: 'Recuperação segura da sua conta.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: ResetPassword,
});
function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery' || sessionStorage.getItem('crm-password-recovery') === 'true';
    if (!recovery) { setChecked(true); return; }
    sessionStorage.setItem('crm-password-recovery', 'true');
    void verifiedUser().then(user => { setReady(Boolean(user)); setChecked(true); });
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const input = passwordChangeInput(password, confirmation);
      const { error: failure } = await supabase.auth.updateUser(input);
      if (failure) setError(authMessage(failure));
      else { sessionStorage.removeItem('crm-password-recovery'); setDone(true); await supabase.auth.signOut(); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame title="Redefinir senha">{done ? <p role="status" className="text-success">Senha atualizada. Entre com sua nova senha.</p> : !checked ? <p>Verificando link…</p> : !ready ? <p role="alert" className="text-danger">Este link é inválido ou expirou. Solicite outro link de recuperação.</p> : <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-semibold">Nova senha<input className="field mt-1.5" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label className="block text-sm font-semibold">Confirmar nova senha<input className="field mt-1.5" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
    {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}><KeyRound />{busy ? 'Aguarde…' : 'Salvar nova senha'}</Button>
  </form>}<Link to="/auth" className="mt-5 inline-block text-sm font-semibold text-primary">Voltar para entrar</Link></AuthFrame>;
}