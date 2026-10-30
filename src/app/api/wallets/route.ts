import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import prisma, { serializeBigInt } from '@/lib/db';
import { LedgerService } from '@/lib/services/ledger-service';

const walletSchema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi'),
  type: z.enum(['BANK', 'EWALLET', 'EMONEY', 'CASH', 'SAVINGS', 'INVESTMENT', 'OTHER']),
  issuer: z.string().optional(),
  cardLast4: z.string().optional(),
  accountNo: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  openingBalance: z.number().min(0, 'Saldo awal tidak boleh negatif'),
  lastBalanceSource: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where: any = { userId: session.userId, isArchived: false };
    if (type) {
      where.type = type;
    }

    const wallets = await prisma.wallet.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ wallets: serializeBigInt(wallets) });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = walletSchema.parse(body);

    const wallet = await LedgerService.createWallet(session.userId, {
      ...validated,
      openingBalance: BigInt(validated.openingBalance),
    });

    return NextResponse.json({ wallet: serializeBigInt(wallet) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat dompet' }, { status: 500 });
  }
}
