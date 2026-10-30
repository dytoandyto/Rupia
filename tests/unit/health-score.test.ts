import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { HealthScoreService } from '@/lib/services/health-score-service';
import { LedgerService } from '@/lib/services/ledger-service';

describe('Financial Health Score Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    const email = `test_health_${Date.now()}@rupia.id`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Health Test User',
        passwordHash: 'dummy',
      },
    });
    testUserId = user.id;

    await LedgerService.createWallet(testUserId, {
      name: 'Mandiri Livin',
      type: 'BANK',
      openingBalance: 5000000n,
    });
  });

  it('flags data insufficiency when transactions count is low', async () => {
    const report = await HealthScoreService.calculateHealthScore(testUserId);
    expect(report.isDataSufficient).toBe(false);
    expect(report.dataCompletenessMessage).toBeDefined();
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.dimensions.length).toBe(5);
  });

  it('calculates score with 5 weighted dimensions when sufficient data exists', async () => {
    const wallet = await prisma.wallet.findFirst({ where: { userId: testUserId } });

    // Add 3 transactions
    await LedgerService.recordTransaction(testUserId, {
      walletId: wallet!.id,
      type: 'INCOME',
      amount: 10000000n,
      description: 'Gaji Bulanan',
    });

    await LedgerService.recordTransaction(testUserId, {
      walletId: wallet!.id,
      type: 'EXPENSE',
      amount: 2500000n,
      description: 'Belanja Kebutuhan Rumah',
    });

    await LedgerService.recordTransaction(testUserId, {
      walletId: wallet!.id,
      type: 'EXPENSE',
      amount: 500000n,
      description: 'Makan & Transport',
    });

    const report = await HealthScoreService.calculateHealthScore(testUserId);
    expect(report.isDataSufficient).toBe(true);
    expect(report.score).toBeGreaterThan(60);
    expect(['Sangat Sehat', 'Sehat']).toContain(report.rating);
  });
});

