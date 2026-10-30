import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ImportService } from '@/lib/services/import-service';

const importSchema = z.object({
  filename: z.string().min(1),
  csvContent: z.string().min(1),
  defaultWalletId: z.string().min(1, 'Pilih dompet tujuan untuk transaksi yang diimpor'),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { filename, csvContent, defaultWalletId } = importSchema.parse(body);

    const rows = ImportService.parseCsvContent(csvContent, defaultWalletId);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris transaksi valid ditemukan dalam CSV' }, { status: 400 });
    }

    const result = await ImportService.processImportBatch(session.userId, filename, rows);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[IMPORT API ERROR]', error);
    return NextResponse.json({ error: 'Gagal mengimpor file CSV' }, { status: 500 });
  }
}

