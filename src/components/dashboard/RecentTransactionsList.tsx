'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah, formatRelativeDateIndo, formatTimeIndo } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  merchant?: string | null;
  wallet: { name: string };
  category?: { name: string; color: string; icon: string } | null;
}

interface RecentTransactionsListProps {
  transactions: TransactionItem[];
  totalCount?: number;
}

export default function RecentTransactionsList({
  transactions,
  totalCount = 0,
}: RecentTransactionsListProps) {
  const { isBalanceHidden } = useBalancePrivacy();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Transaksi Terkini</h2>
        </div>
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs text-center">
          <div className="w-10 h-10 rounded-full bg-surface-container mx-auto flex items-center justify-center text-text-secondary mb-2">
            <Receipt className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-text-primary">Belum Ada Transaksi Tercatat</h4>
          <p className="text-[11px] text-text-secondary mt-1">
            Gunakan tombol (+) Catat Transaksi untuk mulai melacak arus kasmu.
          </p>
        </div>
      </div>
    );
  }

  const getIcon = (tx: TransactionItem) => {
    const text = (tx.merchant || tx.description || '').toLowerCase();
    const catName = (tx.category?.name || '').toLowerCase();

    if (tx.type === 'INCOME') return <ArrowDownLeft className="w-4 h-4 text-positive" />;
    if (tx.type === 'TRANSFER') return <ArrowRightLeft className="w-4 h-4 text-attention" />;
    if (text.includes('kopi') || catName.includes('kopi') || text.includes('cafe'))
      return <Coffee className="w-4 h-4 text-text-secondary" />;
    if (text.includes('tol') || text.includes('parkir') || catName.includes('transport') || text.includes('gojek'))
      return <Car className="w-4 h-4 text-text-secondary" />;
    if (text.includes('makan') || text.includes('warteg') || catName.includes('makan'))
      return <Utensils className="w-4 h-4 text-text-secondary" />;
    return <ShoppingBag className="w-4 h-4 text-text-secondary" />;
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Transaksi Terkini</h2>
          <span className="text-[11px] text-text-secondary font-medium">
            (5 Terakhir)
          </span>
        </div>
        <Link
          href="/transaksi"
          className="text-xs font-medium text-primary hover:text-primary-dark inline-flex items-center gap-0.5 transition-colors"
        >
          <span>Semua Riwayat</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Refined Pese-style Transaction Rows Container */}
      <div className="rounded-2xl bg-surface-card border border-border-subtle shadow-xs divide-y divide-border-subtle/70 overflow-hidden">
        {transactions.map((tx) => {
          const isIncome = tx.type === 'INCOME';
          const isTransfer = tx.type === 'TRANSFER';

          const formattedAmount = isIncome
            ? `+${formatRupiah(tx.amount, isBalanceHidden)}`
            : isTransfer
            ? formatRupiah(tx.amount, isBalanceHidden)
            : `-${formatRupiah(tx.amount, isBalanceHidden)}`;

          const dateStr = formatRelativeDateIndo(new Date(tx.date));
          const timeStr = formatTimeIndo(new Date(tx.date));

          return (
            <Link
              key={tx.id}
              href="/transaksi"
              className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-surface-container-low transition-colors group"
            >
              {/* Left Column: Category Icon + Description + Metadata */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-border-subtle/60 group-hover:bg-white transition-colors">
                  {getIcon(tx)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {tx.merchant || tx.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-text-secondary">
                    <span className="font-medium truncate max-w-[100px] sm:max-w-none">
                      {tx.wallet.name}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{dateStr}, {timeStr}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Tabular Amount + Category Badge */}
              <div className="flex flex-col items-end shrink-0 pl-3">
                <span
                  className={`text-xs font-semibold tabular-nums tracking-tight ${
                    isIncome
                      ? 'text-positive'
                      : isTransfer
                      ? 'text-text-primary'
                      : 'text-text-primary'
                  }`}
                >
                  {formattedAmount}
                </span>
                <span className="text-[10px] font-medium text-text-secondary px-2 py-0.5 rounded-md bg-surface-container mt-1 border border-border-subtle/50">
                  {tx.category?.name || (isTransfer ? 'Transfer' : 'Pengeluaran')}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
