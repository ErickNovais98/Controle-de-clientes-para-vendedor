import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Upload, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Empty, PageHeader } from "@/components/crm/bits";
import { crm, todayISO, useCrm } from "@/lib/crm";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Minha Carteira" },
      { name: "description", content: "Ajuste preferências e faça cópias de segurança dos seus dados." },
      { property: "og:title", content: "Configurações — Minha Carteira" },
      { property: "og:description", content: "Preferências do seu CRM pessoal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Config,
});

function Config() {
  const s = useCrm();
  const [name, setName] = useState("");
  const [days, setDays] = useState(30);
  const [tags, setTags] = useState("");
  const [notifications, setNotifications] = useState(s.settings.notifications);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setName(s.settings.sellerName);
    setDays(s.settings.staleDays);
    setTags(s.settings.tags.join(", "));
    setNotifications(s.settings.notifications);
  }, [s.settings.sellerName, s.settings.staleDays, s.settings.tags, s.settings.notifications]);

  const exportFile = () => {
    const blob = new Blob([crm.exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `minha-carteira-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!s.loaded) return <Empty text="Carregando configurações..." />;

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid max-w-2xl gap-6">
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Preferências</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Seu nome</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Dias para "sem contato recente"</span>
              <input className="field" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Etiquetas disponíveis (separadas por vírgula)</span>
            <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Prioridade, Produto X" />
          </label>
          <div className="mt-5 border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Avisos no painel</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["today", "Contatos para hoje"], ["overdue", "Retornos atrasados"],
                ["upcoming", "Próximos contatos"], ["stale", "Clientes sem contato recente"],
              ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={notifications[key]} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} />{label}
              </label>)}
            </div>
          </div>
          <Button
            className="mt-4"
            disabled={!s.loaded}
            onClick={() => {
              crm.updateSettings({ sellerName: name.trim(), staleDays: Math.max(1, days || 30), tags: [...new Set(tags.split(",").map((t) => t.trim()).filter(Boolean))], notifications });
              toast.success("Configurações salvas.");
            }}
          >
            Salvar
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-bold">Cópia de segurança</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Seus dados ficam salvos neste navegador e funcionam sem internet. Exporte com frequência para não perder nada.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!s.loaded} onClick={exportFile}><Download /> Exportar dados</Button>
            <Button variant="outline" disabled={!s.loaded} onClick={() => file.current?.click()}><Upload /> Importar dados</Button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  crm.importData(await f.text());
                  toast.success("Dados importados com sucesso.");
                } catch {
                  toast.error("Arquivo inválido.");
                }
                e.target.value = "";
              }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-bold">Dados</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!s.loaded} onClick={() => { crm.resetDemo(); toast.success("Dados de exemplo restaurados."); }}>
              <RotateCcw /> Restaurar exemplos
            </Button>
            <Button
              variant="outline"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              disabled={!s.loaded}
              onClick={() => {
                if (confirm("Apagar todos os clientes, atendimentos e agendamentos?")) {
                  crm.clearAll();
                  toast.success("Todos os dados foram apagados.");
                }
              }}
            >
              <Trash2 /> Começar do zero
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
