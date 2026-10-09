import { supabase } from '@/integrations/supabase/client';

export function passwordChangeInput(password: string, confirmation: string, currentPassword?: string) {
  if (password.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
  if (password !== confirmation) throw new Error('As senhas não coincidem.');
  if (currentPassword !== undefined && !currentPassword) throw new Error('Informe sua senha atual.');
  return currentPassword === undefined ? { password } : { password, current_password: currentPassword };
}

export function authMessage(error: { message: string }) {
  if (/invalid login credentials/i.test(error.message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(error.message)) return 'Confirme seu e-mail antes de entrar.';
  if (/rate limit/i.test(error.message)) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (/current password|reauthentication/i.test(error.message)) return 'Verifique sua senha atual e tente novamente.';
  if (/same password/i.test(error.message)) return 'Escolha uma senha diferente da atual.';
  if (/weak|password/i.test(error.message)) return 'Use uma senha forte e confira os dados informados.';
  return 'Não foi possível concluir. Tente novamente.';
}

export async function verifiedUser() {
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}