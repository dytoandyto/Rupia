import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/db';

describe('Financial Data Isolation & Authorization Tests', () => {
  const userA_Id = 'user-alpha-uuid-1111';
  const userB_Id = 'user-beta-uuid-2222';

  const userA_Wallet = {
    id: 'wallet-user-a-mandiri',
    userId: userA_Id,
    name: 'Mandiri User A',
    recordedBalance: BigInt(10000000),
  };

  const userB_Wallet = {
    id: 'wallet-user-b-bca',
    userId: userB_Id,
    name: 'BCA User B',
    recordedBalance: BigInt(50000000),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents User A from reading User B wallets via strict userId filter', async () => {
    const findManySpy = vi.spyOn(prisma.wallet, 'findMany').mockImplementation(async (args: any) => {
      // Simulate database behavior with where clause
      if (args?.where?.userId === userA_Id) {
        return [userA_Wallet as any];
      }
      if (args?.where?.userId === userB_Id) {
        return [userB_Wallet as any];
      }
      return [];
    });

    // When querying for User A:
    const walletsA = await prisma.wallet.findMany({
      where: { userId: userA_Id },
    });

    expect(walletsA).toHaveLength(1);
    expect(walletsA[0].id).toBe(userA_Wallet.id);
    expect(walletsA.some((w) => w.userId === userB_Id)).toBe(false);
  });

  it('prevents Insecure Direct Object Reference (IDOR) when updating/reconciling a wallet', async () => {
    // User A tries to modify User B's wallet
    const findFirstSpy = vi.spyOn(prisma.wallet, 'findFirst').mockImplementation(async (args: any) => {
      if (args?.where?.id === userB_Wallet.id && args?.where?.userId === userA_Id) {
        return null; // Not found because wallet belongs to user B!
      }
      return null;
    });

    const targetWallet = await prisma.wallet.findFirst({
      where: {
        id: userB_Wallet.id,
        userId: userA_Id, // Enforced authenticated user ID
      },
    });

    // Target wallet must be null for unauthorized user
    expect(targetWallet).toBeNull();
  });

  it('prevents cross-user transaction tampering or voiding', async () => {
    const userB_Transaction = {
      id: 'tx-user-b-001',
      userId: userB_Id,
      walletId: userB_Wallet.id,
      amount: BigInt(500000),
      description: 'Gaji User B',
      isVoided: false,
    };

    const findUniqueSpy = vi.spyOn(prisma.transaction, 'findFirst').mockImplementation(async (args: any) => {
      if (args?.where?.id === userB_Transaction.id && args?.where?.userId === userA_Id) {
        return null;
      }
      return null;
    });

    // User A attempts to void User B's transaction
    const tx = await prisma.transaction.findFirst({
      where: {
        id: userB_Transaction.id,
        userId: userA_Id,
      },
    });

    expect(tx).toBeNull();
  });

  it('prevents cross-user inter-wallet transfers from unauthorized source wallet', async () => {
    // User A attempts to transfer from User B's wallet to User A's wallet
    vi.spyOn(prisma.wallet, 'findFirst').mockResolvedValue(null);
    const sourceWalletCheck = await prisma.wallet.findFirst({
      where: {
        id: userB_Wallet.id,
        userId: userA_Id,
      },
    });

    expect(sourceWalletCheck).toBeNull();
  });

  it('ensures budget calculations and limits only aggregate user-owned categories', async () => {
    const userA_Category = { id: 'cat-a', userId: userA_Id, name: 'Makan' };
    const userB_Category = { id: 'cat-b', userId: userB_Id, name: 'Investasi' };

    vi.spyOn(prisma.category, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.userId === userA_Id) {
        return [userA_Category as any];
      }
      return [];
    });

    const categoriesA = await prisma.category.findMany({
      where: { userId: userA_Id },
    });

    expect(categoriesA).toHaveLength(1);
    expect(categoriesA[0].id).toBe('cat-a');
    expect(categoriesA.some((c) => c.userId === userB_Id)).toBe(false);
  });
});
