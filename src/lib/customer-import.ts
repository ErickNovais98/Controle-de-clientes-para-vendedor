import type { Customer } from './crm';

export type ImportCustomer = Pick<Customer, 'name' | 'company' | 'phone' | 'whatsapp' | 'email' | 'city' | 'state' | 'segment' | 'notes' | 'tags' | 'status' | 'firstContact'> & { code: string; buyerName: string };
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const aliases: Record<string, keyof ImportCustomer> = {
  codigo: 'code', 'codigo do cliente': 'code', cliente: 'name', nome: 'name', 'nome do cliente': 'name',
  empresa: 'company', telefone: 'phone', whatsapp: 'whatsapp', email: 'email', 'e-mail': 'email',
  cidade: 'city', uf: 'state', estado: 'state', comprador: 'buyerName', 'nome do comprador': 'buyerName',
  segmento: 'segment', observacoes: 'notes',
};
export function parseCustomerRows(rows: unknown[][]) {
  const header = rows.findIndex(row => row.some(cell => ['cliente', 'nome', 'nome do cliente'].includes(normalized(String(cell ?? '')))));
  if (header < 0) throw new Error('A planilha precisa de uma coluna Cliente ou Nome do cliente.');
  const fields = (rows[header] ?? []).map(cell => aliases[normalized(String(cell ?? ''))]);
  const customers: ImportCustomer[] = [];
  const invalid: number[] = [];
  rows.slice(header + 1).forEach((row, index) => {
    if (row.every(cell => !String(cell ?? '').trim())) return;
    const customer: ImportCustomer = { code: '', buyerName: '', name: '', company: '', phone: '', whatsapp: '', email: '', city: '', state: '', segment: '', notes: '', tags: [], status: 'ativo', firstContact: '' };
    fields.forEach((field, i) => {
      if (field && field !== 'tags' && field !== 'status') customer[field] = String(row[i] ?? '').trim();
    });
    customer.state = customer.state.toUpperCase();
    if (!customer.name) invalid.push(header + index + 2);
    else customers.push(customer);
  });
  return { customers, invalid };
}
export function planCustomerImport(incoming: ImportCustomer[], existing: Pick<Customer, 'name' | 'city' | 'state' | 'code'>[]) {
  const identity = (c: Pick<Customer, 'name' | 'city' | 'state' | 'code'>) => c.code?.trim()
    ? `code:${normalized(c.code)}`
    : `name:${normalized(c.name)}|${normalized(c.city)}|${normalized(c.state)}`;
  const seen = new Set(existing.map(identity));
  const additions: ImportCustomer[] = [];
  let duplicates = 0;
  for (const customer of incoming) {
    const key = identity(customer);
    if (seen.has(key)) duplicates++;
    else { seen.add(key); additions.push(customer); }
  }
  return { additions, duplicates };
}