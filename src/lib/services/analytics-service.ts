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
  priorityBreakdown: {
    essential: number;
    essentialPercentage: number;
    discretionary: number;
    discretionaryPercentage: number;
  };
  transportAndToll: {
    total: number;
    tripCount: number;
    percentageOfExpenses: number;
  };
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
      include: { category: true, wallet: true },
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
    let essentialExpenses = 0n;
    let discretionaryExpenses = 0n;
    let transportTotal = 0n;
    let transportCount = 0;

    const catMap = new Map<string, { id: string; name: string; color: string; icon: string; amount: bigint }>();
    const dayMap = new Map<string, { expense: bigint; income: bigint }>();

    for (const tx of currentTxs) {
      if (tx.type === 'INCOME') {
        currentIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        currentExpenses += tx.amount;

        if (tx.isEssential !== false) {
          essentialExpenses += tx.amount;
        } else {
          discretionaryExpenses += tx.amount;
        }

        const desc = (tx.description || '').toLowerCase();
        const catName = (tx.category?.name || '').toLowerCase();
        if (
          catName.includes('transport') ||
          catName.includes('tol') ||
          catName.includes('parkir') ||
          desc.includes('tol') ||
          desc.includes('parkir') ||
          desc.includes('krl') ||
          desc.includes('mrt') ||
          tx.wallet?.type === 'EMONEY'
        ) {
          transportTotal += tx.amount;
          transportCount++;
        }

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

      // Group daily trend
      const dateKey = tx.date.toISOString().split('T')[0];
      const dayEntry = dayMap.get(dateKey) || { expense: 0n, income: 0n };
      if (tx.type === 'EXPENSE') dayEntry.expense += tx.amount;
      if (tx.type === 'INCOME') dayEntry.income += tx.amount;
      dayMap.set(dateKey, dayEntry);
    }

    let prevIncome = 0n;
    let prevExpenses = 0n;
    for (const tx of prevTxs) {
      if (tx.type === 'INCOME') prevIncome += tx.amount;
      if (tx.type === 'EXPENSE') prevExpenses += tx.amount;
    }

    const curIncNum = Number(currentIncome);
    const curExpNum = Number(currentExpenses);
    const prevIncNum = Number(prevIncome);
    const prevExpNum = Number(prevExpenses);

    const curNet = curIncNum - curExpNum;
    const prevNet = prevIncNum - prevExpNum;

    const expenseToIncomeRatio = curIncNum > 0 ? Math.min(100, Math.round((curExpNum / curIncNum) * 100)) : 0;
    const savingsContributionRatio = curIncNum > 0 && curNet > 0 ? Math.round((curNet / curIncNum) * 100) : 0;

    const daysPassedInMonth = Math.max(1, targetDate.getDate());
    const dailyAverageExpense = Math.round(curExpNum / daysPassedInMonth);

    const expenseChangePercentage = prevExpNum > 0
      ? Math.round(((curExpNum - prevExpNum) / prevExpNum) * 100)
      : 0;

    // Categories array with percentages
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

    const essNum = Number(essentialExpenses);
    const discNum = Number(discretionaryExpenses);
    const transNum = Number(transportTotal);

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
      priorityBreakdown: {
        essential: essNum,
        essentialPercentage: curExpNum > 0 ? Math.round((essNum / curExpNum) * 100) : 0,
        discretionary: discNum,
        discretionaryPercentage: curExpNum > 0 ? Math.round((discNum / curExpNum) * 100) : 0,
      },
      transportAndToll: {
        total: transNum,
        tripCount: transportCount,
        percentageOfExpenses: curExpNum > 0 ? Math.round((transNum / curExpNum) * 100) : 0,
      },
    };
  }
}
