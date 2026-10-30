import { describe, it, expect } from 'vitest';
import { ReceiptParser } from '@/lib/services/receipt-service';

describe('Receipt OCR Parser & Discrepancy Checker', () => {
  it('parses typical Indonesian store receipt correctly', () => {
    const rawOcr = `
      INDOMARET POINT
      JL. SUDIRMAN NO. 12 JAKARTA
      28/10/2026 14:30
      
      AIR MINERAL LE MINERALE 5.000
      ROTI TAWAR SARI ROTI 15.000
      CHITATO SAPI PANGGANG 11.500
      
      SUBTOTAL 31.500
      PPN 10% 3.150
      TOTAL 34.650
      CASH 50.000
    `;

    const result = ReceiptParser.parseReceiptText(rawOcr);

    expect(result.merchantName?.toLowerCase()).toContain('indomaret');
    expect(result.totalAmount).toBe(34650);
    expect(result.taxAmount).toBe(3150);
    expect(result.subtotal).toBe(31500);
    expect(result.lineItems.length).toBeGreaterThanOrEqual(3);
    expect(result.hasDiscrepancy).toBe(false);
  });

  it('detects calculation discrepancies when receipt total does not match items sum', () => {
    const rawOcrWithDiscrepancy = `
      KAFE KOPI NIKMAT
      25/10/2026
      
      KOPI LATTE 30.000
      CROISSANT 25.000
      
      TOTAL 80.000
    `;

    // Items sum to 55.000, but printed total is 80.000 -> mismatch!
    const result = ReceiptParser.parseReceiptText(rawOcrWithDiscrepancy);

    expect(result.totalAmount).toBe(80000);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyMessage).toBeDefined();
  });
});

