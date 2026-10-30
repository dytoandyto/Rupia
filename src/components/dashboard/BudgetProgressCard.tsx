'use client';

import React from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/formatters';
import { BudgetSummary } from '@/lib/services/budget-service';

interface BudgetProgressCardProps {
  budget: BudgetSummary | null;
}

export default function BudgetProgressCard({ budget }: BudgetProgressCardProps) {
  if (!budget || !budget.categories || budget.categories.length === 0) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[16px] font-bold text-on-surface">Status Anggaran Aktif</h2>
            <span className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <Link href="/anggaran" className="text-[12px] font-semibold text-primary hover:underline">
            Buat
          </Link>
        </div>
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm text-center border border-surface-variant/30">
          <span className="material-symbols-outlined text-[32px] text-outline mb-2">pie_chart</span>
          <h4 className="text-[14px] font-bold text-on-surface">Belum Ada Anggaran Aktif</h4>
          <p className="text-[12px] text-on-surface-variant mt-1 mb-3">
            Atur batas belanja bulanan untuk menjaga sisa uang amanmu.
          </p>
          <Link
            href="/anggaran"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-container bg-primary-container/10 px-4 py-2 rounded-xl hover:bg-primary-container/20 transition-colors"
          >
            Atur Anggaran Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[16px] font-bold text-on-surface">Status Anggaran Aktif</h2>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <Link href="/anggaran" className="text-[12px] font-semibold text-primary hover:underline">
          Lihat Semua
        </Link>
      </div>

      {/* Main Budget Card */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col space-y-4 border border-surface-variant/30">
        {budget.categories.slice(0, 4).map((item) => {
          const isCaution = item.status === 'CAUTION' || item.status === 'LIMIT_REACHED';
          const isOverbudget = item.status === 'OVERBUDGET';

          let iconName = 'payments';
          if (item.categoryName.toLowerCase().includes('makan') || item.categoryName.toLowerCase().includes('food')) {
            iconName = 'lunch_dining';
          } else if (item.categoryName.toLowerCase().includes('kopi') || item.categoryName.toLowerCase().includes('cafe') || item.categoryName.toLowerCase().includes('hangout')) {
            iconName = 'local_cafe';
          } else if (item.categoryName.toLowerCase().includes('transport') || item.categoryName.toLowerCase().includes('gojek') || item.categoryName.toLowerCase().includes('bensin')) {
            iconName = 'directions_subway';
          } else if (item.categoryName.toLowerCase().includes('edukasi') || item.categoryName.toLowerCase().includes('buku') || item.categoryName.toLowerCase().includes('kursus')) {
            iconName = 'menu_book';
          }

          const fillPercent = Math.min(100, item.percentageUsed);

          return (
            <div key={item.categoryId} className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isOverbudget
                        ? 'bg-error-container text-error'
                        : isCaution
                        ? 'bg-tertiary-fixed/40 text-tertiary'
                        : 'bg-surface-container text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{iconName}</span>
                  </span>
                  <span className="text-[14px] font-semibold text-on-surface truncate max-w-[170px]">
                    {item.categoryName}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isOverbudget
                      ? 'text-error'
                      : isCaution
                      ? 'text-tertiary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {item.percentageUsed}% {isOverbudget ? '(Overbudget)' : isCaution ? '(Hampir Habis)' : ''}
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverbudget
                      ? 'bg-error'
                      : isCaution
                      ? 'bg-tertiary-container'
                      : 'bg-primary-container'
                  }`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>

              {/* Amount Metrics */}
              <div className="flex items-center justify-between text-[12px] text-on-surface-variant">
                <span className={isOverbudget ? 'text-error font-semibold' : ''}>
                  {formatRupiah(item.currentSpent)} dipakai
                </span>
                <span className="text-outline text-[11px]">
                  Batas: {formatRupiah(item.allocatedAmount)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Bottom Link Action */}
        <Link
          href="/anggaran"
          className="w-full pt-2 flex items-center justify-center gap-1 text-[12px] text-primary font-semibold hover:underline"
        >
          <span>Kelola Semua Anggaran</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
