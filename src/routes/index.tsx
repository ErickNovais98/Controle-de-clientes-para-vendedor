import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserCheck, Handshake, UserX, CalendarCheck, AlertTriangle, Clock, ArrowRight, Phone, MessageCircle } from "lucide-react";
import { Card, Empty, FollowUpRow, PageHeader, Avatar, StatusBadge, IconBtn } from "@/components/crm/bits";
import { daysBetween, followVisual, fmtRelative, sortFollow, staleCustomers, todayISO, useCrm } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Minha Carteira" },
      { name: "description", content: "Veja quem você precisa atender hoje, retornos atrasados e clientes sem contato." },
      { property: "og:title", content: "Painel — Minha Carteira" },
      { property: "og:description", content: "O que precisa da sua atenção hoje na sua carteira de clientes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useCrm();
  const t = todayISO();
  const byId = new Map(s.customers.map((c) => [c.id, c]));
  const pending = s.followUps.filter((f) => f.status === "pendente").sort(sortFollow);
  const overdue = pending.filter((f) => followVisual(f) === "atrasado");
  const today = pending.filter((f) => followVisual(f) === "hoje");
  const upcoming = pending.filter((f) => followVisual(f) === "proximo").slice(0, 6);
  const stale = staleCustomers(s);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = s.settings.sellerName ? `, ${s.settings.sellerName}` : "";

  const stats = [
    { label: "Total de clientes", value: s.customers.length, icon: Users, tone: "text-primary bg-primary-soft", to: "/carteira" },
    { label: "Clientes ativos", value: s.customers.filter((c) => c.status === "ativo").length, icon: UserCheck, tone: "text-success bg-success-soft", to: "/carteira" },
    { label: "Em negociação", value: s.customers.filter((c) => c.status === "negociacao").length, icon: Handshake, tone: "text-warning bg-warning-soft", to: "/carteira" },
    { label: "Clientes inativos", value: s.customers.filter((c) => c.status === "inativo").length, icon: UserX, tone: "text-muted-foreground bg-neutral-soft", to: "/carteira" },
    { label: "Contatos para hoje", value: today.length, icon: CalendarCheck, tone: "text-warning bg-warning-soft", to: "/lembretes" },
    { label: "Retornos atrasados", value: overdue.length, icon: AlertTriangle, tone: "text-danger bg-danger-soft", to: "/lembretes" },
    { label: "Sem contato recente", value: stale.length, icon: Clock, tone: "text-info bg-info-soft", to: "/carteira" },
  ] as const;

  const attention = [...overdue, ...today];

  return (
    <>
      <PageHeader title={`${greet}${name}!`} subtitle="Olá! Aqui está o que precisa da sua atenção hoje." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map(({ label, value, icon: I, tone, to }) => (
          <Link key={label} to={to}>
            <Card className="h-full p-4 transition-transform hover:-translate-y-0.5">
              <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", tone)}>
                <I className="size-5" />
              </div>
              <div className="text-2xl font-bold">{s.loaded ? value : "–"}</div>
              <div className="text-xs leading-tight text-muted-foreground">{label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            Precisam de atenção
            {attention.length > 0 && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs text-danger">{attention.length}</span>}
          </h2>
          <div className="flex flex-col gap-2">
            {attention.length === 0 ? (
              <Card><Empty text="Tudo em dia! Nenhum retorno atrasado ou para hoje." /></Card>
            ) : (
              attention.map((f) => <FollowUpRow key={f.id} f={f} customer={byId.get(f.customerId)} compact />)
            )}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold">Próximos atendimentos</h2>
          <div className="flex flex-col gap-2">
            {upcoming.length === 0 ? (
              <Card><Empty text="Nenhum atendimento agendado." /></Card>
            ) : (
              upcoming.map((f) => <FollowUpRow key={f.id} f={f} customer={byId.get(f.customerId)} />)
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Clientes sem contato recente</h2>
          <Card className="divide-y">
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Sem contato há mais de {s.settings.staleDays} dias
            </div>
            {stale.length === 0 ? (
              <Empty text="Nenhum cliente esquecido. Ótimo trabalho!" />
            ) : (
              stale
                .sort((a, b) => (a.lastContact ?? "").localeCompare(b.lastContact ?? ""))
                .map((c) => (
                  <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
                    <Avatar name={c.name} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.lastContact ? `${daysBetween(c.lastContact, t)} dias sem contato` : "Nunca contatado"} · {c.company}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {c.phone && <IconBtn title={`Ligar para ${c.name}`} onClick={() => { window.location.href = `tel:${c.phone.replace(/\D/g, "")}`; }}><Phone className="size-4" /></IconBtn>}
                      {(c.whatsapp || c.phone) && <IconBtn title={`WhatsApp de ${c.name}`} onClick={() => {
                        const number = (c.whatsapp || c.phone).replace(/\D/g, "");
                        window.open(`https://wa.me/${number.startsWith("55") ? number : `55${number}`}`, "_blank", "noopener,noreferrer");
                      }}><MessageCircle className="size-4" /></IconBtn>}
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                ))
            )}
          </Card>

          <h2 className="mb-3 mt-8 text-lg font-bold">Últimos atendimentos</h2>
          <Card className="divide-y">
            {s.interactions.slice(0, 5).map((i) => {
              const c = byId.get(i.customerId);
              return c ? (
                <Link key={i.id} to="/clientes/$id" params={{ id: c.id }} className="block px-4 py-3 hover:bg-muted">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{c.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtRelative(i.date)}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{i.description}</div>
                </Link>
              ) : null;
            })}
            <Link to="/carteira" className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-semibold text-primary">
              Ver carteira <ArrowRight className="size-4" />
            </Link>
          </Card>
          <Link to="/resumo" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Resumo da Carteira <ArrowRight className="size-4" /></Link>
        </section>
      </div>
    </>
  );
}
