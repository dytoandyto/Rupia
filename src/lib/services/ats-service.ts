import prisma from '../db';

export interface AtsBreakdown {
  totalRecordedBalance: bigint;
  upcomingObligations: bigint;
  reservedAllocations: bigint;
  safetyBuffer: bigint;
  availableToSpend: bigint;
  dailySafeToSpend: bigint;
  daysRemainingInMonth: number;
  hasUnverifiedWallets: boolean;
  unverifiedWalletNames: string[];
  assumptions: string[];
}

export interface FinancialOverviewSummary {
  totalRecordedBalance: number;
  availableToSpend: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  netCashFlow: number;
  savingsRatePercentage: number;
  atsBreakdown: AtsBreakdown;
  recentReconciliationDate: Date | null;
}

export class AtsService {
  /**
   * Deterministically calculates Available-To-Spend (ATS) for a user.
   */
  static async calculateAvailableToSpend(userId: string): Promise<AtsBreakdown> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysRemaining = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);

    // 1. Spendable Wallets (Cash, Bank, E-Wallet; ignore illiquid investments if separate)
    const wallets = await prisma.wallet.findMany({
      where: { userId, isArchived: false },
    });

    let totalRecordedBalance = 0n;
    const unverifiedWalletNames: string[] = [];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    for (const w of wallets) {
      if (w.type !== 'INVESTMENT') {
        totalRecordedBalance += w.recordedBalance;
      }
      if (!w.lastReconciledAt || w.lastReconciledAt < sevenDaysAgo) {
        unverifiedWalletNames.push(w.name);
      }
    }

    // 2. Upcoming Obligations due this month that are not yet marked as paid
    const obligations = await prisma.financialObligation.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lte: endOfMonth },
      },
    });

    let upcomingObligations = 0n;
    for (const ob of obligations) {
      upcomingObligations += ob.amount;
    }

    // 3. Reserved Allocations (from active monthly budgets designated for Savings / Emergency)
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        allocations: {
          include: { category: true },
        },
      },
    });

    let reservedAllocations = 0n;
    for (const b of activeBudgets) {
      for (const alloc of b.allocations) {
        // Reserve savings goals or specific capital allocations
        if (
          alloc.category.name.toLowerCase().includes('tabungan') ||
          alloc.category.name.toLowerCase().includes('investasi') ||
          alloc.category.name.toLowerCase().includes('darurat')
        ) {
          reservedAllocations += alloc.allocatedAmount;
        }
      }
    }

    // 4. Default safety buffer: 5% of spendable balance (minimum Rp 50.000)
    let safetyBuffer = 0n;
    if (totalRecordedBalance > 0n) {
      const fivePercent = totalRecordedBalance / 20n;
      safetyBuffer = fivePercent > 50000n ? fivePercent : 50000n;
    }

    // 5. Deterministic calculation
    const deductions = upcomingObligations + reservedAllocations + safetyBuffer;
    const availableToSpend = totalRecordedBalance > deductions ? totalRecordedBalance - deductions : 0n;
    const dailySafeToSpend = availableToSpend / BigInt(daysRemaining);

    const assumptions: string[] = [
      `Saldo tercatat dari ${wallets.length} dompet aktif (tidak termasuk aset investasi jangka panjang).`,
      `Kewajiban mendatang mencakup ${obligations.length} tagihan jatuh tempo s.d. akhir bulan (${endOfMonth.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}).`,
      `Alokasi dicadangkan untuk pos tabungan/dana darurat sebesar ${Number(reservedAllocations).toLocaleString('id-ID')} IDR.`,
      `Buffer pengaman fleksibel diterapkan sebesar ${Number(safetyBuffer).toLocaleString('id-ID')} IDR.`,
    ];

    if (unverifiedWalletNames.length > 0) {
      assumptions.push(
        `Perhatian: Saldo dompet [${unverifiedWalletNames.join(', ')}] belum diverifikasi/rekonsiliasi dalam 7 hari terakhir.`
      );
    }

    return {
      totalRecordedBalance,
      upcomingObligations,
      reservedAllocations,
      safetyBuffer,
      availableToSpend,
      dailySafeToSpend,
      daysRemainingInMonth: daysRemaining,
      hasUnverifiedWallets: unverifiedWalletNames.length > 0,
      unverifiedWalletNames,
      assumptions,
    };
  }

  /**
   * Aggregates the primary financial overview for the Mobile Home Screen.
   */
  static async getFinancialOverview(userId: string): Promise<FinancialOverviewSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Sum transactions for this month (excluding voids and transfers)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        isVoided: false,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    let incomeThisMonth = 0n;
    let expensesThisMonth = 0n;

    for (const tx of transactions) {
      if (tx.type === 'INCOME') {
        incomeThisMonth += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        expensesThisMonth += tx.amount;
      }
      // Note: 'TRANSFER' is strictly excluded from income & expenses to prevent inflation!
    }

    const ats = await this.calculateAvailableToSpend(userId);
    const netCashFlow = incomeThisMonth - expensesThisMonth;

    const incomeNum = Number(incomeThisMonth);
    const expenseNum = Number(expensesThisMonth);
    const savingsRate = incomeNum > 0 ? Math.max(0, Math.round(((incomeNum - expenseNum) / incomeNum) * 100)) : 0;

    const latestWallet = await prisma.wallet.findFirst({
      where: { userId, lastReconciledAt: { not: null } },
      orderBy: { lastReconciledAt: 'desc' },
      select: { lastReconciledAt: true },
    });

    return {
      totalRecordedBalance: Number(ats.totalRecordedBalance),
      availableToSpend: Number(ats.availableToSpend),
      incomeThisMonth: incomeNum,
      expensesThisMonth: expenseNum,
      netCashFlow: Number(netCashFlow),
      savingsRatePercentage: savingsRate,
      atsBreakdown: ats,
      recentReconciliationDate: latestWallet?.lastReconciledAt || null,
    };
  }
}

