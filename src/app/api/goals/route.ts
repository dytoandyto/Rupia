import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { GoalService } from '@/lib/services/goal-service';
import prisma from '@/lib/db';

const createGoalSchema = z.object({
  name: z.string().min(1, 'Nama tujuan finansial wajib diisi'),
  targetAmount: z.number().positive('Target dana harus lebih dari 0'),
  deadline: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  category: z.string().optional(),
});

const contributeSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().positive('Jumlah kontribusi harus lebih dari 0'),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const goals = await GoalService.getGoalsWithCalculations(session.userId);
    return NextResponse.json({ goals });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Check if this is a contribution
    if (body.action === 'CONTRIBUTE') {
      const { goalId, amount, notes } = contributeSchema.parse(body);
      const updated = await GoalService.contributeToGoal(session.userId, goalId, BigInt(amount), notes);
      return NextResponse.json({ success: true, goal: updated });
    }

    const validated = createGoalSchema.parse(body);
    const goal = await prisma.financialGoal.create({
      data: {
        userId: session.userId,
        name: validated.name,
        targetAmount: BigInt(validated.targetAmount),
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        priority: validated.priority,
        category: validated.category,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[GOAL API ERROR]', error);
    return NextResponse.json({ error: 'Gagal memproses tujuan finansial' }, { status: 500 });
  }
}

