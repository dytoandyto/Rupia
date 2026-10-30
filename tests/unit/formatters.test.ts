import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  formatCompactRupiah,
  parseRupiahInput,
} from '@/lib/formatters';

describe('Indonesian Rupiah Formatters & Parser', () => {
  it('formats standard integer Rupiah amounts properly', () => {
    expect(formatRupiah(50000)).toMatch(/50\.000/);
    expect(formatRupiah(1500000n)).toMatch(/1\.500\.000/);
    expect(formatRupiah(0)).toMatch(/0/);
  });

  it('formats compact human-readable Rupiah amounts', () => {
    expect(formatCompactRupiah(25000)).toBe('Rp 25 rb');
    expect(formatCompactRupiah(1500000)).toBe('Rp 1,5 jt');
    expect(formatCompactRupiah(2500000000)).toBe('Rp 2,5 M');
    expect(formatCompactRupiah(-50000)).toBe('-Rp 50 rb');
  });

  it('parses user colloquial input strings to correct integers', () => {
    expect(parseRupiahInput('22rb')).toBe(22000);
    expect(parseRupiahInput('50k')).toBe(50000);
    expect(parseRupiahInput('1.5jt')).toBe(1500000);
    expect(parseRupiahInput('1,5jt')).toBe(1500000);
    expect(parseRupiahInput('Rp 75.000')).toBe(75000);
    expect(parseRupiahInput('35000')).toBe(35000);
    expect(parseRupiahInput('0')).toBe(0);
    expect(parseRupiahInput('')).toBe(0);
  });
});

