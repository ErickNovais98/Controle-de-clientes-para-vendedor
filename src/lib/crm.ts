import { useEffect, useSyncExternalStore } from "react";

export type CustomerStatus = "ativo" | "negociacao" | "inativo";
export type InteractionType = "ligacao" | "whatsapp" | "visita" | "email" | "reuniao" | "outro";
export type FollowUpStatus = "pendente" | "concluido" | "cancelado";
export type FollowVisual = "atrasado" | "hoje" | "proximo" | "concluido" | "cancelado";

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  segment: string;
  status: CustomerStatus;
  firstContact: string;
  lastContact?: string | undefined;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  type: InteractionType;
  date: string;
  time: string;
  description: string;
  nextFollowUp?: string | undefined;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  date: string;
  time: string;
  title: string;
  description: string;
  status: FollowUpStatus;
  reminder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  sellerName: string;
  staleDays: number;
  tags: string[];
  notifications: { today: boolean; overdue: boolean; upcoming: boolean; stale: boolean };
}

export interface CrmState {
  loaded: boolean;
  customers: Customer[];
  interactions: Interaction[];
  followUps: FollowUp[];
  settings: Settings;
}

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  ativo: "Ativo",
  negociacao: "Em negociação",
  inativo: "Inativo",
};

export const TYPE_LABEL: Record<InteractionType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  visita: "Visita",
  email: "E-mail",
  reuniao: "Reunião",
  outro: "Outro",
};

export const REASONS = [
  "Retornar orçamento",
  "Apresentar novo produto",
  "Confirmar pedido",
  "Verificar interesse",
  "Fazer visita",
  "Entrar em contato",
];

/* ---------- datas ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
export const fmtDate = (s?: string) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};
export const fmtRelative = (s?: string) => {
  if (!s) return "Nunca";
  const diff = daysBetween(todayISO(), s);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  if (diff < 0) return `há ${-diff} dias`;
  return `em ${diff} dias`;
};

export const followVisual = (f: FollowUp): FollowVisual => {
  if (f.status === "concluido") return "concluido";
  if (f.status === "cancelado") return "cancelado";
  const t = todayISO();
  if (f.date < t) return "atrasado";
  if (f.date === t) return "hoje";
  return "proximo";
};

export const sortFollow = (a: FollowUp, b: FollowUp) =>
  (a.date + a.time).localeCompare(b.date + b.time);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const stamp = () => new Date().toISOString();

/* ---------- store ---------- */
const KEY = "crm-vendas-v1";
const EMPTY: CrmState = {
  loaded: false,
  customers: [],
  interactions: [],
  followUps: [],
  settings: { sellerName: "", staleDays: 30, tags: ["Cliente importante", "Novo cliente", "Potencial", "Visita frequente", "Prioridade"], notifications: { today: true, overdue: true, upcoming: true, stale: true } },
};

let state: CrmState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  const { loaded: _l, ...rest } = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* ignore */
  }
}
function set(updater: (s: CrmState) => CrmState) {
  state = updater(state);
  persist();
  emit();
}

