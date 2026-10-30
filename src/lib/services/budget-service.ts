import prisma from '../db';

export interface BudgetStatusItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  allocatedAmount: number;
  allocatedPercentage?: number;
  currentSpent: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'SAFE' | 'CAUTION' | 'LIMIT_REACHED' | 'OVERBUDGET';
  dailyRecommendedLimit: number;
  projectedSpending: number;
}

export interface BudgetSummary {
  budgetId: string;
  budgetName: string;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentageUsed: number;
  daysRemaining: number;
  status: 'SAFE' | 'CAUTION' | 'LIMIT_REACHED' | 'OVERBUDGET';
  categories: BudgetStatusItem[];
  unallocatedAmount: number;
}

export class BudgetService {
  /**
   * Calculates the real-time status of all budget categories against actual transactions.
   */
  static async getActiveBudgetStatus(userId: string): Promise<BudgetSummary | null> {
    const now = new Date();
    const budget = await prisma.budget.findFirst({
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
      orderBy: { createdAt: 'desc' },
    });

    if (!budget) return null;

    // Fetch actual posted non-void expenses for these categories in the budget time window
    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        isVoided: false,
        date: { gte: budget.startDate, lte: budget.endDate },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Sum expenses by category
    const categorySpentMap = new Map<string, bigint>();
    let grandTotalSpent = 0n;

    for (const exp of expenses) {
      if (!exp.categoryId) continue;
      const current = categorySpentMap.get(exp.categoryId) || 0n;
      categorySpentMap.set(exp.categoryId, current + exp.amount);
      grandTotalSpent += exp.amount;
    }

    const totalDays = Math.max(1, Math.round((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 3600 * 24)));
    const daysElapsed = Math.max(1, Math.round((now.getTime() - budget.startDate.getTime()) / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(1, Math.round((budget.endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

    let totalAllocated = 0n;
    const items: BudgetStatusItem[] = [];

    for (const alloc of budget.allocations) {
      totalAllocated += alloc.allocatedAmount;
      const spentBig = categorySpentMap.get(alloc.categoryId) || 0n;
      const allocatedNum = Number(alloc.allocatedAmount);
      const spentNum = Number(spentBig);
      const remainingNum = Math.max(0, allocatedNum - spentNum);

      const percentageUsed = allocatedNum > 0 ? Math.round((spentNum / allocatedNum) * 100) : 0;

      let status: 'SAFE' | 'CAUTION' | 'LIMIT_REACHED' | 'OVERBUDGET' = 'SAFE';
      if (percentageUsed > 100) status = 'OVERBUDGET';
      else if (percentageUsed >= 100) status = 'LIMIT_REACHED';
      else if (percentageUsed >= 80) status = 'CAUTION';

      const dailyRecommendedLimit = Math.round(remainingNum / daysRemaining);
      const dailyRunRate = spentNum / daysElapsed;
      const projectedSpending = Math.round(spentNum + dailyRunRate * daysRemaining);

      items.push({
        categoryId: alloc.categoryId,
        categoryName: alloc.category.name,
        categoryIcon: alloc.category.icon,
        categoryColor: alloc.category.color,
        allocatedAmount: allocatedNum,
        allocatedPercentage: alloc.allocatedPercentage || undefined,
        currentSpent: spentNum,
        remainingAmount: remainingNum,
        percentageUsed,
        status,
        dailyRecommendedLimit,
        projectedSpending,
      });
    }

    const totalLimitNum = Number(budget.totalLimit);
    const grandSpentNum = Number(grandTotalSpent);
    const totalRemaining = Math.max(0, totalLimitNum - grandSpentNum);
    const overallPercentageUsed = totalLimitNum > 0 ? Math.round((grandSpentNum / totalLimitNum) * 100) : 0;

    let overallStatus: 'SAFE' | 'CAUTION' | 'LIMIT_REACHED' | 'OVERBUDGET' = 'SAFE';
    if (overallPercentageUsed > 100) overallStatus = 'OVERBUDGET';
    else if (overallPercentageUsed >= 100) overallStatus = 'LIMIT_REACHED';
    else if (overallPercentageUsed >= 80) overallStatus = 'CAUTION';

    const unallocatedAmount = Math.max(0, totalLimitNum - Number(totalAllocated));

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      totalLimit: totalLimitNum,
      totalSpent: grandSpentNum,
      totalRemaining,
      overallPercentageUsed,
      daysRemaining,
      status: overallStatus,
      categories: items,
      unallocatedAmount,
    };
  }

  /**
   * Creates or updates a budget with category allocations.
   */
  static async upsertBudget(
    userId: string,
    data: {
      budgetId?: string;
      name: string;
      period: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
      startDate: Date;
      endDate: Date;
      totalLimit: bigint;
      allocations: {
        categoryId: string;
        allocatedAmount: bigint;
        allocatedPercentage?: number;
      }[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      let budgetId = data.budgetId;

      if (budgetId) {
        await tx.budgetAllocation.deleteMany({ where: { budgetId } });
        await tx.budget.update({
          where: { id: budgetId },
          data: {
            name: data.name,
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            totalLimit: data.totalLimit,
          },
        });
      } else {
        const created = await tx.budget.create({
          data: {
            userId,
            name: data.name,
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            totalLimit: data.totalLimit,
          },
        });
        budgetId = created.id;
      }

      for (const item of data.allocations) {
        await tx.budgetAllocation.create({
          data: {
            budgetId: budgetId!,
            categoryId: item.categoryId,
            allocatedAmount: item.allocatedAmount,
            allocatedPercentage: item.allocatedPercentage,
          },
        });
      }

      return budgetId;
    });
  }
}

