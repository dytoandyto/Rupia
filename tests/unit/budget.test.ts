import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { BudgetService } from '@/lib/services/budget-service';
import { LedgerService } from '@/lib/services/ledger-service';

describe('Budget & Allocations Service', () => {
  let testUserId: string;
  let categoryAId: string;
  let categoryBId: string;
  let walletId: string;

  beforeEach(async () => {
    const email = `test_budget_${Date.now()}@rupia.id`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Budget User',
        passwordHash: 'dummy',
      },
    });
    testUserId = user.id;

    const catA = await prisma.category.create({
      data: { userId: testUserId, name: 'Makan', type: 'EXPENSE' },
    });
    categoryAId = catA.id;

    const catB = await prisma.category.create({
      data: { userId: testUserId, name: 'Bensin', type: 'EXPENSE' },
    });
    categoryBId = catB.id;

    const w = await LedgerService.createWallet(testUserId, {
      name: 'Cash',
      type: 'CASH',
      openingBalance: 2000000n,
    });
    walletId = w.id;
  });

  it('correctly tracks category spent and status thresholds (Safe, Caution, Overbudget)', async () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Create budget: Makan = 1.000.000, Bensin = 500.000
    await BudgetService.upsertBudget(testUserId, {
      name: 'Anggaran Bulanan',
      period: 'MONTHLY',
      startDate,
      endDate,
      totalLimit: 2000000n,
      allocations: [
        { categoryId: categoryAId, allocatedAmount: 1000000n, allocatedPercentage: 50 },
        { categoryId: categoryBId, allocatedAmount: 500000n, allocatedPercentage: 25 },
      ],
    });

    // Record expense for Makan of 850.000 (85% -> CAUTION)
    await LedgerService.recordTransaction(testUserId, {
      walletId,
      categoryId: categoryAId,
      type: 'EXPENSE',
      amount: 850000n,
      description: 'Makan Siang & Malam',
    });

    // Record expense for Bensin of 550.000 (110% -> OVERBUDGET)
    await LedgerService.recordTransaction(testUserId, {
      walletId,
      categoryId: categoryBId,
      type: 'EXPENSE',
      amount: 550000n,
      description: 'Bensin & Tol',
    });

    const status = await BudgetService.getActiveBudgetStatus(testUserId);
    expect(status).not.toBeNull();
    expect(status?.totalSpent).toBe(1400000);

    const catAStatus = status?.categories.find((c) => c.categoryId === categoryAId);
    expect(catAStatus?.status).toBe('CAUTION');
    expect(catAStatus?.percentageUsed).toBe(85);

    const catBStatus = status?.categories.find((c) => c.categoryId === categoryBId);
    expect(catBStatus?.status).toBe('OVERBUDGET');
    expect(catBStatus?.percentageUsed).toBe(110);
  });
});

