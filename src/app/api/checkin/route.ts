import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { CheckInService } from '@/lib/services/checkin-service';
import prisma from '@/lib/db';

const checkInSchema = z.object({
  hasIncome: z.boolean(),
  hasExpenses: z.boolean(),
  hasUnrecorded: z.boolean(),
  walletReconciled: z.boolean(),
  note: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const [preferences, hasCheckedIn, recentCheckIns] = await Promise.all([
      CheckInService.getPreferences(session.userId),
      CheckInService.hasCheckedInToday(session.userId),
      prisma.dailyCheckIn.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
    ]);

    return NextResponse.json({
      preferences,
      hasCheckedIn,
      recentCheckIns,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = checkInSchema.parse(body);

    const checkIn = await CheckInService.submitDailyCheckIn(session.userId, validated);

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[CHECKIN SUBMIT ERROR]', error);
    return NextResponse.json({ error: 'Gagal mencatat check-in harian' }, { status: 500 });
  }
}

