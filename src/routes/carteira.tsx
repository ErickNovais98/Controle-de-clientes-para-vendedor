import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, ChevronRight, Phone, MapPin, MessageCircle, ClipboardPen, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Card, Empty, PageHeader, StatusBadge, IconBtn } from "@/components/crm/bits";
import { fmtDate, fmtRelative, nextContactOf, openDialog, useCrm, type CustomerStatus } from "@/lib/crm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Minha Carteira — Clientes" },
      { name: "description", content: "Busque, filtre e organize todos os seus clientes." },
      { property: "og:title", content: "Minha Carteira — Clientes" },
      { property: "og:description", content: "Sua carteira de clientes organizada e fácil de buscar." },
    ],
  }),
  component: Carteira,
});

type Sort = "name" | "last" | "next" | "status";
const FILTERS: { key: "todos" | CustomerStatus; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ativo", label: "Ativos" },
  { key: "negociacao", label: "Em negociação" },
  { key: "inativo", label: "Inativos" },
];

function Carteira() {
  const s = useCrm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | CustomerStatus>("todos");
  const [sort, setSort] = useState<Sort>("name");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = s.customers
      .filter((c) => filter === "todos" || c.status === filter)
      .filter((c) =>
        !term ||
        [c.name, c.company, c.phone, c.whatsapp, c.city, c.segment, c.email, ...c.tags].some((v) => v?.toLowerCase().includes(term)),
      )
      .map((c) => ({ c, next: nextContactOf(s, c.id) }));
    const order: Record<CustomerStatus, number> = { negociacao: 0, ativo: 1, inativo: 2 };
    list.sort((a, b) => {
      if (sort === "name") return a.c.name.localeCompare(b.c.name);
      if (sort === "status") return order[a.c.status] - order[b.c.status];
      if (sort === "last") return (a.c.lastContact ?? "0").localeCompare(b.c.lastContact ?? "0");
      return (a.next?.date ?? "9").localeCompare(b.next?.date ?? "9");
    });
    return list;
  }, [s, q, filter, sort]);

  return (
    <>
      <PageHeader
        title="Minha Carteira"
        subtitle={`${s.customers.length} clientes`}
        actions={<Button onClick={() => openDialog({ kind: "customer" })}><Plus /> Novo Cliente</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field h-11 pl-9" placeholder="Buscar cliente..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn("rounded-full border px-3.5 py-2 text-sm font-medium", filter === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}
            >
              {f.label}
            </button>
          ))}
          <select className="field h-10 w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar">
            <option value="name">Ordenar: Nome</option>
            <option value="last">Ordenar: Último contato</option>
            <option value="next">Ordenar: Próximo contato</option>
            <option value="status">Ordenar: Status</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <Empty text={s.loaded ? "Nenhum cliente encontrado." : "Carregando..."} />
        ) : (
          <>
            <table className="hidden w-full text-sm lg:table">
              <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Último contato</th>
                  <th className="px-4 py-3">Próximo contato</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ c, next }) => (
                  <tr key={c.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <Link to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-3">
                        <Avatar name={c.name} className="size-9" />
                        <div>
                          <div className="font-semibold hover:text-primary">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.company}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.phone || "—"}</td>
                    <td className="px-4 py-3">{c.city ? `${c.city}/${c.state}` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div>{fmtDate(c.lastContact)}</div>
                      <div className="text-xs text-muted-foreground">{fmtRelative(c.lastContact)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {next ? (
                        <>
                          <div>{fmtDate(next.date)}</div>
                          <div className="text-xs text-muted-foreground">{next.title}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {c.phone && <IconBtn title="Ligar" onClick={() => { window.location.href = `tel:${c.phone.replace(/\D/g, "")}`; }}><Phone className="size-4" /></IconBtn>}
                        {(c.whatsapp || c.phone) && <IconBtn title="WhatsApp" onClick={() => {
                          const n = (c.whatsapp || c.phone).replace(/\D/g, "");
                          window.open(`https://wa.me/${n.startsWith("55") ? n : `55${n}`}`, "_blank", "noopener,noreferrer");
                        }}><MessageCircle className="size-4" /></IconBtn>}
                        <IconBtn title="Registrar atendimento" onClick={() => openDialog({ kind: "interaction", customerId: c.id })}><ClipboardPen className="size-4" /></IconBtn>
                        <IconBtn title="Agendar contato" onClick={() => openDialog({ kind: "followup", customerId: c.id })}><CalendarPlus className="size-4" /></IconBtn>
                        <Link to="/clientes/$id" params={{ id: c.id }} title="Abrir cliente" aria-label="Abrir cliente" className="inline-flex size-9 items-center justify-center rounded-lg border text-primary hover:bg-accent"><ChevronRight className="size-4" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="divide-y lg:hidden">
              {rows.map(({ c, next }) => (
                <Link key={c.id} to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-3 p-4 hover:bg-muted">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{c.name}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.company}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {c.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.phone}</span>}
                      {c.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{c.city}</span>}
                      <span>Último: {fmtRelative(c.lastContact)}</span>
                      {next && <span>Próximo: {fmtDate(next.date)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
