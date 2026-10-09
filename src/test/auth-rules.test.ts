import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: {} } }));
import { passwordChangeInput } from '@/lib/auth';
describe('Password changes', () => {
  it('requires the current password for signed-in changes', () => {
    expect(() => passwordChangeInput('NewPass123!', 'NewPass123!', '')).toThrow();
    expect(passwordChangeInput('NewPass123!', 'NewPass123!', 'OldPass123!')).toEqual({ password: 'NewPass123!', current_password: 'OldPass123!' });
  });
  it('does not send a current password for recovery', () => {
    expect(passwordChangeInput('NewPass123!', 'NewPass123!')).toEqual({ password: 'NewPass123!' });
  });
  it('rejects mismatched confirmation', () => {
    expect(() => passwordChangeInput('NewPass123!', 'Different123!', 'OldPass123!')).toThrow();
  });
});
