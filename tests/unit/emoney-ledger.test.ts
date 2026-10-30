import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerService } from '@/lib/services/ledger-service';
import prisma from '@/lib/db';
import { checkNfcSupport } from '@/lib/nfc-reader';

describe('Physical E-Money Cards & Prepaid Stored-Value Engine Tests', () => {
  const userId = 'user-emoney-tester-001';

  const mockGoPayWallet = {
    id: 'wallet-gopay-01',
    userId,
    name: 'GoPay',
    type: 'EWALLET',
    openingBalance: BigInt(500000),
    recordedBalance: BigInt(500000),
    lastVerifiedBalance: BigInt(500000),
    lastReconciledAt: new Date(),
    isArchived: false,
  };

  const mockMandiriEmoneyWallet = {
    id: 'wallet-mandiri-emoney-01',
    userId,
    name: 'Mandiri e-money Tol Jagorawi',
    type: 'EMONEY',
    issuer: 'MANDIRI',
    cardLast4: '8821',
    color: '#0f2b48',
    icon: 'CreditCard',
    openingBalance: BigInt(50000),
    recordedBalance: BigInt(50000),
    lastVerifiedBalance: BigInt(50000),
    lastBalanceSource: 'MANUAL',
    lastReconciledAt: new Date(),
    isArchived: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an e-money card wallet with issuer and last 4 card digits', async () => {
    const createSpy = vi.spyOn(prisma.wallet, 'create').mockResolvedValue(mockMandiriEmoneyWallet as any);

    const wallet = await LedgerService.createWallet(userId, {
      name: 'Mandiri e-money Tol Jagorawi',
      type: 'EMONEY',
      issuer: 'MANDIRI',
      cardLast4: '8821',
      color: '#0f2b48',
      openingBalance: 50000n,
    });

    expect(wallet.type).toBe('EMONEY');
    expect(wallet.issuer).toBe('MANDIRI');
    expect(wallet.cardLast4).toBe('8821');
    expect(wallet.recordedBalance).toBe(50000n);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('executes a top-up from GoPay to e-money card as a transfer without inflating income or expenses', async () => {
    // Initial balances: GoPay 500.000, e-money 50.000 (Total Assets = 550.000)
    const topUpAmount = 100000n;
    const adminFee = 1500n;

    let sourceBalance = mockGoPayWallet.recordedBalance;
    let destBalance = mockMandiriEmoneyWallet.recordedBalance;

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        wallet: {
          findFirst: vi.fn().mockImplementation((args) => {
            if (args.where.id === mockGoPayWallet.id) return { ...mockGoPayWallet, recordedBalance: sourceBalance };
            if (args.where.id === mockMandiriEmoneyWallet.id) return { ...mockMandiriEmoneyWallet, recordedBalance: destBalance };
            return null;
          }),
          update: vi.fn().mockImplementation((args) => {
            if (args.where.id === mockGoPayWallet.id) sourceBalance = args.data.recordedBalance;
            if (args.where.id === mockMandiriEmoneyWallet.id) destBalance = args.data.recordedBalance;
            return { id: args.where.id, recordedBalance: args.data.recordedBalance };
          }),
        },
        transfer: {
          create: vi.fn().mockResolvedValue({ id: 'transfer-topup-001', amount: topUpAmount, fee: adminFee }),
        },
        transaction: {
          create: vi.fn().mockResolvedValue({ id: 'tx-topup-leg' }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-001' }),
        },
      };
      return callback(mockTx);
    });

    const result = await LedgerService.executeTransfer(userId, {
      sourceWalletId: mockGoPayWallet.id,
      destinationWalletId: mockMandiriEmoneyWallet.id,
      amount: topUpAmount,
      fee: adminFee,
      notes: 'Top-up Mandiri e-money via GoPay',
    });

    expect(result.id).toBe('transfer-topup-001');
    // GoPay decreased by 100.000 + 1.500 fee -> 398.500
    expect(sourceBalance).toBe(398500n);
    // e-money increased by 100.000 -> 150.000
    expect(destBalance).toBe(150000n);

    // Verify Asset Integrity: Total across wallets equals initial 550.000 minus the 1.500 fee paid
    const sumAfter = sourceBalance + destBalance;
    expect(sumAfter).toBe(548500n);
  });

  it('records an e-money toll payment, decreases card balance, and marks priority as essential', async () => {
    let cardBalance = 150000n;
    const tollAmount = 17000n; // Tol JORR

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        transaction: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation((args) => ({
            id: 'tx-toll-01',
            ...args.data,
          })),
        },
        wallet: {
          findFirst: vi.fn().mockResolvedValue({ ...mockMandiriEmoneyWallet, recordedBalance: cardBalance }),
          update: vi.fn().mockImplementation((args) => {
            cardBalance = args.data.recordedBalance;
            return { id: mockMandiriEmoneyWallet.id, recordedBalance: cardBalance };
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-002' }),
        },
      };
      return callback(mockTx);
    });

    const tx = await LedgerService.recordTransaction(userId, {
      walletId: mockMandiriEmoneyWallet.id,
      type: 'EXPENSE',
      amount: tollAmount,
      description: 'Gerbang Tol Cikarang Utama',
      isEssential: true,
      source: 'MANUAL',
    });

    expect(tx.amount).toBe(tollAmount);
    expect(tx.description).toBe('Gerbang Tol Cikarang Utama');
    expect(tx.isEssential).toBe(true);
    expect(cardBalance).toBe(133000n); // 150.000 - 17.000
  });

  it('reconciles e-money balance and records source (NFC vs Manual) with discrepancy adjustment', async () => {
    const recordedBefore = 133000n;
    const actualNfcBalance = 120000n; // User actually spent 13.000 on parking that wasn't recorded yet

    let finalRecorded = recordedBefore;
    let createdTx: any = null;

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        wallet: {
          findFirst: vi.fn().mockResolvedValue({ ...mockMandiriEmoneyWallet, recordedBalance: recordedBefore }),
          update: vi.fn().mockImplementation((args) => {
            if (args.data.recordedBalance !== undefined) {
              finalRecorded = args.data.recordedBalance;
            }
            return {
              ...mockMandiriEmoneyWallet,
              recordedBalance: finalRecorded,
              lastVerifiedBalance: args.data.lastVerifiedBalance,
              lastBalanceSource: args.data.lastBalanceSource,
            };
          }),
        },
        transaction: {
          create: vi.fn().mockImplementation((args) => {
            createdTx = args.data;
            return { id: 'adj-tx-01', ...args.data };
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-003' }),
        },
      };
      return callback(mockTx);
    });

    const result = await LedgerService.reconcileWallet(
      userId,
      mockMandiriEmoneyWallet.id,
      actualNfcBalance,
      true, // createAdjustment
      'NFC_READ'
    );

    expect(result.discrepancy).toBe(-13000n); // 120.000 - 133.000 = -13.000
    expect(result.isMatched).toBe(false);
    expect(finalRecorded).toBe(actualNfcBalance);
    expect(createdTx.type).toBe('EXPENSE');
    expect(createdTx.amount).toBe(13000n);
    expect(createdTx.source).toBe('NFC_READ');
  });

  it('verifies checkNfcSupport handles SSR / environments gracefully without throwing', async () => {
    const status = await checkNfcSupport();
    expect(status).toHaveProperty('isSupported');
    expect(status).toHaveProperty('isAvailable');
  });
});
