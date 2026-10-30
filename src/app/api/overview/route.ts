import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma, { serializeBigInt } from '@/lib/db';
import { AtsService } from '@/lib/services/ats-service';
import { BudgetService } from '@/lib/services/budget-service';
import { CheckInService } from '@/lib/services/checkin-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { formatRupiah } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const [overview, budgetStatus, hasCheckedIn, wallets, recentTxs, unreadNotifsCount] = await Promise.all([
      AtsService.getFinancialOverview(userId),
      BudgetService.getActiveBudgetStatus(userId),
      CheckInService.hasCheckedInToday(userId),
      prisma.wallet.findMany({
        where: { userId, isArchived: false },
        orderBy: { recordedBalance: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { userId, isVoided: false },
        include: { wallet: true, category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // AI Insight snippet
    let insightObservation = 'Pola keuanganmu berjalan stabil bulan ini.';
    let insightRecommendation = 'Pertahankan disiplin pencatatan harian untuk visibilitas saldo optimal.';

    if (overview.expensesThisMonth > overview.incomeThisMonth && overview.incomeThisMonth > 0) {
      insightObservation = `Pengeluaranmu (${formatRupiah(overview.expensesThisMonth)}) telah melampaui pemasukan bulan ini.`;
      insightRecommendation = `Rem pengeluaran non-primer. Batasi pengeluaran s.d. ${formatRupiah(overview.atsBreakdown.dailySafeToSpend)}/hari.`;
    } else if (overview.atsBreakdown.hasUnverifiedWallets) {
      insightObservation = `Ada ${overview.atsBreakdown.unverifiedWalletNames.length} dompet yang belum diverifikasi dalam 7 hari terakhir.`;
      insightRecommendation = `Lakukan rekonsiliasi saldo aktual untuk memastikan akurasi Available-to-Spend.`;
    } else if (budgetStatus && budgetStatus.categories.some((c) => c.status === 'OVERBUDGET')) {
      const overCat = budgetStatus.categories.find((c) => c.status === 'OVERBUDGET')!;
      insightObservation = `Pos "${overCat.categoryName}" telah melewati anggaran (${overCat.percentageUsed}% terpakai).`;
      insightRecommendation = `Alihkan alokasi dari pos lain atau tunda belanja kategori ini hingga awal bulan depan.`;
    }

    return NextResponse.json(
      serializeBigInt({
        overview,
        budgetStatus,
        hasCheckedIn,
        wallets,
        recentTransactions: recentTxs,
        unreadNotifsCount,
        aiInsight: {
          observation: insightObservation,
          recommendation: insightRecommendation,
        },
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[API OVERVIEW ERROR]', error);
    return NextResponse.json({ error: 'Gagal mengambil ringkasan finansial' }, { status: 500 });
  }
}

