import type { ReactNode } from 'react';
import { Users } from 'lucide-react';

export function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Users /></div><div><p className="text-xl font-bold">Minha Carteira</p><p className="text-sm text-muted-foreground">CRM do vendedor</p></div></div>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  </main>;
}