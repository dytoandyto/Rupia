import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import prisma, { serializeBigInt } from '@/lib/db';
import { LedgerService } from '@/lib/services/ledger-service';
import { parseNaturalLanguageTransaction } from '@/lib/nlp-parser';

const transactionSchema = z.object({
  walletId: z.string().min(1, 'Pilih dompet'),
  categoryId: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  date: z.string().optional(),
  description: z.string().min(1, 'Keterangan transaksi wajib diisi'),
  merchant: z.string().optional(),
  notes: z.string().optional(),
  isEssential: z.boolean().optional(),
  source: z.string().optional(),
  receiptId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const walletId = searchParams.get('walletId');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');
    const source = searchParams.get('source');
    const isEssential = searchParams.get('isEssential');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {
      userId: session.userId,
      isVoided: false,
    };

    if (walletId) where.walletId = walletId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (source) where.source = source;
    if (isEssential !== null && isEssential !== undefined) {
      where.isEssential = isEssential === 'true';
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { merchant: { contains: search } },
      ];
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          wallet: true,
          category: true,
          receipt: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      transactions: serializeBigInt(transactions),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Check if user submitted natural-language text to parse first
    if (body.naturalText && typeof body.naturalText === 'string') {
      const wallets = await prisma.wallet.findMany({
        where: { userId: session.userId, isArchived: false },
        select: { id: true, name: true },
      });
      const categories = await prisma.category.findMany({
        where: { OR: [{ userId: session.userId }, { isDefault: true }] },
        select: { id: true, name: true },
      });

      const parsed = parseNaturalLanguageTransaction(body.naturalText, wallets, categories);
      return NextResponse.json({ parsed });
    }

    const validated = transactionSchema.parse(body);

    const transaction = await LedgerService.recordTransaction(session.userId, {
      ...validated,
      amount: BigInt(validated.amount),
      date: validated.date ? new Date(validated.date) : new Date(),
    });

    return NextResponse.json({ transaction: serializeBigInt(transaction) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[API TRANSACTION POST ERROR]', error);
    return NextResponse.json({ error: 'Gagal mencatat transaksi' }, { status: 500 });
  }
}
