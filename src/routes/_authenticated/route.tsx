import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { verifiedUser } from '@/lib/auth';
import { AppShell } from '@/components/crm/shell';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const user = await verifiedUser();
    if (!user) throw redirect({ to: '/auth', replace: true });
    return { user };
  },
  component: () => <AppShell><Outlet /></AppShell>,
});