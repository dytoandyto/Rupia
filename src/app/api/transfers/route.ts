import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { LedgerService } from '@/lib/services/ledger-service';
import { serializeBigInt } from '@/lib/db';

const transferSchema = z.object({
  sourceWalletId: z.string().min(1, 'Pilih dompet asal'),
  destinationWalletId: z.string().min(1, 'Pilih dompet tujuan'),
  amount: z.number().positive('Jumlah transfer harus lebih dari 0'),
  fee: z.number().min(0).default(0),
  feeWalletId: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = transferSchema.parse(body);

    const transfer = await LedgerService.executeTransfer(session.userId, {
      sourceWalletId: validated.sourceWalletId,
      destinationWalletId: validated.destinationWalletId,
      amount: BigInt(validated.amount),
      fee: BigInt(validated.fee),
      feeWalletId: validated.feeWalletId,
      date: validated.date ? new Date(validated.date) : new Date(),
      notes: validated.notes,
    });

    return NextResponse.json({ transfer: serializeBigInt(transfer) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[API TRANSFER ERROR]', error);
    return NextResponse.json({ error: (error as Error).message || 'Gagal memproses transfer' }, { status: 500 });
  }
}

