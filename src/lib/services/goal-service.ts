import prisma, { serializeBigInt } from '../db';

export interface GoalCalculations {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  deadline: Date | null;
  priority: string;
  isCompleted: boolean;
  recommendedWeeklyContribution: number;
  recommendedMonthlyContribution: number;
  estimatedCompletionMonths: number;
}

export class GoalService {
  static async getGoalsWithCalculations(userId: string): Promise<GoalCalculations[]> {
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return goals.map((goal) => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const remaining = Math.max(0, target - current);
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

      let weeksRemaining = 52;
      let monthsRemaining = 12;

      if (goal.deadline) {
        const diffMs = goal.deadline.getTime() - now.getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 3600 * 24)));
        weeksRemaining = Math.max(1, Math.round(diffDays / 7));
        monthsRemaining = Math.max(1, Math.round(diffDays / 30));
      }

      const recommendedWeekly = Math.round(remaining / weeksRemaining);
      const recommendedMonthly = Math.round(remaining / monthsRemaining);

      return {
        id: goal.id,
        name: goal.name,
        targetAmount: target,
        currentAmount: current,
        remainingAmount: remaining,
        progressPercentage: progress,
        deadline: goal.deadline,
        priority: goal.priority,
        isCompleted: goal.isCompleted || progress >= 100,
        recommendedWeeklyContribution: recommendedWeekly,
        recommendedMonthlyContribution: recommendedMonthly,
        estimatedCompletionMonths: monthsRemaining,
      };
    });
  }

  static async contributeToGoal(
    userId: string,
    goalId: string,
    amount: bigint,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const goal = await tx.financialGoal.findFirst({
        where: { id: goalId, userId },
      });
      if (!goal) throw new Error('Goal not found.');

      await tx.goalContribution.create({
        data: {
          goalId,
          userId,
          amount,
          notes,
        },
      });

      const newCurrent = goal.currentAmount + amount;
      const isCompleted = newCurrent >= goal.targetAmount;

      return tx.financialGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrent,
          isCompleted,
        },
      });
    });
  }
}

