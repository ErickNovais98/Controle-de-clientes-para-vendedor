import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone, MessageCircle, Mail, ClipboardPen, CalendarPlus, Pencil, Trash2, MapPin, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, Card, Empty, FollowUpRow, StatusBadge, TypeIcon } from "@/components/crm/bits";
import { TYPE_LABEL, crm, fmtDate, fmtRelative, openDialog, sortFollow, useCrm } from "@/lib/crm";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Perfil do cliente — Minha Carteira" },
      { name: "description", content: "Contatos, observações e histórico de atendimento do cliente." },
      { property: "og:title", content: "Perfil do cliente — Minha Carteira" },
      { property: "og:description", content: "Tudo sobre o cliente em um só lugar." },
    ],
  }),
  component: Perfil,
});

const digits = (s: string) => s.replace(/\D/g, "");

function Perfil() {
  const { id } = Route.useParams();
  const s = useCrm();
  const navigate = useNavigate();
  const c = s.customers.find((x) => x.id === id);
  const [notes, setNotes] = useState(c?.notes ?? "");
  useEffect(() => setNotes(c?.notes ?? ""), [c?.notes]);

  if (!s.loaded) return <Empty text="Carregando..." />;
  if (!c)
    return (
      <Card className="p-8 text-center">
        <p className="mb-4">Cliente não encontrado.</p>
        <Link to="/carteira" className="font-semibold text-primary">Voltar para a carteira</Link>
      </Card>
    );

  const history = s.interactions
    .filter((i) => i.customerId === id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const follows = s.followUps.filter((f) => f.customerId === id && f.status === "pendente").sort(sortFollow);
  const wa = digits(c.whatsapp || c.phone);
  const waNumber = wa ? (wa.startsWith("55") ? wa : `55${wa}`) : "";

  const actionCls = "inline-flex flex-col items-center gap-1.5 rounded-xl border bg-card px-3 py-3 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <>
      <Link to="/carteira" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Minha Carteira
      </Link>

      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={c.name} className="size-14 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
              <StatusBadge status={c.status} />
              {c.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{t}</span>
              ))}
            </div>
            <div className="text-muted-foreground">{c.company}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Último contato: <b className="text-foreground">{fmtRelative(c.lastContact)}</b></span>
              <span>Próximo: <b className="text-foreground">{follows[0] ? `${fmtDate(follows[0].date)} · ${follows[0].title}` : "não agendado"}</b></span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <a href={c.phone ? `tel:${digits(c.phone)}` : undefined} aria-disabled={!c.phone} className={actionCls}>
            <Phone className="size-5" /> Ligar
          </a>
          <a href={waNumber ? `https://wa.me/${waNumber}` : undefined} target="_blank" rel="noreferrer" aria-disabled={!waNumber} className={actionCls}>
            <MessageCircle className="size-5" /> WhatsApp
          </a>
          <a href={c.email ? `mailto:${c.email}` : undefined} aria-disabled={!c.email} className={actionCls}>
            <Mail className="size-5" /> E-mail
          </a>
          <button onClick={() => openDialog({ kind: "interaction", customerId: c.id })} className={`${actionCls} border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground`}>
            <ClipboardPen className="size-5" /> Registrar
          </button>
          <button onClick={() => openDialog({ kind: "followup", customerId: c.id })} className={actionCls}>
            <CalendarPlus className="size-5" /> Agendar
          </button>
          <button onClick={() => openDialog({ kind: "customer", customerId: c.id })} className={actionCls}>
            <Pencil className="size-5" /> Editar
          </button>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Contato</h2>
            <dl className="space-y-2.5 text-sm">
              {[
                [Phone, "Telefone", c.phone],
                [MessageCircle, "WhatsApp", c.whatsapp],
                [Mail, "E-mail", c.email],
                [MapPin, "Cidade", c.city ? `${c.city}${c.state ? ` / ${c.state}` : ""}` : ""],
                [Briefcase, "Segmento", c.segment],
                [Calendar, "Primeiro contato", fmtDate(c.firstContact)],
              ].map(([I, label, val]) => {
                const Icon = I as typeof Phone;
                return (
                  <div key={label as string} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{label as string}</dt>
                      <dd className="break-words font-medium">{(val as string) || "—"}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold">Observações</h2>
            <textarea
              className="field h-40 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, produtos de interesse, datas importantes, detalhes da negociação..."
            />
            {notes !== c.notes && (
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  crm.saveNotes(c.id, notes);
                  toast.success("Observações salvas.");
                }}
              >
                Salvar observações
              </Button>
            )}
          </Card>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger">
                <Trash2 /> Excluir cliente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {c.name}?</AlertDialogTitle>
                <AlertDialogDescription>O histórico e os contatos agendados também serão removidos.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    crm.deleteCustomer(c.id);
                    toast.success("Cliente excluído.");
                    navigate({ to: "/carteira" });
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 font-bold">Próximos contatos</h2>
            <div className="flex flex-col gap-2">
              {follows.length === 0 ? (
                <Card><Empty text="Nenhum contato agendado." /></Card>
              ) : (
                follows.map((f) => <FollowUpRow key={f.id} f={f} customer={c} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-bold">Histórico de Atendimento</h2>
            <Card className="p-5">
              {history.length === 0 ? (
                <Empty text="Nenhum atendimento registrado ainda." />
              ) : (
                <ol className="relative space-y-6 border-l-2 border-border pl-6">
                  {history.map((i) => (
                    <li key={i.id} className="relative">
                      <span className="absolute -left-[37px] flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary-soft text-primary">
                        <TypeIcon type={i.type} className="size-4" />
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-bold">{fmtDate(i.date)}</span>
                        <span className="text-muted-foreground">{i.time}</span>
                        <span className="font-semibold text-primary">{TYPE_LABEL[i.type]}</span>
                      </div>
                      <p className="mt-1 text-sm">{i.description}</p>
                      {i.nextFollowUp && (
                        <p className="mt-1 text-xs text-muted-foreground">Próximo contato: {fmtDate(i.nextFollowUp)}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
