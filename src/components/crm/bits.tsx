import { Link } from "@tanstack/react-router";
import {
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Users,
  HelpCircle,
  Check,
  CalendarClock,
  X,
  UserRound,
  ClipboardPen,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  TYPE_LABEL,
  crm,
  followVisual,
  fmtDate,
  openDialog,
  type Customer,
  type CustomerStatus,
  type FollowUp,
  type FollowVisual,
  type InteractionType,
} from "@/lib/crm";
import { toast } from "sonner";

const statusStyle: Record<CustomerStatus, string> = {
  ativo: "bg-success-soft text-success",
  negociacao: "bg-warning-soft text-warning",
  inativo: "bg-neutral-soft text-muted-foreground",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyle[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const followStyle: Record<FollowVisual, { cls: string; label: string }> = {
  atrasado: { cls: "bg-danger-soft text-danger", label: "Atrasado" },
  hoje: { cls: "bg-warning-soft text-warning", label: "Hoje" },
  proximo: { cls: "bg-info-soft text-info", label: "Próximo" },
  concluido: { cls: "bg-success-soft text-success", label: "Concluído" },
  cancelado: { cls: "bg-neutral-soft text-muted-foreground", label: "Cancelado" },
};

export function FollowBadge({ v }: { v: FollowVisual }) {
  const s = followStyle[v];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls)}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export const followDot: Record<FollowVisual, string> = {
  atrasado: "bg-danger",
  hoje: "bg-warning",
  proximo: "bg-info",
  concluido: "bg-success",
  cancelado: "bg-muted-foreground",
};

const typeIcons: Record<InteractionType, typeof Phone> = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  visita: MapPin,
  email: Mail,
  reuniao: Users,
  outro: HelpCircle,
};

export function TypeIcon({ type, className }: { type: InteractionType; className?: string }) {
  const I = typeIcons[type];
  return <I className={className} aria-label={TYPE_LABEL[type]} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card shadow-card", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary", className)}>
      {initials(name)}
    </div>
  );
}

export function completeFollowUp(f: FollowUp) {
  crm.setFollowUpStatus(f.id, "concluido");
  toast.success("Contato concluído.", {
    action: {
      label: "Registrar atendimento",
      onClick: () => openDialog({ kind: "interaction", customerId: f.customerId }),
    },
    duration: 8000,
  });
}

export function FollowUpRow({ f, customer, compact }: { f: FollowUp; customer?: Customer; compact?: boolean }) {
  const v = followVisual(f);
  const pending = f.status === "pendente";
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="w-16 shrink-0 text-center">
          <div className="text-sm font-bold">{f.time}</div>
          <div className="text-xs text-muted-foreground">{fmtDate(f.date).slice(0, 5)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {customer ? (
              <Link to="/clientes/$id" params={{ id: customer.id }} className="truncate font-semibold hover:text-primary">
                {customer.name}
              </Link>
            ) : (
              <span className="font-semibold">Cliente removido</span>
            )}
            <FollowBadge v={v} />
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {f.title}
            {f.description && !compact ? ` — ${f.description}` : ""}
          </div>
        </div>
      </div>
      {pending && (
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          <IconBtn title="Concluir" onClick={() => completeFollowUp(f)} tone="success">
            <Check className="size-4" />
          </IconBtn>
          <IconBtn title="Registrar atendimento" onClick={() => openDialog({ kind: "interaction", customerId: f.customerId, followUpId: f.id })}>
            <ClipboardPen className="size-4" />
          </IconBtn>
          <IconBtn title="Reagendar" onClick={() => openDialog({ kind: "followup", followUpId: f.id })}>
            <CalendarClock className="size-4" />
          </IconBtn>
          {!compact && (
            <IconBtn
              title="Cancelar"
              tone="danger"
              onClick={() => {
                crm.setFollowUpStatus(f.id, "cancelado");
                toast("Contato cancelado.");
              }}
            >
              <X className="size-4" />
            </IconBtn>
          )}
          {customer && (
            <Link
              to="/clientes/$id"
              params={{ id: customer.id }}
              title="Abrir cliente"
              className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <UserRound className="size-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function IconBtn({
  title,
  onClick,
  children,
  tone,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "success" | "danger";
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        tone === "success" && "hover:bg-success-soft hover:text-success",
        tone === "danger" && "hover:bg-danger-soft hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
