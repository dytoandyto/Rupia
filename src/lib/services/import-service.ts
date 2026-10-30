import crypto from 'node:crypto';
import prisma from '../db';
import { LedgerService } from './ledger-service';
import { parseRupiahInput } from '../formatters';

export interface ImportTransactionRow {
  date: string;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  walletId: string;
  categoryId?: string;
  notes?: string;
}

export class ImportService {
  /**
   * Generates a deterministic hash for an imported row to detect duplicates.
   */
  static generateRowHash(userId: string, row: ImportTransactionRow): string {
    const raw = `${userId}|${row.walletId}|${row.date}|${row.amount}|${row.type}|${row.description.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Parses CSV string into structured transaction rows.
   * Handles Indonesian CSVs (comma or semicolon separated, DD/MM/YYYY date formats).
   */
  static parseCsvContent(csvContent: string, defaultWalletId: string): ImportTransactionRow[] {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const rows: ImportTransactionRow[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length < 3) continue;

      // Common columns: Date, Description, Amount (or Type)
      const dateStr = parts[0];
      const desc = parts[1];
      const amtRaw = parts[2];
      const typeRaw = parts[3]?.toUpperCase();

      const amount = parseRupiahInput(amtRaw);
      if (amount <= 0) continue;

      const type: 'EXPENSE' | 'INCOME' =
        typeRaw === 'INCOME' || typeRaw === 'CR' || typeRaw === 'KREDIT' || typeRaw === 'PEMASUKAN'
          ? 'INCOME'
          : 'EXPENSE';

      rows.push({
        date: dateStr,
        description: desc || 'Impor Transaksi CSV',
        amount,
        type,
        walletId: defaultWalletId,
      });
    }

    return rows;
  }

  /**
   * Processes a batch of imported transactions, skipping duplicates.
   */
  static async processImportBatch(
    userId: string,
    filename: string,
    rows: ImportTransactionRow[]
  ) {
    const fileHash = crypto.createHash('sha256').update(`${filename}_${Date.now()}`).digest('hex');

    const batch = await prisma.importBatch.create({
      data: {
        userId,
        filename,
        totalRecords: rows.length,
        fileHash,
      },
    });

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      const rowHash = this.generateRowHash(userId, row);

      // Check if this hash was imported before or identical transaction exists
      const existingRef = await prisma.importedTransactionReference.findFirst({
        where: { externalHash: rowHash },
      });

      if (existingRef) {
        duplicateCount++;
        await prisma.importedTransactionReference.create({
          data: {
            batchId: batch.id,
            externalHash: rowHash,
            rawData: JSON.stringify(row),
            status: 'DUPLICATE',
          },
        });
        continue;
      }

      try {
        // Record transaction via ledger service
        const tx = await LedgerService.recordTransaction(userId, {
          walletId: row.walletId,
          categoryId: row.categoryId,
          type: row.type,
          amount: BigInt(row.amount),
          date: new Date(row.date),
          description: row.description,
          notes: `Diimpor dari file: ${filename}`,
          idempotencyKey: rowHash,
        });

        await prisma.importedTransactionReference.create({
          data: {
            batchId: batch.id,
            externalHash: rowHash,
            rawData: JSON.stringify(row),
            status: 'SUCCESS',
            transactionId: tx.id,
          },
        });

        importedCount++;
      } catch (err) {
        console.error('[RUPIA IMPORT] Error importing row:', err);
        failedCount++;
        await prisma.importedTransactionReference.create({
          data: {
            batchId: batch.id,
            externalHash: rowHash,
            rawData: JSON.stringify(row),
            status: 'FAILED',
          },
        });
      }
    }

    // Update batch stats
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        importedRecords: importedCount,
        duplicateRecords: duplicateCount,
        failedRecords: failedCount,
      },
    });

    return {
      batchId: batch.id,
      total: rows.length,
      imported: importedCount,
      duplicates: duplicateCount,
      failed: failedCount,
    };
  }
}

