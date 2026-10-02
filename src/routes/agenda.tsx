import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Empty, FollowUpRow, PageHeader, followDot } from "@/components/crm/bits";
import { addDays, followVisual, parseISO, sortFollow, toISO, todayISO, useCrm, openDialog } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Minha Carteira" },
      { name: "description", content: "Seus retornos e atividades por dia, semana ou mês." },
      { property: "og:title", content: "Agenda — Minha Carteira" },
      { property: "og:description", content: "Veja e organize seus próximos contatos com clientes." },
    ],
  }),
  component: Agenda,
});

type View = "dia" | "semana" | "mes";
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function Agenda() {
  const s = useCrm();
  const [view, setView] = useState<View>("semana");
  const [day, setDay] = useState(todayISO());
  const [showDone, setShowDone] = useState(false);
  const byId = new Map(s.customers.map((c) => [c.id, c]));
  const items = s.followUps.filter((f) => (showDone ? f.status !== "cancelado" : f.status === "pendente")).sort(sortFollow);
  const on = (d: string) => items.filter((f) => f.date === d);
  const t = todayISO();

  const d = parseISO(day);
  const weekStart = addDays(day, -d.getDay());
  const monthStart = toISO(new Date(d.getFullYear(), d.getMonth(), 1));
  const gridStart = addDays(monthStart, -parseISO(monthStart).getDay());

  const shift = (n: number) => {
    if (view === "dia") setDay(addDays(day, n));
    else if (view === "semana") setDay(addDays(day, 7 * n));
    else setDay(toISO(new Date(d.getFullYear(), d.getMonth() + n, 1)));
  };

  const title =
    view === "mes"
      ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      : view === "semana"
        ? `Semana de ${parseISO(weekStart).getDate()}/${parseISO(weekStart).getMonth() + 1}`
        : `${WEEK[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;

  return (
    <>
      <PageHeader
        title="Agenda"
        actions={<Button onClick={() => openDialog({ kind: "followup" })}><CalendarPlus /> Agendar contato</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border bg-card p-1">
          {(["dia", "semana", "mes"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Anterior"><ChevronLeft /></Button>
          <Button variant="outline" onClick={() => setDay(t)}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo"><ChevronRight /></Button>
        </div>
        <div className="text-lg font-bold">{title}</div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4 accent-primary" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Mostrar concluídos
        </label>
      </div>

      {view === "mes" && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted text-center text-xs font-semibold text-muted-foreground">
            {WEEK.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).map((date) => {
              const list = on(date);
              const inMonth = parseISO(date).getMonth() === d.getMonth();
              return (
                <button
                  key={date}
                  onClick={() => { setDay(date); setView("dia"); }}
                  className={cn("min-h-20 border-b border-r p-1.5 text-left align-top hover:bg-accent md:min-h-24", !inMonth && "bg-muted/50 text-muted-foreground")}
                >
                  <div className={cn("mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold", date === t && "bg-primary text-primary-foreground")}>
                    {parseISO(date).getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {list.slice(0, 3).map((f) => (
                      <div key={f.id} className="flex items-center gap-1 truncate text-[11px]">
                        <span className={cn("size-1.5 shrink-0 rounded-full", followDot[followVisual(f)])} />
                        <span className="hidden truncate sm:inline">{byId.get(f.customerId)?.name.split(" ")[0]}</span>
                      </div>
                    ))}
                    {list.length > 3 && <div className="text-[11px] text-muted-foreground">+{list.length - 3}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {view === "semana" && (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((date) => {
            const list = on(date);
            return (
              <Card key={date} className={cn("p-3", date === t && "border-primary")}>
                <button onClick={() => { setDay(date); setView("dia"); }} className="mb-2 flex w-full items-baseline justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{WEEK[parseISO(date).getDay()]}</span>
                  <span className={cn("text-lg font-bold", date === t && "text-primary")}>{parseISO(date).getDate()}</span>
                </button>
                <div className="space-y-1.5">
                  {list.length === 0 && <div className="text-xs text-muted-foreground">—</div>}
                  {list.map((f) => (
                    <button key={f.id} onClick={() => { setDay(date); setView("dia"); }} className="w-full rounded-lg bg-muted p-2 text-left hover:bg-accent">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={cn("size-2 rounded-full", followDot[followVisual(f)])} /> {f.time}
                      </div>
                      <div className="truncate text-xs font-semibold">{byId.get(f.customerId)?.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{f.title}</div>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === "dia" && (
        <div className="flex flex-col gap-2">
          {on(day).length === 0 ? (
            <Card><Empty text="Nenhum contato neste dia." /></Card>
          ) : (
            on(day).map((f) => <FollowUpRow key={f.id} f={f} customer={byId.get(f.customerId)} />)
          )}
        </div>
      )}
    </>
  );
}
