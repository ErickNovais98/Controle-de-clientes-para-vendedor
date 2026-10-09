import { describe, expect, it } from 'vitest';
import { parseCustomerRows, planCustomerImport } from '../lib/customer-import';
import { crm } from '../lib/crm';

const rows = [['Código', 'Cliente', 'Cidade', 'Uf'], ['10298', 'INSTITUTO FERNANDO FILGUEIRAS - IFF', 'TEIXEIRA DE FREITAS', 'BA'], ['624', 'INSTITUTO FERNANDO FILGUEIRAS - IFF', 'SALVADOR', 'BA']];
describe('customer spreadsheet import', () => {
  it('allows phone and buyer name to be filled later', () => {
    const c = parseCustomerRows(rows).customers[0];
    expect(c?.phone).toBe(''); expect(c?.buyerName).toBe(''); expect(c?.code).toBe('10298');
  });
  it('retains same-name customers with different codes', () => {
    expect(planCustomerImport(parseCustomerRows(rows).customers, []).additions).toHaveLength(2);
  });
  it('does not duplicate customer codes on repeated import', () => {
    const customers = parseCustomerRows(rows).customers;
    expect(planCustomerImport(customers, customers)).toEqual({ additions: [], duplicates: 2 });
  });
  it('preserves existing customers and interaction history', () => {
    const before = JSON.parse(crm.exportData());
    const result = crm.importCustomers(parseCustomerRows(rows).customers);
    const after = JSON.parse(crm.exportData());
    expect(result.added).toBe(2);
    expect(after.customers).toEqual(expect.arrayContaining(before.customers));
    expect(after.interactions).toEqual(before.interactions);
    expect(after.followUps).toEqual(before.followUps);
  });
  it('reads optional buyer and text phone columns', () => {
    const c = parseCustomerRows([['Cliente','Nome do comprador','Telefone'],['Loja','Maria','01199999999']]).customers[0];
    expect(c?.buyerName).toBe('Maria'); expect(c?.phone).toBe('01199999999');
  });
});