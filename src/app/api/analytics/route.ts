import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/analytics-service';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const report = await AnalyticsService.getMonthlyAnalytics(session.userId, targetDate);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

