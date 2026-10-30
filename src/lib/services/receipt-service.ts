import prisma from '../db';
import { parseRupiahInput } from '../formatters';

export interface ParsedReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  confidence: number;
}

export interface ParsedReceiptResult {
  merchantName?: string;
  transactionDate?: Date;
  lineItems: ParsedReceiptLineItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  confidence: number;
  rawText: string;
  hasDiscrepancy: boolean;
  discrepancyMessage?: string;
}

export class ReceiptParser {
  /**
   * Parses raw OCR string from an Indonesian receipt into structured financial data.
   */
  static parseReceiptText(rawText: string): ParsedReceiptResult {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let merchantName: string | undefined;
    let transactionDate: Date | undefined;
    let totalAmount = 0;
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let paymentMethod: string | undefined;
    const lineItems: ParsedReceiptLineItem[] = [];

    // 1. Detect Merchant Name (Usually within first 4 lines)
    const knownMerchants = [
      'indomaret', 'alfamart', 'superindo', 'starbucks', 'kopi kenangan',
      'janji jiwa', 'mcdonalds', 'kfc', 'hokben', 'solaria', 'hypermart',
      'guardian', 'watsons', 'apotek k-24', 'kimia farma', 'pertamina spbu'
    ];

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const lineLower = lines[i].toLowerCase();
      const matched = knownMerchants.find((m) => lineLower.includes(m));
      if (matched) {
        merchantName = lines[i].replace(/[^\w\s-]/g, '').trim();
        break;
      }
    }
    if (!merchantName && lines.length > 0) {
      merchantName = lines[0].replace(/[^\w\s-]/g, '').trim();
    }

    // 2. Detect Date (DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)
    const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})|(\d{4})[/-](\d{1,2})[/-](\d{1,2})/;
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        try {
          if (match[1]) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            let year = parseInt(match[3], 10);
            if (year < 100) year += 2000;
            transactionDate = new Date(year, month, day);
          } else {
            transactionDate = new Date(parseInt(match[4], 10), parseInt(match[5], 10) - 1, parseInt(match[6], 10));
          }
          break;
        } catch {
          // ignore
        }
      }
    }

    // 3. Detect Amounts & Line Items
    for (const line of lines) {
      const lower = line.toLowerCase();

      // Check Total / Grand Total / Tagihan
      if (
        (lower.includes('total') && !lower.includes('subtotal') && !lower.includes('item')) ||
        lower.includes('grand total') ||
        lower.includes('jumlah bayar')
      ) {
        const amt = parseRupiahInput(line);
        if (amt > totalAmount) totalAmount = amt;
        continue;
      }

      // Check Subtotal
      if (lower.includes('subtotal') || lower.includes('sub total')) {
        subtotal = parseRupiahInput(line);
        continue;
      }

      // Check Tax (PB1 / PPN / PJK)
      if (lower.includes('ppn') || lower.includes('pb1') || lower.includes('pajak') || lower.includes('tax')) {
        // Strip out percentage notations like "10%" or "11%" before parsing the amount
        const cleanTaxLine = line.replace(/\d+%/g, '');
        taxAmount = parseRupiahInput(cleanTaxLine);
        continue;
      }

      // Check Discount / Potongan / Hemat
      if (lower.includes('diskon') || lower.includes('potongan') || lower.includes('hemat') || lower.includes('disc')) {
        const cleanDiscLine = line.replace(/\d+%/g, '');
        discountAmount = parseRupiahInput(cleanDiscLine);
        continue;
      }

      // Check Payment Method & Tender lines (Cash, Tunai, Kembalian, Change, Bayar)
      if (lower.includes('qris')) { paymentMethod = 'QRIS'; continue; }
      if (lower.includes('gopay')) { paymentMethod = 'GoPay'; continue; }
      if (lower.includes('mandiri')) { paymentMethod = 'Mandiri'; continue; }
      if (lower.includes('bca')) { paymentMethod = 'BCA'; continue; }
      if (lower.includes('cash') || lower.includes('tunai') || lower.includes('kembali') || lower.includes('change') || lower.includes('bayar')) {
        paymentMethod = 'Tunai';
        continue;
      }

      // Parse candidate line item: text followed by a numeric amount
      const itemMatch = line.match(/^(.+?)\s+([0-9.,]+)$/);
      if (itemMatch) {
        const itemName = itemMatch[1].trim();
        const itemPrice = parseRupiahInput(itemMatch[2]);

        // Filter out non-item lines
        if (
          itemPrice > 0 &&
          itemName.length > 2 &&
          !lower.includes('total') &&
          !lower.includes('kembali') &&
          !lower.includes('tunai') &&
          !lower.includes('kartu') &&
          !lower.includes('kasir')
        ) {
          lineItems.push({
            name: itemName,
            quantity: 1,
            unitPrice: itemPrice,
            totalPrice: itemPrice,
            confidence: 0.85,
          });
        }
      }
    }

    // 4. Validate Calculations & Discrepancies
    const calculatedItemsSum = lineItems.reduce((acc, it) => acc + it.totalPrice, 0);

    // If totalAmount was not found explicitly, use calculated items sum
    if (totalAmount === 0 && calculatedItemsSum > 0) {
      totalAmount = calculatedItemsSum + taxAmount - discountAmount;
    }

    let hasDiscrepancy = false;
    let discrepancyMessage: string | undefined;

    if (lineItems.length > 0 && totalAmount > 0) {
      const expectedTotal = calculatedItemsSum + taxAmount - discountAmount;
      if (Math.abs(expectedTotal - totalAmount) > 500) {
        hasDiscrepancy = true;
        discrepancyMessage = `Total nota (Rp ${totalAmount.toLocaleString('id-ID')}) tidak sesuai dengan rincian item (Rp ${expectedTotal.toLocaleString('id-ID')}). Mohon periksa kembali.`;
      }
    }

    const confidence = totalAmount > 0 ? (lineItems.length > 0 ? 0.9 : 0.7) : 0.4;

    return {
      merchantName: merchantName || 'Merchant Tanpa Nama',
      transactionDate: transactionDate || new Date(),
      lineItems,
      subtotal: subtotal || calculatedItemsSum,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      confidence,
      rawText,
      hasDiscrepancy,
      discrepancyMessage,
    };
  }

  /**
   * Persists a verified receipt with its line items into database.
   */
  static async saveReceipt(
    userId: string,
    data: {
      imageUrl: string;
      rawText?: string;
      parsed: ParsedReceiptResult;
      transactionId?: string;
    }
  ) {
    return prisma.receipt.create({
      data: {
        userId,
        imageUrl: data.imageUrl,
        ocrRawText: data.rawText,
        ocrParsedJson: JSON.stringify(data.parsed),
        merchantName: data.parsed.merchantName,
        totalAmount: BigInt(data.parsed.totalAmount),
        taxAmount: BigInt(data.parsed.taxAmount || 0),
        discountAmount: BigInt(data.parsed.discountAmount || 0),
        transactionDate: data.parsed.transactionDate,
        confidence: data.parsed.confidence,
        status: data.parsed.hasDiscrepancy ? 'REVIEWED' : 'PROCESSED',
        ...(data.transactionId ? { transaction: { connect: { id: data.transactionId } } } : {}),
        lineItems: {
          create: data.parsed.lineItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: BigInt(item.unitPrice),
            totalPrice: BigInt(item.totalPrice),
            confidence: item.confidence,
          })),
        },
      },
      include: { lineItems: true },
    });
  }
}

