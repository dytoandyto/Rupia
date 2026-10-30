import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { LedgerService } from '@/lib/services/ledger-service';
import { serializeBigInt } from '@/lib/db';

const reconcileSchema = z.object({
  actualBalance: z.number().min(0, 'Saldo aktual tidak boleh negatif'),
  createAdjustment: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { actualBalance, createAdjustment } = reconcileSchema.parse(body);

    const result = await LedgerService.reconcileWallet(
      session.userId,
      params.id,
      BigInt(actualBalance),
      createAdjustment
    );

    return NextResponse.json({
      success: true,
      result: serializeBigInt({
        wallet: result.wallet,
        discrepancy: result.discrepancy,
        isMatched: result.isMatched,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[WALLET RECONCILE ERROR]', error);
    return NextResponse.json({ error: 'Gagal merekonsiliasi dompet' }, { status: 500 });
  }
}