function load() {
  if (state.loaded || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state = { ...EMPTY, ...data, settings: { ...EMPTY.settings, ...data.settings, notifications: { ...EMPTY.settings.notifications, ...data.settings?.notifications } }, loaded: true };
    } else {
      state = { ...seed(), loaded: true };
      persist();
    }
  } catch {
    state = { ...seed(), loaded: true };
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCrm(): CrmState {
  useEffect(() => {
    if (!state.loaded) {
      load();
      emit();
    }
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

/* ---------- derivados ---------- */
export function nextContactOf(s: CrmState, customerId: string) {
  return s.followUps
    .filter((f) => f.customerId === customerId && f.status === "pendente")
    .sort(sortFollow)[0];
}

export function staleCustomers(s: CrmState) {
  const t = todayISO();
  return s.customers.filter(
    (c) =>
      c.status !== "inativo" &&
      (!c.lastContact || daysBetween(c.lastContact, t) > s.settings.staleDays),
  );
}

/* ---------- ações ---------- */
export type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt" | "lastContact"> & {
  id?: string | undefined;
};

export const crm = {
  saveCustomer(input: CustomerInput, nextContact?: { date: string; time: string; title: string }) {
    const id = input.id ?? uid();
    set((s) => {
      const exists = s.customers.find((c) => c.id === id);
      const customers = exists
        ? s.customers.map((c) => (c.id === id ? { ...c, ...input, id, updatedAt: stamp() } : c))
        : [{ ...input, id, createdAt: stamp(), updatedAt: stamp() } as Customer, ...s.customers];
      let followUps = s.followUps;
      if (nextContact?.date) {
        followUps = [
          ...followUps,
          {
            id: uid(),
            customerId: id,
            date: nextContact.date,
            time: nextContact.time || "09:00",
            title: nextContact.title || "Entrar em contato",
            description: "",
            status: "pendente",
            reminder: true,
            createdAt: stamp(),
            updatedAt: stamp(),
          },
        ];
      }
      return { ...s, customers, followUps };
    });
    return id;
  },
  deleteCustomer(id: string) {
    set((s) => ({
      ...s,
      customers: s.customers.filter((c) => c.id !== id),
      interactions: s.interactions.filter((i) => i.customerId !== id),
      followUps: s.followUps.filter((f) => f.customerId !== id),
    }));
  },
  saveNotes(id: string, notes: string) {
    set((s) => ({
      ...s,
      customers: s.customers.map((c) => (c.id === id ? { ...c, notes, updatedAt: stamp() } : c)),
    }));
  },
  addInteraction(
    data: Omit<Interaction, "id" | "createdAt">,
    opts: { nextTime?: string; nextTitle?: string; reminder?: boolean; completeFollowUpId?: string | undefined },
  ) {
    set((s) => {
      const interaction: Interaction = { ...data, id: uid(), createdAt: stamp() };
      const customers = s.customers.map((c) =>
        c.id === data.customerId && (!c.lastContact || data.date >= c.lastContact)
          ? { ...c, lastContact: data.date, updatedAt: stamp() }
          : c,
      );
      let followUps = s.followUps.map((f) =>
        f.id === opts.completeFollowUpId ? { ...f, status: "concluido" as const, updatedAt: stamp() } : f,
      );
      if (data.nextFollowUp) {
        followUps = [
          ...followUps,
          {
            id: uid(),
            customerId: data.customerId,
            date: data.nextFollowUp,
            time: opts.nextTime || "09:00",
            title: opts.nextTitle || "Entrar em contato",
            description: "",
            status: "pendente",
            reminder: opts.reminder ?? true,
            createdAt: stamp(),
            updatedAt: stamp(),
          },
        ];
      }
      return { ...s, customers, followUps, interactions: [interaction, ...s.interactions] };
    });
  },
  saveFollowUp(input: Omit<FollowUp, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string | undefined; status?: FollowUpStatus }) {
    set((s) => {
      if (input.id && s.followUps.some((f) => f.id === input.id)) {
        return {
          ...s,
          followUps: s.followUps.map((f) =>
            f.id === input.id ? { ...f, ...input, id: f.id, status: input.status ?? "pendente", updatedAt: stamp() } : f,
          ),
        };
      }
      return {
        ...s,
        followUps: [
          ...s.followUps,
          { ...input, id: uid(), status: "pendente", createdAt: stamp(), updatedAt: stamp() },
        ],
      };
    });
  },
  setFollowUpStatus(id: string, status: FollowUpStatus) {
    set((s) => ({
      ...s,
      followUps: s.followUps.map((f) => (f.id === id ? { ...f, status, updatedAt: stamp() } : f)),
    }));
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  exportData() {
    const { loaded: _l, ...rest } = state;
    return JSON.stringify(rest, null, 2);
  },
  importData(json: string) {
    const data = JSON.parse(json);
    if (!Array.isArray(data.customers)) throw new Error("invalid");
    set(() => ({ ...EMPTY, ...data, settings: { ...EMPTY.settings, ...data.settings, notifications: { ...EMPTY.settings.notifications, ...data.settings?.notifications } }, loaded: true }));
  },
  resetDemo() {
    set(() => ({ ...seed(), loaded: true }));
  },
  clearAll() {
    set((s) => ({ ...EMPTY, settings: s.settings, loaded: true }));
  },
};

/* ---------- dialogs (UI) ---------- */
export type DialogState =
  | null
  | { kind: "customer"; customerId?: string }
  | { kind: "interaction"; customerId?: string; followUpId?: string }
  | { kind: "followup"; customerId?: string; followUpId?: string };

let dialog: DialogState = null;
const dlisteners = new Set<() => void>();
export const openDialog = (d: DialogState) => {
  dialog = d;
  dlisteners.forEach((l) => l());
};
export function useDialog() {
  return useSyncExternalStore(
    (l) => {
      dlisteners.add(l);
      return () => dlisteners.delete(l);
    },
    () => dialog,
    () => null,
  );
}

/* ---------- dados de exemplo ---------- */
function seed(): Omit<CrmState, "loaded"> {
  const t = todayISO();
  const mk = (
    name: string,
    company: string,
    phone: string,
    city: string,
    state: string,
    segment: string,
    status: CustomerStatus,
    last: number | null,
    notes: string,
    tags: string[],
  ): Customer => ({
    id: uid(),
    name,
    company,
    phone,
    whatsapp: phone,
    email: `${(name.split(" ")[0] ?? "cliente").toLowerCase()}@${(company.split(" ")[0] ?? "empresa").toLowerCase()}.com.br`,
    city,
    state,
    segment,
    status,
    firstContact: addDays(t, -180),
    lastContact: last === null ? undefined : addDays(t, -last),
    notes,
    tags,
    createdAt: stamp(),
    updatedAt: stamp(),
  });
  const c = [
    mk("Mariana Souza", "Padaria Pão Dourado", "(11) 98765-4321", "São Paulo", "SP", "Alimentação", "ativo", 3, "Prefere contato por WhatsApp pela manhã. Interessada na linha premium.", ["VIP"]),
    mk("Carlos Oliveira", "Mercado Bom Preço", "(19) 99812-3344", "Campinas", "SP", "Varejo", "negociacao", 6, "Negociando volume para o segundo semestre. Aniversário em 14/11.", ["Orçamento"]),
    mk("Fernanda Lima", "Clínica Bem Estar", "(21) 97654-1122", "Rio de Janeiro", "RJ", "Saúde", "ativo", 41, "Compra a cada 2 meses. Falar com ela, não com a recepção.", []),
    mk("Roberto Alves", "Construtora Alves", "(31) 98877-6655", "Belo Horizonte", "MG", "Construção", "negociacao", 12, "Pediu catálogo novo. Decide junto com o sócio.", ["Orçamento"]),
    mk("Juliana Castro", "Boutique Flor de Lis", "(41) 99123-4567", "Curitiba", "PR", "Moda", "ativo", 55, "Gosta de novidades. Melhor horário: tarde.", []),
    mk("Paulo Mendes", "Auto Peças Mendes", "(51) 98444-2211", "Porto Alegre", "RS", "Automotivo", "inativo", 120, "Parou de comprar após troca de fornecedor.", []),
    mk("Ana Beatriz Rocha", "Escola Aprender", "(11) 97333-8899", "Santo André", "SP", "Educação", "ativo", 1, "Pedido recorrente no início de cada mês.", ["VIP"]),
  ];
  const f = (ci: number, d: number, time: string, title: string, description = ""): FollowUp => ({
    id: uid(),
    customerId: c[ci]?.id ?? "",
    date: addDays(t, d),
    time,
    title,
    description,
    status: "pendente",
    reminder: true,
    createdAt: stamp(),
    updatedAt: stamp(),
  });
  const followUps = [
    f(1, -2, "10:00", "Retornar orçamento", "Enviar proposta revisada com desconto por volume."),
    f(3, 0, "14:30", "Apresentar novo produto", "Levar catálogo 2026."),
    f(0, 0, "09:30", "Confirmar pedido"),
    f(6, 2, "11:00", "Verificar interesse", "Material escolar do próximo semestre."),
    f(4, 5, "15:00", "Fazer visita"),
  ];
  const i = (ci: number, d: number, type: InteractionType, description: string, time = "10:00"): Interaction => ({
    id: uid(),
    customerId: c[ci]?.id ?? "",
    type,
    date: addDays(t, -d),
    time,
    description,
    createdAt: stamp(),
  });
  const interactions = [
    i(0, 3, "whatsapp", "Cliente demonstrou interesse na linha premium e pediu retorno.", "09:15"),
    i(1, 6, "ligacao", "Apresentado novo catálogo. Pediu orçamento para 200 unidades.", "16:00"),
    i(1, 20, "visita", "Primeira visita à loja. Conheceu o gerente de compras."),
    i(2, 41, "email", "Enviada tabela de preços atualizada."),
    i(3, 12, "reuniao", "Reunião com os sócios. Interesse alto, aguardando aprovação."),
    i(4, 55, "whatsapp", "Agradeceu a última entrega."),
    i(6, 1, "ligacao", "Confirmou pedido mensal.", "08:45"),
  ];
  return { customers: c, interactions, followUps, settings: EMPTY.settings };
}
