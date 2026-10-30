import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { HealthScoreService } from '@/lib/services/health-score-service';

export async function GET() {
  try {
    const session = await requireAuth();
    const report = await HealthScoreService.calculateHealthScore(session.userId);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

