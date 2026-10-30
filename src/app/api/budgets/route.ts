import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { BudgetService } from '@/lib/services/budget-service';

const budgetSchema = z.object({
  budgetId: z.string().optional(),
  name: z.string().min(1, 'Nama anggaran wajib diisi'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'CUSTOM']),
  startDate: z.string(),
  endDate: z.string(),
  totalLimit: z.number().positive('Batas anggaran harus lebih dari 0'),
  allocations: z.array(
    z.object({
      categoryId: z.string().min(1),
      allocatedAmount: z.number().positive(),
      allocatedPercentage: z.number().optional(),
    })
  ),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const status = await BudgetService.getActiveBudgetStatus(session.userId);
    return NextResponse.json({ budget: status });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = budgetSchema.parse(body);

    const budgetId = await BudgetService.upsertBudget(session.userId, {
      budgetId: validated.budgetId,
      name: validated.name,
      period: validated.period,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      totalLimit: BigInt(validated.totalLimit),
      allocations: validated.allocations.map((a) => ({
        categoryId: a.categoryId,
        allocatedAmount: BigInt(a.allocatedAmount),
        allocatedPercentage: a.allocatedPercentage,
      })),
    });

    return NextResponse.json({ success: true, budgetId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan anggaran' }, { status: 500 });
  }
}

