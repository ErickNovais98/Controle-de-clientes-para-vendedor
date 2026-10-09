import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { crm, useCrm } from '@/lib/crm';
import { parseCustomerRows, planCustomerImport, type ImportCustomer } from '@/lib/customer-import';

export function CustomerImport() {
  const s = useCrm();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filename, setFilename] = useState('');
  const [customers, setCustomers] = useState<ImportCustomer[]>([]);
  const [invalid, setInvalid] = useState<number[]>([]);
  const plan = planCustomerImport(customers, s.customers);
  async function readFile(file: File) {
    setOpen(true); setBusy(true); setError(''); setCustomers([]); setInvalid([]); setFilename(file.name);
    try {
      const XLSX = await import('xlsx');
      const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = book.Sheets[book.SheetNames[0] ?? ''];
      if (!sheet) throw new Error('A planilha está vazia.');
      const result = parseCustomerRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false }));
      setCustomers(result.customers); setInvalid(result.invalid);
      if (!result.customers.length) setError('Nenhum cliente válido encontrado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível ler a planilha.'); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="outline" disabled={!s.loaded || busy} onClick={() => input.current?.click()}><Upload />Importar clientes</Button>
    <input ref={input} className="hidden" aria-label="Planilha de clientes" type="file" accept=".xls,.xlsx,.csv" onChange={e => {
      const file = e.target.files?.[0]; if (file) void readFile(file); e.target.value = '';
    }} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Importar clientes</DialogTitle><DialogDescription className="break-all">{filename}</DialogDescription></DialogHeader>
        {busy ? <p role="status">Lendo planilha…</p> : error ? <p role="alert" className="text-danger">{error}</p> : <>
          <div className="flex flex-wrap items-center gap-3 text-sm"><FileSpreadsheet className="size-5 text-primary" /><b>{plan.additions.length} novos clientes</b><span className="text-muted-foreground">{plan.duplicates} duplicados ignorados</span></div>
          {invalid.length > 0 && <p role="alert" className="text-sm text-danger">Linhas sem nome ignoradas: {invalid.join(', ')}.</p>}
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-muted text-muted-foreground"><tr>{['Código', 'Cliente', 'Cidade', 'UF', 'Comprador', 'Telefone'].map(label => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead>
              <tbody className="divide-y">{plan.additions.map((c, i) => <tr key={i}>{[c.code, c.name, c.city, c.state, c.buyerName, c.phone].map((value, j) => <td key={j} className="min-w-20 px-3 py-2">{value || '—'}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">Seus registros atuais serão mantidos. Telefone e comprador podem ser preenchidos depois.</p>
        </>}
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={busy || Boolean(error) || !plan.additions.length} onClick={() => {
          const result = crm.importCustomers(customers); toast.success(`${result.added} clientes importados.`); setOpen(false);
        }}><Upload />Confirmar importação</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}