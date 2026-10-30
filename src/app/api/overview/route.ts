import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma, { serializeBigInt } from '@/lib/db';
import { AtsService } from '@/lib/services/ats-service';
import { BudgetService } from '@/lib/services/budget-service';
import { CheckInService } from '@/lib/services/checkin-service';
import { formatRupiah } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      overview,
      budgetStatus,
      hasCheckedIn,
      wallets,
      recentTxs,
      recentTopUps,
      recentCardPurchases,
      transportTxs,
      unreadNotifsCount,
    ] = await Promise.all([
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
      // Recent Top-ups (Transfers into E-Money or E-Wallet)
      prisma.transfer.findMany({
        where: {
          userId,
          destinationWallet: { type: { in: ['EMONEY', 'EWALLET'] } },
        },
        include: {
          sourceWallet: true,
          destinationWallet: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      // Recent Card Purchases (Payments from E-Money cards)
      prisma.transaction.findMany({
        where: {
          userId,
          isVoided: false,
          type: 'EXPENSE',
          wallet: { type: 'EMONEY' },
        },
        include: { wallet: true, category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      // Transport & Toll expenses this month
      prisma.transaction.findMany({
        where: {
          userId,
          isVoided: false,
          type: 'EXPENSE',
          date: { gte: startOfMonth },
          OR: [
            { category: { name: { contains: 'Transport', mode: 'insensitive' } } },
            { category: { name: { contains: 'Tol', mode: 'insensitive' } } },
            { category: { name: { contains: 'Parkir', mode: 'insensitive' } } },
            { description: { contains: 'Tol', mode: 'insensitive' } },
            { description: { contains: 'Parkir', mode: 'insensitive' } },
            { description: { contains: 'KRL', mode: 'insensitive' } },
            { description: { contains: 'MRT', mode: 'insensitive' } },
          ],
        },
        select: { amount: true, description: true, date: true },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // Compute combined E-Wallet and E-Money balances
    let combinedEWalletAndEMoneyBalance = 0n;
    let mostRecentVerification: Date | null = null;

    for (const w of wallets) {
      if (w.type === 'EWALLET' || w.type === 'EMONEY') {
        combinedEWalletAndEMoneyBalance += w.recordedBalance;
      }
      if (w.lastReconciledAt) {
        if (!mostRecentVerification || w.lastReconciledAt > mostRecentVerification) {
          mostRecentVerification = w.lastReconciledAt;
        }
      }
    }

    // Compute total transport & toll expenses
    const transportAndTollTotal = transportTxs.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    // AI Insight snippet
    let insightObservation = 'Pola keuanganmu berjalan stabil bulan ini.';
    let insightRecommendation = 'Pertahankan disiplin pencatatan harian untuk visibilitas saldo optimal.';

    if (overview.expensesThisMonth > overview.incomeThisMonth && overview.incomeThisMonth > 0) {
      insightObservation = `Pengeluaranmu (${formatRupiah(overview.expensesThisMonth)}) telah melampaui pemasukan bulan ini.`;
      insightRecommendation = `Rem pengeluaran non-primer. Batasi pengeluaran s.d. ${formatRupiah(overview.atsBreakdown.dailySafeToSpend)}/hari.`;
    } else if (overview.atsBreakdown.hasUnverifiedWallets) {
      insightObservation = `Ada ${overview.atsBreakdown.unverifiedWalletNames.length} dompet/kartu yang belum diverifikasi dalam 7 hari terakhir.`;
      insightRecommendation = `Lakukan rekonsiliasi saldo aktual kartu/dompet untuk akurasi Available-to-Spend.`;
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
        eMoneyAnalytics: {
          combinedEWalletAndEMoneyBalance,
          recentTopUps,
          recentCardPurchases,
          transportAndTollTotal,
          transportTransactionCount: transportTxs.length,
          lastBalanceVerificationTime: mostRecentVerification,
        },
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
