import prisma from '../db';

export interface CreateWalletInput {
  name: string;
  type: 'BANK' | 'EWALLET' | 'EMONEY' | 'CASH' | 'SAVINGS' | 'INVESTMENT' | 'OTHER';
  issuer?: string; // MANDIRI, BCA, BRI, BNI, OTHER
  cardLast4?: string;
  accountNo?: string;
  color?: string;
  icon?: string;
  openingBalance: bigint;
  lastBalanceSource?: string;
}

export interface RecordTransactionInput {
  walletId: string;
  categoryId?: string;
  type: 'EXPENSE' | 'INCOME';
  amount: bigint;
  date?: Date;
  description: string;
  merchant?: string;
  notes?: string;
  isEssential?: boolean;
  source?: string; // MANUAL, NFC_READ, OCR_RECEIPT, IMPORT
  receiptId?: string;
  idempotencyKey?: string;
}

export interface ExecuteTransferInput {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: bigint;
  fee?: bigint;
  feeWalletId?: string;
  date?: Date;
  notes?: string;
}

export class LedgerService {
  /**
   * Creates a new wallet with strict integer balance
   */
  static async createWallet(userId: string, input: CreateWalletInput) {
    return prisma.wallet.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        issuer: input.issuer,
        cardLast4: input.cardLast4,
        accountNo: input.accountNo,
        color: input.color || '#10b981',
        icon: input.icon || (input.type === 'EMONEY' ? 'CreditCard' : 'Wallet'),
        openingBalance: input.openingBalance,
        recordedBalance: input.openingBalance,
        lastVerifiedBalance: input.openingBalance,
        lastBalanceSource: input.lastBalanceSource || 'MANUAL',
        lastReconciledAt: new Date(),
      },
    });
  }

  /**
   * Records an Expense or Income transaction atomically.
   * Updates wallet recorded balance in the same transaction.
   */
  static async recordTransaction(userId: string, input: RecordTransactionInput) {
    if (input.amount <= 0n) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Check idempotency if key provided
      if (input.idempotencyKey) {
        const existing = await tx.transaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) {
          return existing;
        }
      }

      // 2. Validate wallet ownership
      const wallet = await tx.wallet.findFirst({
        where: { id: input.walletId, userId, isArchived: false },
      });
      if (!wallet) {
        throw new Error('Wallet not found or archived.');
      }

      // 3. Compute new recorded balance
      const balanceChange = input.type === 'INCOME' ? input.amount : -input.amount;
      const newRecordedBalance = wallet.recordedBalance + balanceChange;

      // 4. Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { recordedBalance: newRecordedBalance },
      });

      // 5. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: input.walletId,
          categoryId: input.categoryId,
          type: input.type,
          amount: input.amount,
          date: input.date || new Date(),
          description: input.description,
          merchant: input.merchant,
          notes: input.notes,
          isEssential: input.isEssential !== undefined ? input.isEssential : true,
          source: input.source || 'MANUAL',
          receiptId: input.receiptId,
          idempotencyKey: input.idempotencyKey,
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'RECORD_TRANSACTION',
          entity: 'Transaction',
          entityId: transaction.id,
          detailsJson: JSON.stringify({
            walletId: input.walletId,
            type: input.type,
            amount: input.amount.toString(),
            balanceAfter: newRecordedBalance.toString(),
          }),
        },
      });

      return transaction;
    });
  }

  /**
   * Executes an atomic transfer between two wallets.
   * Does NOT count towards consumer spending or income.
   * Handles optional transfer fees explicitly without partial state.
   */
  static async executeTransfer(userId: string, input: ExecuteTransferInput) {
    if (input.amount <= 0n) {
      throw new Error('Transfer amount must be greater than zero.');
    }
    if (input.sourceWalletId === input.destinationWalletId) {
      throw new Error('Source and destination wallets must be different.');
    }

    const fee = input.fee || 0n;
    const feeWalletId = input.feeWalletId || input.sourceWalletId;

    return prisma.$transaction(async (tx) => {
      // 1. Fetch & lock/validate wallets
      const source = await tx.wallet.findFirst({
        where: { id: input.sourceWalletId, userId, isArchived: false },
      });
      const destination = await tx.wallet.findFirst({
        where: { id: input.destinationWalletId, userId, isArchived: false },
      });

      if (!source || !destination) {
        throw new Error('Source or destination wallet not found.');
      }

      const feeWallet = fee > 0n && feeWalletId !== source.id
        ? await tx.wallet.findFirst({ where: { id: feeWalletId, userId, isArchived: false } })
        : source;

      if (fee > 0n && !feeWallet) {
        throw new Error('Fee wallet not found.');
      }

      // 2. Create the master Transfer record
      const transfer = await tx.transfer.create({
        data: {
          userId,
          sourceWalletId: source.id,
          destinationWalletId: destination.id,
          amount: input.amount,
          fee,
          feeWalletId: feeWallet ? feeWallet.id : null,
          date: input.date || new Date(),
          notes: input.notes,
        },
      });

      // 3. Update source wallet balance
      const newSourceBalance = source.recordedBalance - input.amount;
      await tx.wallet.update({
        where: { id: source.id },
        data: { recordedBalance: newSourceBalance },
      });

      // 4. Update destination wallet balance
      const newDestBalance = destination.recordedBalance + input.amount;
      await tx.wallet.update({
        where: { id: destination.id },
        data: { recordedBalance: newDestBalance },
      });

      // 5. Create source transaction record (TRANSFER out)
      await tx.transaction.create({
        data: {
          userId,
          walletId: source.id,
          type: 'TRANSFER',
          amount: input.amount,
          date: input.date || new Date(),
          description: `Transfer ke ${destination.name}`,
          notes: input.notes,
          transferId: transfer.id,
        },
      });

      // 6. Create destination transaction record (TRANSFER in)
      await tx.transaction.create({
        data: {
          userId,
          walletId: destination.id,
          type: 'TRANSFER',
          amount: input.amount,
          date: input.date || new Date(),
          description: `Transfer dari ${source.name}`,
          notes: input.notes,
          transferId: transfer.id,
        },
      });

      // 7. Handle fee deduction if applicable
      if (fee > 0n && feeWallet) {
        const newFeeBalance = (feeWallet.id === source.id ? newSourceBalance : feeWallet.recordedBalance) - fee;
        await tx.wallet.update({
          where: { id: feeWallet.id },
          data: { recordedBalance: newFeeBalance },
        });

        await tx.transaction.create({
          data: {
            userId,
            walletId: feeWallet.id,
            type: 'EXPENSE',
            amount: fee,
            date: input.date || new Date(),
            description: `Biaya Transfer ke ${destination.name}`,
            notes: `Biaya transaksi transfer ID: ${transfer.id}`,
            transferId: transfer.id,
          },
        });
      }

      // 8. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'EXECUTE_TRANSFER',
          entity: 'Transfer',
          entityId: transfer.id,
          detailsJson: JSON.stringify({
            source: source.name,
            destination: destination.name,
            amount: input.amount.toString(),
            fee: fee.toString(),
          }),
        },
      });

      return transfer;
    });
  }

  /**
   * Reconciles a wallet balance against the user's actual verified balance.
   * Never silently overwrites data. Calculates discrepancy and logs audit.
   */
  static async reconcileWallet(
    userId: string,
    walletId: string,
    actualBalance: bigint,
    createAdjustment = false,
    source: string = 'MANUAL'
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: walletId, userId },
      });
      if (!wallet) throw new Error('Wallet not found.');

      const discrepancy = actualBalance - wallet.recordedBalance;

      // Update verification metadata & source
      let updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          lastVerifiedBalance: actualBalance,
          lastBalanceSource: source,
          lastReconciledAt: new Date(),
        },
      });

      // If user explicitly asks to create an adjustment transaction to match actual balance
      if (createAdjustment && discrepancy !== 0n) {
        const isIncome = discrepancy > 0n;
        const absDiff = isIncome ? discrepancy : -discrepancy;

        await tx.transaction.create({
          data: {
            userId,
            walletId,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            amount: absDiff,
            date: new Date(),
            description: `Penyesuaian Saldo (${source === 'NFC_READ' ? 'NFC' : 'Manual'}) (${discrepancy > 0n ? '+' : '-'}${absDiff.toString()})`,
            notes: `Penyesuaian saldo sistem dengan saldo fisik aktual (${source}). Saldo sebelumnya: ${wallet.recordedBalance}`,
            source,
            isVerified: true,
          },
        });

        updatedWallet = await tx.wallet.update({
          where: { id: walletId },
          data: { recordedBalance: actualBalance },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'RECONCILE_WALLET',
          entity: 'Wallet',
          entityId: walletId,
          detailsJson: JSON.stringify({
            recordedBalance: wallet.recordedBalance.toString(),
            actualBalance: actualBalance.toString(),
            discrepancy: discrepancy.toString(),
            adjustmentCreated: createAdjustment,
          }),
        },
      });

      return {
        wallet: updatedWallet,
        discrepancy,
        isMatched: discrepancy === 0n,
      };
    });
  }

  /**
   * Voids an existing transaction safely, reversing its balance impact.
   */
  static async voidTransaction(userId: string, transactionId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, userId, isVoided: false },
        include: { wallet: true },
      });

      if (!transaction) throw new Error('Transaction not found or already voided.');
      if (transaction.transferId) {
        throw new Error('Transfers cannot be voided directly; void the entire transfer instead.');
      }

      // Reversal: if expense, add back to wallet; if income, deduct from wallet
      const balanceReversal = transaction.type === 'EXPENSE' ? transaction.amount : -transaction.amount;
      const newWalletBalance = transaction.wallet.recordedBalance + balanceReversal;

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { recordedBalance: newWalletBalance },
      });

      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          isVoided: true,
          voidReason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VOID_TRANSACTION',
          entity: 'Transaction',
          entityId: transactionId,
          detailsJson: JSON.stringify({
            originalAmount: transaction.amount.toString(),
            type: transaction.type,
            reason,
            walletBalanceAfter: newWalletBalance.toString(),
          }),
        },
      });

      return updated;
    });
  }
}

