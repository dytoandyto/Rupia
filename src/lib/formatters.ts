/**
 * Rupia V2 - Indonesian Formatting and Parsing Utilities
 * Implements strict Asia/Jakarta timezone and Indonesian currency conventions.
 */

export function formatRupiah(amount: number | bigint, isHidden: boolean = false): string {
  if (isHidden) return 'Rp ••••••';
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactRupiah(amount: number | bigint): string {
  const num = Math.abs(typeof amount === 'bigint' ? Number(amount) : amount);
  const sign = (typeof amount === 'bigint' ? Number(amount) : amount) < 0 ? '-' : '';

  if (num >= 1_000_000_000_000) {
    return `${sign}Rp ${(num / 1_000_000_000_000).toFixed(1).replace('.', ',')} T`;
  }
  if (num >= 1_000_000_000) {
    return `${sign}Rp ${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (num >= 1_000_000) {
    return `${sign}Rp ${(num / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (num >= 1_000) {
    return `${sign}Rp ${(num / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${num}`;
}

export function formatDateIndo(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatShortDateIndo(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTimeIndo(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatRelativeDateIndo(date: Date | string | number): string {
  const target = new Date(date);
  const now = new Date();

  // Reset hours to compare calendar days
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((nowDay.getTime() - targetDay.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays === -1) return 'Besok';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lalu`;

  return formatShortDateIndo(target);
}

/**
 * Parses user input strings into a clean numeric IDR integer.
 * Handles:
 * "Rp 25.000" -> 25000
 * "25000" -> 25000
 * "25k" / "25rb" -> 25000
 * "1.5jt" / "1,5jt" -> 1500000
 * "2,5M" / "2.5M" -> 2500000000
 */
export function parseRupiahInput(input: string): number {
  if (!input) return 0;
  const clean = input.trim().toLowerCase().replace(/^rp\s*/i, '');

  if (clean.includes('jt')) {
    const val = parseFloat(clean.replace('jt', '').replace(',', '.').trim());
    return Math.round((isNaN(val) ? 0 : val) * 1_000_000);
  }
  if (clean.includes('rb') || clean.endsWith('k')) {
    const val = parseFloat(clean.replace('rb', '').replace('k', '').replace(',', '.').trim());
    return Math.round((isNaN(val) ? 0 : val) * 1_000);
  }
  if (clean.includes('m') && !clean.includes('mandiri')) {
    const val = parseFloat(clean.replace('m', '').replace(',', '.').trim());
    return Math.round((isNaN(val) ? 0 : val) * 1_000_000_000);
  }

  // Remove dots and commas used as thousand separators
  const digits = clean.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

