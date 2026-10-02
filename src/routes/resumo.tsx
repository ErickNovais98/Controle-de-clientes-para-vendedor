import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Handshake, UserX, ClipboardPen, CalendarClock, AlertTriangle, Clock } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/bits";
import { followVisual, staleCustomers, useCrm } from "@/lib/crm";

export const Route = createFileRoute("/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo da Carteira — Minha Carteira" },
      { name: "description", content: "Resumo dos clientes, atendimentos e contatos pendentes da sua carteira." },
      { property: "og:title", content: "Resumo da Carteira — Minha Carteira" },
      { property: "og:description", content: "Uma visão rápida da sua carteira de clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Resumo,
});

function Resumo() {
  const s = useCrm();
  const stats = [
    { label: "Total de clientes", value: s.customers.length, icon: Users, tone: "text-primary bg-primary-soft" },
    { label: "Clientes ativos", value: s.customers.filter((c) => c.status === "ativo").length, icon: UserCheck, tone: "text-success bg-success-soft" },
    { label: "Em negociação", value: s.customers.filter((c) => c.status === "negociacao").length, icon: Handshake, tone: "text-warning bg-warning-soft" },
    { label: "Clientes inativos", value: s.customers.filter((c) => c.status === "inativo").length, icon: UserX, tone: "text-muted-foreground bg-neutral-soft" },
    { label: "Atendimentos realizados", value: s.interactions.length, icon: ClipboardPen, tone: "text-info bg-info-soft" },
    { label: "Contatos pendentes", value: s.followUps.filter((f) => f.status === "pendente").length, icon: CalendarClock, tone: "text-primary bg-primary-soft" },
    { label: "Retornos atrasados", value: s.followUps.filter((f) => followVisual(f) === "atrasado").length, icon: AlertTriangle, tone: "text-danger bg-danger-soft" },
    { label: "Sem contato recente", value: staleCustomers(s).length, icon: Clock, tone: "text-warning bg-warning-soft" },
  ];
  return <>
    <PageHeader title="Resumo da Carteira" subtitle="Uma visão rápida do seu trabalho." />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="p-5">
        <div className={`mb-4 flex size-10 items-center justify-center rounded-lg ${tone}`}><Icon className="size-5" /></div>
        <div className="text-3xl font-bold">{s.loaded ? value : "–"}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </Card>)}
    </div>
  </>;
}