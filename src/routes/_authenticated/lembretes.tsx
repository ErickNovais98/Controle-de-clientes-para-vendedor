import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Empty, FollowUpRow, PageHeader } from "@/components/crm/bits";
import { followVisual, sortFollow, useCrm, type FollowVisual } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lembretes")({
  head: () => ({
    meta: [
      { title: "Lembretes — Minha Carteira" },
      { name: "description", content: "Retornos de hoje, próximos e atrasados em um só lugar." },
      { property: "og:title", content: "Lembretes — Minha Carteira" },
      { property: "og:description", content: "Não esqueça nenhum retorno para seus clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lembretes,
});

const TABS: { key: FollowVisual; label: string; tone: string }[] = [
  { key: "hoje", label: "Hoje", tone: "bg-warning" },
  { key: "atrasado", label: "Atrasados", tone: "bg-danger" },
  { key: "proximo", label: "Próximos", tone: "bg-info" },
  { key: "concluido", label: "Concluídos", tone: "bg-success" },
];

function Lembretes() {
  const s = useCrm();
  const [tab, setTab] = useState<FollowVisual>("hoje");
  const byId = new Map(s.customers.map((c) => [c.id, c]));
  const reminders = s.followUps.filter((f) => f.reminder || f.status !== "pendente");
  const count = (k: FollowVisual) => reminders.filter((f) => followVisual(f) === k).length;
  let list = reminders.filter((f) => followVisual(f) === tab).sort(sortFollow);
  if (tab === "concluido") list = list.reverse().slice(0, 30);

  return (
    <>
      <PageHeader title="Lembretes" subtitle="Quem está esperando seu retorno." />
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors", tab === t.key ? "border-primary ring-2 ring-primary/20" : "hover:bg-accent")}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn("size-2.5 rounded-full", t.tone)} /> {t.label}
            </span>
            <span className="text-xl font-bold">{count(t.key)}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {list.length === 0 ? (
          <Card><Empty text="Nenhum lembrete aqui." /></Card>
        ) : (
          list.map((f) => <FollowUpRow key={f.id} f={f} customer={byId.get(f.customerId)} />)
        )}
      </div>
    </>
  );
}
