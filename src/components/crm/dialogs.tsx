import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  REASONS,
  STATUS_LABEL,
  TYPE_LABEL,
  crm,
  nowTime,
  openDialog,
  todayISO,
  useCrm,
  useDialog,
  type CustomerStatus,
  type InteractionType,
} from "@/lib/crm";

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={full ? "col-span-full block" : "block"}>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function CrmDialogs() {
  const d = useDialog();
  const close = () => openDialog(null);
  return (
    <Dialog open={!!d} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {d?.kind === "customer" && <CustomerForm customerId={d.customerId} onDone={close} />}
        {d?.kind === "interaction" && (
          <InteractionForm customerId={d.customerId} followUpId={d.followUpId} onDone={close} />
        )}
        {d?.kind === "followup" && (
          <FollowUpForm customerId={d.customerId} followUpId={d.followUpId} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customerId, onDone }: { customerId?: string | undefined; onDone: () => void }) {
  const s = useCrm();
  const navigate = useNavigate();
  const existing = s.customers.find((c) => c.id === customerId);
  const [f, setF] = useState({
    name: existing?.name ?? "",
    company: existing?.company ?? "",
    phone: existing?.phone ?? "",
    whatsapp: existing?.whatsapp ?? "",
    email: existing?.email ?? "",
    city: existing?.city ?? "",
    state: existing?.state ?? "",
    segment: existing?.segment ?? "",
    status: (existing?.status ?? "ativo") as CustomerStatus,
    firstContact: existing?.firstContact ?? todayISO(),
    notes: existing?.notes ?? "",
    tags: existing?.tags.join(", ") ?? "",
    nextDate: "",
    nextTime: "09:00",
  });
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Informe o nome do cliente."); return; }
    const id = crm.saveCustomer(
      {
        id: existing?.id,
        name: f.name.trim(),
        company: f.company,
        phone: f.phone,
        whatsapp: f.whatsapp,
        email: f.email,
        city: f.city,
        state: f.state.toUpperCase(),
        segment: f.segment,
        status: f.status,
        firstContact: f.firstContact,
        notes: f.notes,
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      f.nextDate ? { date: f.nextDate, time: f.nextTime, title: "Entrar em contato" } : undefined,
    );
    toast.success(existing ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
    onDone();
    if (!existing) navigate({ to: "/clientes/$id", params: { id } });
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{existing ? "Editar cliente" : "Novo Cliente"}</DialogTitle>
      </DialogHeader>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome do cliente *">
          <input className="field" value={f.name} onChange={up("name")} autoFocus />
        </Field>
        <Field label="Empresa">
          <input className="field" value={f.company} onChange={up("company")} />
        </Field>
        <Field label="Telefone">
          <input className="field" value={f.phone} onChange={up("phone")} placeholder="(11) 99999-9999" />
        </Field>
        <Field label="WhatsApp">
          <input className="field" value={f.whatsapp} onChange={up("whatsapp")} placeholder="Mesmo do telefone, se vazio" />
        </Field>
        <Field label="E-mail">
          <input className="field" type="email" value={f.email} onChange={up("email")} />
        </Field>
        <Field label="Segmento">
          <input className="field" value={f.segment} onChange={up("segment")} />
        </Field>
        <Field label="Cidade">
          <input className="field" value={f.city} onChange={up("city")} />
        </Field>
        <Field label="Estado">
          <input className="field" maxLength={2} value={f.state} onChange={up("state")} placeholder="SP" />
        </Field>
        <Field label="Status">
          <select className="field" value={f.status} onChange={up("status")}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Data do primeiro contato">
          <input className="field" type="date" value={f.firstContact} onChange={up("firstContact")} />
        </Field>
        {!existing && (
          <>
            <Field label="Próximo contato">
              <input className="field" type="date" value={f.nextDate} onChange={up("nextDate")} />
            </Field>
            <Field label="Horário">
              <input className="field" type="time" value={f.nextTime} onChange={up("nextTime")} />
            </Field>
          </>
        )}
        <Field label="Etiquetas (separadas por vírgula)" full>
          <input className="field" value={f.tags} onChange={up("tags")} placeholder="Ex.: Prioridade, Produto X" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.settings.tags.filter((tag) => !f.tags.split(",").map((x) => x.trim().toLocaleLowerCase("pt-BR")).includes(tag.toLocaleLowerCase("pt-BR"))).map((tag) => (
              <Button key={tag} type="button" variant="outline" size="sm" onClick={() => setF({ ...f, tags: f.tags.trim() ? `${f.tags.trim().replace(/,$/, "")}, ${tag}` : tag })}>{tag}</Button>
            ))}
          </div>
        </Field>
        <Field label="Observações" full>
          <textarea className="field h-24 py-2" value={f.notes} onChange={up("notes")} />
        </Field>
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

function InteractionForm({ customerId, followUpId, onDone }: { customerId?: string | undefined; followUpId?: string | undefined; onDone: () => void }) {
  const s = useCrm();
  const [f, setF] = useState({
    customerId: customerId ?? "",
    type: "ligacao" as InteractionType,
    date: todayISO(),
    time: nowTime(),
    description: "",
    nextDate: "",
    nextTime: "09:00",
    nextTitle: "Entrar em contato",
    reminder: true,
  });
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const customers = [...s.customers].sort((a, b) => a.name.localeCompare(b.name));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.customerId) { toast.error("Selecione o cliente."); return; }
    if (!f.description.trim()) { toast.error("Descreva o atendimento."); return; }
    crm.addInteraction(
      {
        customerId: f.customerId,
        type: f.type,
        date: f.date,
        time: f.time,
        description: f.description.trim(),
        nextFollowUp: f.nextDate || undefined,
      },
      { nextTime: f.nextTime, nextTitle: f.nextTitle, reminder: f.reminder, completeFollowUpId: followUpId },
    );
    toast.success("Atendimento registrado com sucesso.");
    onDone();
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Registrar Atendimento</DialogTitle>
      </DialogHeader>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cliente" full>
          <select className="field" value={f.customerId} onChange={up("customerId")}>
            <option value="">Selecione...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de atendimento" full>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABEL) as InteractionType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setF({ ...f, type: t })}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${f.type === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Data">
          <input className="field" type="date" value={f.date} onChange={up("date")} />
        </Field>
        <Field label="Hora">
          <input className="field" type="time" value={f.time} onChange={up("time")} />
        </Field>
        <Field label="Descrição" full>
          <textarea className="field h-24 py-2" value={f.description} onChange={up("description")} placeholder="O que foi conversado?" autoFocus />
        </Field>
        <div className="col-span-full rounded-xl bg-muted p-4">
          <div className="mb-3 text-sm font-semibold">Próximo contato (opcional)</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Data">
              <input className="field" type="date" value={f.nextDate} onChange={up("nextDate")} />
            </Field>
            <Field label="Hora">
              <input className="field" type="time" value={f.nextTime} onChange={up("nextTime")} />
            </Field>
            <Field label="Motivo">
              <input className="field" list="reasons" value={f.nextTitle} onChange={up("nextTitle")} />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.reminder} onChange={(e) => setF({ ...f, reminder: e.target.checked })} className="size-4 accent-primary" />
            Criar lembrete
          </label>
        </div>
      </div>
      <datalist id="reasons">{REASONS.map((r) => <option key={r} value={r} />)}</datalist>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

function FollowUpForm({ customerId, followUpId, onDone }: { customerId?: string | undefined; followUpId?: string | undefined; onDone: () => void }) {
  const s = useCrm();
  const existing = s.followUps.find((x) => x.id === followUpId);
  const [f, setF] = useState({
    customerId: existing?.customerId ?? customerId ?? "",
    date: existing?.date ?? todayISO(),
    time: existing?.time ?? "09:00",
    title: existing?.title ?? "Entrar em contato",
    description: existing?.description ?? "",
    reminder: existing?.reminder ?? true,
  });
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const customers = [...s.customers].sort((a, b) => a.name.localeCompare(b.name));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.customerId) { toast.error("Selecione o cliente."); return; }
    crm.saveFollowUp({ ...f, id: existing?.id });
    toast.success(existing ? "Contato reagendado." : "Próximo contato agendado.");
    onDone();
  };

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{existing ? "Reagendar contato" : "Agendar próximo contato"}</DialogTitle>
      </DialogHeader>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cliente" full>
          <select className="field" value={f.customerId} onChange={up("customerId")} disabled={!!existing}>
            <option value="">Selecione...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Data">
          <input className="field" type="date" value={f.date} onChange={up("date")} />
        </Field>
        <Field label="Hora">
          <input className="field" type="time" value={f.time} onChange={up("time")} />
        </Field>
        <Field label="Motivo do contato" full>
          <input className="field" list="reasons2" value={f.title} onChange={up("title")} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button type="button" key={r} onClick={() => setF({ ...f, title: r })} className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-accent hover:text-accent-foreground">
                {r}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Observações" full>
          <textarea className="field h-20 py-2" value={f.description} onChange={up("description")} />
        </Field>
        <label className="col-span-full flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.reminder} onChange={(e) => setF({ ...f, reminder: e.target.checked })} className="size-4 accent-primary" />
          Lembrete ativado
        </label>
      </div>
      <datalist id="reasons2">{REASONS.map((r) => <option key={r} value={r} />)}</datalist>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}
