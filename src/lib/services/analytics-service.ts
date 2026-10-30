import prisma from '../db';

export interface CategoryBreakdown {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface DailySpendingPoint {
  date: string;
  day: string;
  expense: number;
  income: number;
}

export interface AnalyticsReport {
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    expenseToIncomeRatio: number;
    savingsContributionRatio: number;
    dailyAverageExpense: number;
  };
  previousPeriod: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    expenseChangePercentage: number;
  };
  categories: CategoryBreakdown[];
  dailyTrend: DailySpendingPoint[];
  largestExpenses: {
    id: string;
    description: string;
    merchant?: string | null;
    amount: number;
    date: Date;
    categoryName?: string;
  }[];
}

export class AnalyticsService {
  static async getMonthlyAnalytics(userId: string, targetDate = new Date()): Promise<AnalyticsReport> {
    const currentStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const currentEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    const prevStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
    const prevEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0, 23, 59, 59);

    // 1. Current Period Transactions (exclude void and transfers)
    const currentTxs = await prisma.transaction.findMany({
      where: {
        userId,
        isVoided: false,
        date: { gte: currentStart, lte: currentEnd },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    // 2. Previous Period Transactions
    const prevTxs = await prisma.transaction.findMany({
      where: {
        userId,
        isVoided: false,
        date: { gte: prevStart, lte: prevEnd },
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let currentIncome = 0n;
    let currentExpenses = 0n;
    const catMap = new Map<string, { id: string; name: string; color: string; icon: string; amount: bigint }>();
    const dayMap = new Map<string, { expense: bigint; income: bigint }>();

    for (const tx of currentTxs) {
      if (tx.type === 'INCOME') {
        currentIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        currentExpenses += tx.amount;

        const catId = tx.categoryId || 'uncategorized';
        const existing = catMap.get(catId) || {
          id: catId,
          name: tx.category?.name || 'Tanpa Kategori',
          color: tx.category?.color || '#94a3b8',
          icon: tx.category?.icon || 'Tag',
          amount: 0n,
        };
        existing.amount += tx.amount;
        catMap.set(catId, existing);
      }

      // Daily trend mapping
      const dateKey = tx.date.toISOString().split('T')[0];
      const dayData = dayMap.get(dateKey) || { expense: 0n, income: 0n };
      if (tx.type === 'EXPENSE') dayData.expense += tx.amount;
      if (tx.type === 'INCOME') dayData.income += tx.amount;
      dayMap.set(dateKey, dayData);
    }

    let prevIncome = 0n;
    let prevExpenses = 0n;
    for (const tx of prevTxs) {
      if (tx.type === 'INCOME') prevIncome += tx.amount;
      if (tx.type === 'EXPENSE') prevExpenses += tx.amount;
    }

    const curIncNum = Number(currentIncome);
    const curExpNum = Number(currentExpenses);
    const curNet = curIncNum - curExpNum;

    const prevIncNum = Number(prevIncome);
    const prevExpNum = Number(prevExpenses);
    const prevNet = prevIncNum - prevExpNum;

    // Ratios with zero denominator protection
    const expenseToIncomeRatio = curIncNum > 0 ? Math.round((curExpNum / curIncNum) * 100) : 0;
    const savingsContributionRatio = curIncNum > 0 ? Math.max(0, Math.round((curNet / curIncNum) * 100)) : 0;

    const daysElapsed = Math.max(1, Math.min(targetDate.getDate(), currentEnd.getDate()));
    const dailyAverageExpense = Math.round(curExpNum / daysElapsed);

    let expenseChangePercentage = 0;
    if (prevExpNum > 0) {
      expenseChangePercentage = Math.round(((curExpNum - prevExpNum) / prevExpNum) * 100);
    }

    // Categories sorted by amount desc
    const categories: CategoryBreakdown[] = Array.from(catMap.values())
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        amount: Number(c.amount),
        percentage: curExpNum > 0 ? Math.round((Number(c.amount) / curExpNum) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build complete daily timeline for current month
    const dailyTrend: DailySpendingPoint[] = [];
    const daysInMonth = currentEnd.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const dateKey = d.toISOString().split('T')[0];
      const entry = dayMap.get(dateKey);
      dailyTrend.push({
        date: dateKey,
        day: `${day}`,
        expense: entry ? Number(entry.expense) : 0,
        income: entry ? Number(entry.income) : 0,
      });
    }

    // Largest individual expenses
    const largestExpenses = currentTxs
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => (b.amount > a.amount ? 1 : -1))
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        description: t.description,
        merchant: t.merchant,
        amount: Number(t.amount),
        date: t.date,
        categoryName: t.category?.name,
      }));

    return {
      currentPeriod: {
        startDate: currentStart,
        endDate: currentEnd,
        totalIncome: curIncNum,
        totalExpenses: curExpNum,
        netCashFlow: curNet,
        expenseToIncomeRatio,
        savingsContributionRatio,
        dailyAverageExpense,
      },
      previousPeriod: {
        totalIncome: prevIncNum,
        totalExpenses: prevExpNum,
        netCashFlow: prevNet,
        expenseChangePercentage,
      },
      categories,
      dailyTrend,
      largestExpenses,
    };
  }
}

