import { Link } from "@tanstack/react-router";
import { Home, Users, CalendarDays, Bell, Settings, Plus, ClipboardPen, Search, X, CircleUserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { followVisual, openDialog, useCrm } from "@/lib/crm";
import { CrmDialogs } from "./dialogs";

const NAV = [
  { to: "/", label: "Painel", icon: Home },
  { to: "/carteira", label: "Minha Carteira", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/lembretes", label: "Lembretes", icon: Bell },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const s = useCrm();
  const [search, setSearch] = useState("");
  const matching = search.trim() ? s.customers.filter((c) =>
    [c.name, c.company, c.phone, c.whatsapp, c.email, c.city].some((v) => v.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))),
  ).slice(0, 6) : [];
  const alerts = s.followUps.filter((f) => {
    const v = followVisual(f);
    return v === "atrasado" || v === "hoje";
  }).length;

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2 pt-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="size-5" />
          </div>
          <div>
            <div className="font-bold leading-tight">Minha Carteira</div>
            <div className="text-xs text-muted-foreground">CRM do vendedor</div>
          </div>
        </div>
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" aria-label="Buscar cliente" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button type="button" aria-label="Limpar busca" onClick={() => setSearch("")} className="absolute right-2 top-2 text-muted-foreground"><X className="size-4" /></button>}
          {search && <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover shadow-card">
            {matching.length ? matching.map((c) => <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} onClick={() => setSearch("")} className="block border-b px-3 py-2 text-sm hover:bg-accent"><span className="block font-semibold">{c.name}</span><span className="block truncate text-xs text-muted-foreground">{c.company}</span></Link>) : <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
          </div>}
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: I }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
            >
              <I className="size-5" />
              <span className="flex-1">{label}</span>
              {to === "/lembretes" && alerts > 0 && (
                <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-primary-foreground">{alerts}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Button asChild variant="ghost"><Link to="/minha-conta"><CircleUserRound /> Minha conta</Link></Button>
          <Button disabled={!s.loaded} onClick={() => openDialog({ kind: "interaction" })}>
            <ClipboardPen /> Registrar atendimento
          </Button>
          <Button variant="outline" disabled={!s.loaded} onClick={() => openDialog({ kind: "customer" })}>
            <Plus /> Novo Cliente
          </Button>
        </div>
      </aside>

      <main className="mx-auto min-w-0 max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10">
        <div className="mb-3 flex justify-end md:hidden"><Button asChild variant="ghost" size="sm"><Link to="/minha-conta"><CircleUserRound />Minha conta</Link></Button></div>
        <div className="relative mb-5 md:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" aria-label="Buscar cliente" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover shadow-card">
            {matching.length ? matching.map((c) => <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} onClick={() => setSearch("")} className="block border-b px-3 py-2 text-sm hover:bg-accent"><span className="block font-semibold">{c.name}</span><span className="block truncate text-xs text-muted-foreground">{c.company}</span></Link>) : <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
          </div>}
        </div>
        {children}
      </main>

      <button
        onClick={() => openDialog({ kind: "interaction" })}
        disabled={!s.loaded}
        aria-label="Registrar atendimento"
        className="fixed bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card md:hidden"
      >
        <ClipboardPen className="size-6" />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card md:hidden">
        {NAV.map(({ to, label, icon: I }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <I className="size-5" />
            <span className="truncate">{label.replace("Minha ", "")}</span>
            {to === "/lembretes" && alerts > 0 && (
              <span className="absolute right-1/4 top-1.5 size-2 rounded-full bg-danger" />
            )}
          </Link>
        ))}
      </nav>
      <CrmDialogs />
    </div>
  );
}
