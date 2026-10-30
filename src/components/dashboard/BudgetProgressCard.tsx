'use client';

import React from 'react';
import Link from 'next/link';
import {
  PieChart,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { BudgetSummary } from '@/lib/services/budget-service';
import { useBalancePrivacy } from '@/lib/privacy-context';

interface BudgetProgressCardProps {
  budget: BudgetSummary | null;
}

export default function BudgetProgressCard({ budget }: BudgetProgressCardProps) {
  const { isBalanceHidden } = useBalancePrivacy();

  if (!budget || !budget.categories || budget.categories.length === 0) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Status Anggaran Aktif</h2>
        </div>
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs text-center">
          <div className="w-10 h-10 rounded-full bg-surface-container mx-auto flex items-center justify-center text-text-secondary mb-2">
            <PieChart className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-text-primary">Belum Ada Pos Anggaran</h4>
          <p className="text-[11px] text-text-secondary mt-1 mb-3">
            Tentukan alokasi batas belanja per kategori untuk mencegah pemborosan.
          </p>
          <Link
            href="/anggaran"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Atur Anggaran Bulanan</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalSpent = budget.totalSpent || 0;
  const totalLimit = budget.totalLimit || 1;
  const overallPercent = Math.min(100, Math.round((totalSpent / totalLimit) * 100));
  const remaining = Math.max(0, totalLimit - totalSpent);

  return (
    <div className="flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">Status Anggaran Aktif</h2>
          <span className="text-[11px] text-text-secondary font-medium">
            (Bulan Ini)
          </span>
        </div>
        <Link
          href="/anggaran"
          className="text-xs font-medium text-primary hover:text-primary-dark inline-flex items-center gap-0.5 transition-colors"
        >
          <span>Kelola Pos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Budget Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
        {/* Overall Limit Summary */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <span className="text-[11px] text-text-secondary uppercase tracking-wider block">
              Sisa Batas Belanja
            </span>
            <span className="text-lg font-bold text-text-primary tabular-nums">
              {formatRupiah(remaining, isBalanceHidden)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-text-secondary uppercase tracking-wider block">
              Penggunaan
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                overallPercent >= 90
                  ? 'text-negative'
                  : overallPercent >= 75
                  ? 'text-attention'
                  : 'text-positive'
              }`}
            >
              {overallPercent}% ({formatRupiah(totalSpent, isBalanceHidden)})
            </span>
          </div>
        </div>

        {/* Category Breakdown (Up to 4 Categories) */}
        <div className="space-y-3">
          {budget.categories.slice(0, 4).map((item) => {
            const isCaution = item.status === 'CAUTION' || item.status === 'LIMIT_REACHED';
            const isOverbudget = item.status === 'OVERBUDGET';
            const fillPercent = Math.min(100, item.percentageUsed);

            return (
              <div key={item.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary truncate max-w-[160px] sm:max-w-[200px]">
                    {item.categoryName}
                  </span>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-text-secondary text-[11px]">
                      {formatRupiah(item.currentSpent, isBalanceHidden)} / {formatRupiah(item.allocatedAmount, isBalanceHidden)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isOverbudget
                          ? 'bg-error-container text-negative'
                          : isCaution
                          ? 'bg-tertiary-container text-attention'
                          : 'text-text-secondary'
                      }`}
                    >
                      {item.percentageUsed}%
                    </span>
                  </div>
                </div>

                {/* Restrained Progress Bar */}
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverbudget
                        ? 'bg-negative'
                        : isCaution
                        ? 'bg-attention'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
