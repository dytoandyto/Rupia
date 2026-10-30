import { parseRupiahInput } from './formatters';

export interface ParsedTransactionDraft {
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  walletName?: string;
  destinationWalletName?: string;
  categoryName?: string;
  description: string;
  confidence: number;
  rawText: string;
}

export function parseNaturalLanguageTransaction(
  input: string,
  availableWallets: { name: string; id: string }[] = [],
  availableCategories: { name: string; id: string }[] = []
): ParsedTransactionDraft {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Detect Transaction Type
  let type: 'EXPENSE' | 'INCOME' | 'TRANSFER' = 'EXPENSE';
  if (lower.startsWith('transfer') || lower.includes(' tf ') || lower.includes('pindah dana')) {
    type = 'TRANSFER';
  } else if (
    lower.includes('gaji') ||
    lower.includes('pemasukan') ||
    lower.includes('dapat uang') ||
    lower.includes('cair') ||
    lower.includes('terima ') ||
    lower.includes('income')
  ) {
    type = 'INCOME';
  }

  // 2. Extract Amount
  // Matches: 22rb, 22.000, 22k, 1,5jt, Rp 50.000, 50000, etc.
  const amountRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:rb|ribu|k|jt|juta|m|miliar)?|\d{1,3}(?:\.\d{3})+)/i;
  const amountMatch = text.match(amountRegex);

  let amount = 0;
  if (amountMatch) {
    amount = parseRupiahInput(amountMatch[0]);
  }

  // 3. Match Wallets
  let walletName: string | undefined;
  let destinationWalletName: string | undefined;

  // Known wallet heuristics
  const walletKeywords = [
    { name: 'Mandiri', regex: /\b(mandiri|livin)\b/i },
    { name: 'GoPay', regex: /\b(gopay|go-pay)\b/i },
    { name: 'Dompet Tunai', regex: /\b(tunai|cash|dompet)\b/i },
    { name: 'BCA', regex: /\b(bca|blu)\b/i },
    { name: 'BRI', regex: /\b(bri|brimo)\b/i },
    { name: 'BNI', regex: /\b(bni)\b/i },
    { name: 'OVO', regex: /\b(ovo)\b/i },
    { name: 'ShopeePay', regex: /\b(shopeepay|spay)\b/i },
    { name: 'Dana', regex: /\b(dana)\b/i },
  ];

  if (type === 'TRANSFER') {
    // Check "dari X ke Y"
    const transferMatch = lower.match(/dari\s+([a-z0-9\s]+?)\s+ke\s+([a-z0-9\s]+)/i);
    if (transferMatch) {
      const srcQuery = transferMatch[1].trim();
      const dstQuery = transferMatch[2].trim();

      const matchedSrc = availableWallets.find((w) => w.name.toLowerCase().includes(srcQuery)) ||
        walletKeywords.find((kw) => kw.regex.test(srcQuery));
      const matchedDst = availableWallets.find((w) => w.name.toLowerCase().includes(dstQuery)) ||
        walletKeywords.find((kw) => kw.regex.test(dstQuery));

      if (matchedSrc) walletName = 'name' in matchedSrc ? matchedSrc.name : undefined;
      if (matchedDst) destinationWalletName = 'name' in matchedDst ? matchedDst.name : undefined;
    }
  }

  if (!walletName) {
    // Try matching available wallets from user first
    for (const w of availableWallets) {
      if (new RegExp(`\\b${w.name}\\b`, 'i').test(text)) {
        walletName = w.name;
        break;
      }
    }
    // Then predefined keywords
    if (!walletName) {
      for (const kw of walletKeywords) {
        if (kw.regex.test(text)) {
          walletName = kw.name;
          break;
        }
      }
    }
  }

  // 4. Match Categories
  let categoryName: string | undefined;
  const categoryKeywords = [
    { name: 'Makanan & Minuman', regex: /\b(kopi|makan|resto|warteg|padang|kafe|cafe|snack|sarapan|lunch|dinner|mie|bakso|ayam)\b/i },
    { name: 'Transportasi & Bensin', regex: /\b(bensin|pertalite|pertamax|spbu|grab|gojek|ojol|tol|parkir|mrt|busway|kereta|krl)\b/i },
    { name: 'Belanja & Supermarket', regex: /\b(indomaret|alfamart|superindo|belanja|shopee|tokopedia|pasar|sabun|shampoo)\b/i },
    { name: 'Tagihan & Utilitas', regex: /\b(listrik|pln|pdam|air|wifi|indihome|pulsa|paket data|iuran|bpjs|kontrakan|kos)\b/i },
    { name: 'Hiburan & Kopi', regex: /\b(bioskop|nonton|netflix|spotify|game|steam|karaoke)\b/i },
    { name: 'Kesehatan', regex: /\b(obat|apotek|dokter|klinik|vitamin|rs|sakit)\b/i },
    { name: 'Gaji Pokok', regex: /\b(gaji|payroll|salary|upah)\b/i },
    { name: 'Freelance & Bisnis', regex: /\b(proyek|klien|omset|penjualan|freelance)\b/i },
  ];

  for (const cat of availableCategories) {
    if (new RegExp(`\\b${cat.name}\\b`, 'i').test(text)) {
      categoryName = cat.name;
      break;
    }
  }

  if (!categoryName) {
    for (const kw of categoryKeywords) {
      if (kw.regex.test(text)) {
        categoryName = kw.name;
        break;
      }
    }
  }

  // 5. Clean Description
  let cleanDesc = text;
  if (amountMatch) {
    cleanDesc = cleanDesc.replace(amountMatch[0], '');
  }
  if (walletName) {
    cleanDesc = cleanDesc.replace(new RegExp(`\\b${walletName}\\b`, 'gi'), '');
  }
  if (destinationWalletName) {
    cleanDesc = cleanDesc.replace(new RegExp(`\\b${destinationWalletName}\\b`, 'gi'), '');
  }
  cleanDesc = cleanDesc
    .replace(/\b(dari|ke|pakai|menggunakan|via|bayar|beli|di|untuk)\b/gi, '')
    .replace(/[^\w\s\u00C0-\u024F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const description = cleanDesc.length > 0
    ? cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1)
    : (categoryName || 'Transaksi Baru');

  // Confidence Calculation
  let confidence = 0.4;
  if (amount > 0) confidence += 0.3;
  if (walletName) confidence += 0.15;
  if (categoryName) confidence += 0.15;

  return {
    amount,
    type,
    walletName,
    destinationWalletName,
    categoryName,
    description,
    confidence: Math.min(1.0, confidence),
    rawText: text,
  };
}

