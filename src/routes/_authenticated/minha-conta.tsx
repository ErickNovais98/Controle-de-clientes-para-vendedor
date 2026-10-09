import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { KeyRound, LogOut, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/crm/bits';
import { authMessage, passwordChangeInput } from '@/lib/auth';
import { openDialog } from '@/lib/crm';

export const Route = createFileRoute('/_authenticated/minha-conta')({
  head: () => ({ meta: [{ title: 'Minha conta — Minha Carteira' }, { name: 'description', content: 'Consulte seu e-mail e altere sua senha.' }, { property: 'og:title', content: 'Minha conta — Minha Carteira' }, { property: 'og:description', content: 'Gerencie o acesso à sua conta.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Account,
});
function Account() {
  const { user, queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const { error: failure } = await supabase.auth.updateUser(passwordChangeInput(password, confirmation, current));
      if (failure) setError(authMessage(failure));
      else { setCurrent(''); setPassword(''); setConfirmation(''); setMessage('Senha alterada com sucesso.'); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError('');
    await queryClient.cancelQueries(); queryClient.clear(); openDialog(null);
    const { error: failure } = await supabase.auth.signOut();
    if (failure) { setError(authMessage(failure)); setBusy(false); return; }
    await router.invalidate(); await navigate({ to: '/auth', replace: true });
  }
  return <><PageHeader title="Minha conta" /><div className="max-w-lg">
    <div className="mb-8 flex items-center gap-3 border-b pb-6"><Mail className="size-5 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">E-mail</p><p className="break-all font-semibold">{user.email}</p></div></div>
    <h2 className="mb-4 text-lg font-bold">Alterar senha</h2>
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-semibold">Senha atual<input className="field mt-1.5" type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Nova senha<input className="field mt-1.5" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Confirmar nova senha<input className="field mt-1.5" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
      <Button disabled={busy} type="submit"><KeyRound />{busy ? 'Aguarde…' : 'Alterar senha'}</Button>
    </form><div className="mt-8 border-t pt-5"><Button variant="outline" disabled={busy} onClick={signOut}><LogOut />Sair da conta</Button></div>
  </div></>;
}