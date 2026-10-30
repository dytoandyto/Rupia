import { describe, it, expect } from 'vitest';
import { ImportService } from '@/lib/services/import-service';

describe('CSV Transaction Import & Deduplication Service', () => {
  it('generates consistent deterministic hashes for identical transaction rows', () => {
    const rowA = {
      date: '2026-10-25',
      description: 'Makan Siang Resto Padang',
      amount: 45000,
      type: 'EXPENSE' as const,
      walletId: 'w1',
    };

    const rowB = {
      date: '2026-10-25',
      description: '  makan siang resto padang  ',
      amount: 45000,
      type: 'EXPENSE' as const,
      walletId: 'w1',
    };

    const hashA = ImportService.generateRowHash('u1', rowA);
    const hashB = ImportService.generateRowHash('u1', rowB);

    expect(hashA).toBe(hashB);
  });

  it('parses semicolon and comma delimited CSV strings', () => {
    const csvComma = `Tanggal,Deskripsi,Nominal,Tipe\n2026-10-20,Beli Bensin,50.000,EXPENSE\n2026-10-21,Gaji Masuk,5.000.000,INCOME`;
    const rows = ImportService.parseCsvContent(csvComma, 'w1');

    expect(rows.length).toBe(2);
    expect(rows[0].amount).toBe(50000);
    expect(rows[0].type).toBe('EXPENSE');
    expect(rows[1].amount).toBe(5000000);
    expect(rows[1].type).toBe('INCOME');
  });
});

