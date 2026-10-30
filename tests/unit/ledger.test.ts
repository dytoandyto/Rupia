import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/db';
import { LedgerService } from '@/lib/services/ledger-service';

describe('Multi-Wallet Ledger & Balance Integrity Engine', () => {
  let testUserId: string;
  let walletAId: string;
  let walletBId: string;

  beforeEach(async () => {
    // Create clean test user
    const email = `test_ledger_${Date.now()}@rupia.id`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Ledger User',
        passwordHash: 'dummy',
      },
    });
    testUserId = user.id;

    // Create 2 test wallets with known starting balances
    const wA = await LedgerService.createWallet(testUserId, {
      name: 'Dompet A (Mandiri)',
      type: 'BANK',
      openingBalance: 1000000n, // Rp 1.000.000
    });
    walletAId = wA.id;

    const wB = await LedgerService.createWallet(testUserId, {
      name: 'Dompet B (GoPay)',
      type: 'EWALLET',
      openingBalance: 200000n, // Rp 200.000
    });
    walletBId = wB.id;
  });

  it('records an expense and decrements wallet balance exactly', async () => {
    const tx = await LedgerService.recordTransaction(testUserId, {
      walletId: walletAId,
      type: 'EXPENSE',
      amount: 150000n,
      description: 'Belanja Supermarket',
    });

    expect(tx.amount).toBe(150000n);

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: walletAId } });
    expect(updatedWallet?.recordedBalance).toBe(850000n); // 1.000.000 - 150.000
  });

  it('records an income and increments wallet balance exactly', async () => {
    await LedgerService.recordTransaction(testUserId, {
      walletId: walletBId,
      type: 'INCOME',
      amount: 500000n,
      description: 'Transfer Masuk dari Rekan',
    });

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: walletBId } });
    expect(updatedWallet?.recordedBalance).toBe(700000n); // 200.000 + 500.000
  });

  it('executes an atomic transfer between wallets with transfer fee', async () => {
    // Transfer 300.000 from A to B with 2.500 fee deducted from A
    const transfer = await LedgerService.executeTransfer(testUserId, {
      sourceWalletId: walletAId,
      destinationWalletId: walletBId,
      amount: 300000n,
      fee: 2500n,
      notes: 'Top-up GoPay dari Mandiri',
    });

    expect(transfer.amount).toBe(300000n);
    expect(transfer.fee).toBe(2500n);

    const sourceWallet = await prisma.wallet.findUnique({ where: { id: walletAId } });
    const destWallet = await prisma.wallet.findUnique({ where: { id: walletBId } });

    // Source: 1.000.000 - 300.000 - 2.500 = 697.500
    expect(sourceWallet?.recordedBalance).toBe(697500n);
    // Dest: 200.000 + 300.000 = 500.000
    expect(destWallet?.recordedBalance).toBe(500000n);
  });

  it('reconciles wallet and flags discrepancies without silent overrides', async () => {
    // Recorded is 1.000.000, user reports actual balance is 950.000 (discrepancy: -50.000)
    const result = await LedgerService.reconcileWallet(testUserId, walletAId, 950000n, false);

    expect(result.isMatched).toBe(false);
    expect(result.discrepancy).toBe(-50000n);
    // When createAdjustment is false, recordedBalance remains unchanged
    expect(result.wallet.recordedBalance).toBe(1000000n);
    expect(result.wallet.lastVerifiedBalance).toBe(950000n);

    // Now test with explicit adjustment transaction creation
    const adjustedResult = await LedgerService.reconcileWallet(testUserId, walletAId, 950000n, true);
    expect(adjustedResult.wallet.recordedBalance).toBe(950000n);
  });

  it('safely voids a transaction and restores wallet balance', async () => {
    const tx = await LedgerService.recordTransaction(testUserId, {
      walletId: walletAId,
      type: 'EXPENSE',
      amount: 200000n,
      description: 'Salah input struk',
    });

    let w = await prisma.wallet.findUnique({ where: { id: walletAId } });
    expect(w?.recordedBalance).toBe(800000n);

    await LedgerService.voidTransaction(testUserId, tx.id, 'Struk dobel');

    w = await prisma.wallet.findUnique({ where: { id: walletAId } });
    expect(w?.recordedBalance).toBe(1000000n); // Restored!
  });
});

