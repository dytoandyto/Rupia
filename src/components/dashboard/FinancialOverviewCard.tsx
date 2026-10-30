'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Plus,
  Camera,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  X,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { AtsBreakdown } from '@/lib/services/ats-service';
import { useBalancePrivacy } from '@/lib/privacy-context';

interface FinancialOverviewCardProps {
  totalRecordedBalance: number;
  availableToSpend: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  netCashFlow: number;
  atsBreakdown: AtsBreakdown;
  onOpenQuickAdd?: () => void;
  onOpenScanReceipt?: () => void;
  onOpenTransfer?: () => void;
}

export default function FinancialOverviewCard({
  totalRecordedBalance,
  availableToSpend,
  incomeThisMonth,
  expensesThisMonth,
  netCashFlow,
  atsBreakdown,
  onOpenQuickAdd,
  onOpenScanReceipt,
  onOpenTransfer,
}: FinancialOverviewCardProps) {
  const { isBalanceHidden, toggleBalanceHidden } = useBalancePrivacy();
  const [showAtsDetails, setShowAtsDetails] = useState(false);

  const daysRemaining = atsBreakdown?.daysRemainingInMonth || 8;
  const dailySafe = atsBreakdown?.dailySafeToSpend
    ? Number(atsBreakdown.dailySafeToSpend)
    : Math.round(availableToSpend / Math.max(1, daysRemaining));

  const displayBalance = formatRupiah(totalRecordedBalance, isBalanceHidden);
  const displaySafeToday = formatRupiah(dailySafe, isBalanceHidden);
  const displayIncome = formatRupiah(incomeThisMonth, isBalanceHidden);
  const displayExpense = formatRupiah(expensesThisMonth, isBalanceHidden);

  return (
    <>
      {/* Matte Banking Dark Surface Card (Inspired by Upocket & Pese) */}
      <div className="relative w-full rounded-2xl bg-card-dark text-white p-5 sm:p-6 shadow-sm border border-white/10 overflow-hidden">
        <div className="flex flex-col space-y-5">
          {/* 1. Header: Label + Privacy + Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
                Total Aset Tercatat
              </span>
              <button
                type="button"
                onClick={toggleBalanceHidden}
                title={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                className="p-1 rounded text-white/60 hover:text-white transition-colors"
              >
                {isBalanceHidden ? (
                  <EyeOff className="w-3.5 h-3.5 text-attention" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAtsDetails(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white/90 border border-white/10 transition-colors"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  netCashFlow >= 0 ? 'bg-positive' : 'bg-attention'
                }`}
              />
              <span>{netCashFlow >= 0 ? 'Arus Kas Positif' : 'Perlu Kontrol'}</span>
            </button>
          </div>

          {/* 2. Main Balance Metric */}
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums leading-none">
              {displayBalance}
            </div>
            <p className="text-xs text-white/60 mt-1.5">
              Konsolidasi saldo seluruh rekening bank, e-wallet, e-money, dan kas tunai.
            </p>
          </div>

          {/* 3. Available-to-Spend Sub-Card (Crucial Fintech Decision Metric) */}
          <div
            onClick={() => setShowAtsDetails(true)}
            className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 text-white flex items-center justify-center shrink-0 border border-primary/30">
                <ShieldCheck className="w-5 h-5 text-[#34D399]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/70 uppercase tracking-wider">
                  Sisa Aman Dibelanjakan Hari Ini
                </span>
                <span className="text-base font-semibold text-white tabular-nums mt-0.5">
                  {displaySafeToday}
                  <span className="text-xs font-normal text-white/60 ml-1">/ hari</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-white/70 block">
                Sisa {daysRemaining} hari
              </span>
              <span className="text-[10px] text-[#34D399] font-medium inline-flex items-center gap-0.5">
                Detail <Info className="w-2.5 h-2.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* 4. Monthly Inflow vs Outflow Mini-Strip */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-positive">
                <ArrowDownLeft className="w-4 h-4 text-[#34D399]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/60 uppercase">Pemasukan Bulan Ini</span>
                <span className="text-xs font-semibold text-white tabular-nums truncate">
                  {displayIncome}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-negative">
                <ArrowUpRight className="w-4 h-4 text-[#F87171]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/60 uppercase">Pengeluaran Bulan Ini</span>
                <span className="text-xs font-semibold text-white tabular-nums truncate">
                  {displayExpense}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Clean Action Buttons Strip */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Catat</span>
            </button>

            <button
              type="button"
              onClick={onOpenScanReceipt}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>Struk</span>
            </button>

            <button
              type="button"
              onClick={onOpenTransfer}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-attention" />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available-to-Spend Breakdown Sheet/Modal */}
      {showAtsDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-surface-card p-6 border border-border-subtle shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">
                  Kalkulasi Sisa Aman Belanja
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAtsDetails(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-secondary">Total Saldo Likuid</span>
                <span className="font-semibold tabular-nums text-text-primary">
                  {displayBalance}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/50 text-negative">
                <span className="text-text-secondary">Komitmen Tagihan Terjadwal</span>
                <span className="font-semibold tabular-nums">
                  -{formatRupiah(atsBreakdown?.upcomingObligations || 0, isBalanceHidden)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/50 text-attention">
                <span className="text-text-secondary">Alokasi Cadangan & Tabungan</span>
                <span className="font-semibold tabular-nums">
                  -{formatRupiah(atsBreakdown?.reservedAllocations || 0, isBalanceHidden)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 bg-surface-container-low px-2 rounded-lg font-bold text-primary">
                <span>Total Dana Bebas (Bulan Ini)</span>
                <span className="tabular-nums">
                  {formatRupiah(availableToSpend, isBalanceHidden)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-text-secondary">
                <span>Sisa Hari Menuju Gajian</span>
                <span className="font-semibold text-text-primary">{daysRemaining} hari</span>
              </div>
              <div className="p-3 bg-primary-light rounded-xl text-primary font-medium leading-relaxed">
                Kamu dapat membelanjakan maksimal{' '}
                <strong className="font-bold">{displaySafeToday}</strong> per hari untuk menjaga
                rencana tabungan dan tagihan tetap aman sampai akhir bulan.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAtsDetails(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-medium text-xs hover:bg-primary-dark transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
