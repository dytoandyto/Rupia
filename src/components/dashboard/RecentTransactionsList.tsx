'use client';

import React from 'react';
import Link from 'next/link';
import { formatRupiah, formatRelativeDateIndo, formatTimeIndo } from '@/lib/formatters';

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
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-on-surface">Transaksi Terkini</h2>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm text-center border border-surface-variant/30">
          <span className="material-symbols-outlined text-[32px] text-outline mb-2">receipt_long</span>
          <h4 className="text-[14px] font-bold text-on-surface">Belum Ada Transaksi</h4>
          <p className="text-[12px] text-on-surface-variant mt-1">
            Mulai catat transaksi pertamamu dengan tombol (+) di bawah.
          </p>
        </div>
      </div>
    );
  }

  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  const getTransactionVisuals = (tx: TransactionItem) => {
    const isIncome = tx.type === 'INCOME';
    const isTransfer = tx.type === 'TRANSFER';
    const text = (tx.merchant || tx.description || '').toLowerCase();
    const catName = (tx.category?.name || '').toLowerCase();

    let iconName = 'receipt';
    let iconBg = 'bg-surface-container text-primary';

    if (isIncome) {
      iconName = 'payments';
      iconBg = 'bg-primary-fixed/40 text-primary-container';
    } else if (isTransfer) {
      iconName = 'swap_horiz';
      iconBg = 'bg-surface-container text-secondary';
    } else if (text.includes('kopi') || catName.includes('kopi') || text.includes('cafe')) {
      iconName = 'local_cafe';
      iconBg = 'bg-tertiary-fixed/30 text-tertiary';
    } else if (text.includes('mrt') || text.includes('krl') || text.includes('gojek') || catName.includes('transport')) {
      iconName = 'subway';
      iconBg = 'bg-surface-container text-secondary';
    } else if (text.includes('makan') || text.includes('warteg') || catName.includes('makan')) {
      iconName = 'restaurant';
      iconBg = 'bg-surface-container text-primary';
    }

    return { iconName, iconBg, isIncome, isTransfer };
  };

  return (
    <div className="flex flex-col space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-on-surface">Transaksi Terkini</h2>
        <span className="text-[10px] text-outline font-semibold uppercase tracking-wider">
          {currentMonthName}
        </span>
      </div>

      {/* List Container */}
      <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-2 divide-y divide-surface-container/60 border border-surface-variant/30">
        {transactions.map((tx) => {
          const { iconName, iconBg, isIncome, isTransfer } = getTransactionVisuals(tx);
          const formattedAmount = isIncome
            ? `+${formatRupiah(tx.amount)}`
            : isTransfer
            ? formatRupiah(tx.amount)
            : `-${formatRupiah(tx.amount)}`;

          const dateStr = formatRelativeDateIndo(new Date(tx.date));
          const timeStr = formatTimeIndo(new Date(tx.date));

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2.5 hover:bg-surface-container/40 rounded-xl transition-colors cursor-pointer group"
            >
              {/* Left Column: Icon & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-semibold text-on-surface truncate">
                    {tx.merchant || tx.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium text-on-surface-variant">
                      {tx.wallet.name}
                    </span>
                    <span className="text-outline text-[10px]">•</span>
                    <span className="text-[11px] text-outline">
                      {dateStr} {timeStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Tag */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span
                  className={`text-[15px] font-bold ${
                    isIncome ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {formattedAmount}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium ${
                    isIncome
                      ? 'bg-primary-fixed/20 text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {tx.category?.name || (isTransfer ? 'Transfer' : 'Umum')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* See All Button */}
      <Link
        href="/transaksi"
        className="w-full py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99] border border-surface-variant/20"
      >
        <span>Lihat Semua {totalCount > 0 ? `${totalCount} ` : ''}Transaksi</span>
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </Link>
    </div>
  );
}
