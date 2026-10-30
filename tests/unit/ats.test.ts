import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { AtsService } from '@/lib/services/ats-service';
import { LedgerService } from '@/lib/services/ledger-service';

describe('Available-To-Spend (ATS) Engine', () => {
  let testUserId: string;

  beforeEach(async () => {
    const email = `test_ats_${Date.now()}@rupia.id`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test ATS User',
        passwordHash: 'dummy',
      },
    });
    testUserId = user.id;

    // Create wallet with Rp 1.000.000
    await LedgerService.createWallet(testUserId, {
      name: 'Mandiri Utama',
      type: 'BANK',
      openingBalance: 1000000n,
    });
  });

  it('calculates available-to-spend deducting upcoming obligations and buffer', async () => {
    const now = new Date();
    // Add upcoming obligation of Rp 200.000 due this month
    await prisma.financialObligation.create({
      data: {
        userId: testUserId,
        name: 'Tagihan Listrik PLN',
        amount: 200000n,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 28),
      },
    });

    const ats = await AtsService.calculateAvailableToSpend(testUserId);

    expect(ats.totalRecordedBalance).toBe(1000000n);
    expect(ats.upcomingObligations).toBe(200000n);
    // Buffer is 5% of 1.000.000 = 50.000
    expect(ats.safetyBuffer).toBe(50000n);

    // Available: 1.000.000 - 200.000 - 50.000 = 750.000
    expect(ats.availableToSpend).toBe(750000n);
    expect(ats.dailySafeToSpend).toBeGreaterThan(0n);
    expect(ats.daysRemainingInMonth).toBeGreaterThanOrEqual(1);
  });

  it('handles zero or negative balance safely without crashing', async () => {
    // Empty user with zero wallets
    const emptyUser = await prisma.user.create({
      data: {
        email: `empty_${Date.now()}@rupia.id`,
        name: 'Empty User',
        passwordHash: 'dummy',
      },
    });

    const ats = await AtsService.calculateAvailableToSpend(emptyUser.id);
    expect(ats.totalRecordedBalance).toBe(0n);
    expect(ats.availableToSpend).toBe(0n);
    expect(ats.dailySafeToSpend).toBe(0n);
  });
});

