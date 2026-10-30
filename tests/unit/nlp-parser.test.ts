import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageTransaction } from '@/lib/nlp-parser';

describe('Natural Language Transaction Parser', () => {
  const wallets = [
    { id: 'w1', name: 'Mandiri' },
    { id: 'w2', name: 'GoPay' },
    { id: 'w3', name: 'Dompet Tunai' },
  ];
  const categories = [
    { id: 'c1', name: 'Makanan & Minuman' },
    { id: 'c2', name: 'Transportasi & Bensin' },
    { id: 'c3', name: 'Gaji Pokok' },
  ];

  it('correctly interprets "Kopi 22rb GoPay"', () => {
    const draft = parseNaturalLanguageTransaction('Kopi 22rb GoPay', wallets, categories);
    expect(draft.amount).toBe(22000);
    expect(draft.type).toBe('EXPENSE');
    expect(draft.walletName).toBe('GoPay');
    expect(draft.categoryName).toBe('Makanan & Minuman');
    expect(draft.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('correctly interprets "Beli bensin 50k mandiri"', () => {
    const draft = parseNaturalLanguageTransaction('Beli bensin 50k mandiri', wallets, categories);
    expect(draft.amount).toBe(50000);
    expect(draft.type).toBe('EXPENSE');
    expect(draft.walletName).toBe('Mandiri');
    expect(draft.categoryName).toBe('Transportasi & Bensin');
  });

  it('correctly identifies transfer syntax "Transfer 150rb dari Mandiri ke GoPay"', () => {
    const draft = parseNaturalLanguageTransaction('Transfer 150rb dari Mandiri ke GoPay', wallets, categories);
    expect(draft.amount).toBe(150000);
    expect(draft.type).toBe('TRANSFER');
    expect(draft.walletName).toBe('Mandiri');
    expect(draft.destinationWalletName).toBe('GoPay');
  });

  it('correctly identifies income "Gaji freelance 4.5jt ke Mandiri"', () => {
    const draft = parseNaturalLanguageTransaction('Gaji freelance 4.5jt ke Mandiri', wallets, categories);
    expect(draft.amount).toBe(4500000);
    expect(draft.type).toBe('INCOME');
    expect(draft.walletName).toBe('Mandiri');
  });
});

