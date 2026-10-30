import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { LedgerService } from '@/lib/services/ledger-service';
import { serializeBigInt } from '@/lib/db';

const voidSchema = z.object({
  reason: z.string().min(1, 'Alasan pembatalan wajib diisi'),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { reason } = voidSchema.parse(body);

    const transaction = await LedgerService.voidTransaction(session.userId, params.id, reason);

    return NextResponse.json({ success: true, transaction: serializeBigInt(transaction) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message || 'Gagal membatalkan transaksi' }, { status: 500 });
  }
}

