'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/lib/formatters';
import { AtsBreakdown } from '@/lib/services/ats-service';
import StitchThreeBackground from '../animation/StitchThreeBackground';

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
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showAtsDetails, setShowAtsDetails] = useState(false);

  const daysRemaining = atsBreakdown?.daysRemainingInMonth || 8;
  const dailySafe = atsBreakdown?.dailySafeToSpend ? Number(atsBreakdown.dailySafeToSpend) : Math.round(availableToSpend / Math.max(1, daysRemaining));

  const displayBalance = isBalanceHidden ? 'Rp ••••••••' : formatRupiah(totalRecordedBalance);
  const displaySafeToday = isBalanceHidden ? 'Rp ••••••' : formatRupiah(dailySafe);

  return (
    <>
      {/* Primary Balance Hero Card (Deep Forest Luxury Aesthetic) */}
      <div className="relative w-full rounded-2xl bg-inverse-surface text-inverse-on-surface p-5 shadow-lg overflow-hidden border border-primary-container/20">
        {/* Subtle ambient emerald radial glow overlay */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary-container/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-primary/25 blur-3xl pointer-events-none" />

        {/* 3D Three.js Fluid Particle Wave Canvas */}
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
          <StitchThreeBackground particleColor={0x7ed8ac} />
        </div>

        <div className="relative z-10 flex flex-col space-y-4">
          {/* Top Metric Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-inverse-on-surface/80">
                Total Saldo Tercatat
              </span>
              <button
                type="button"
                aria-label="Sembunyikan atau tampilkan saldo"
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="flex items-center justify-center text-inverse-on-surface/70 hover:text-inverse-on-surface transition-colors p-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isBalanceHidden ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAtsDetails(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 hover:bg-surface-container-lowest/15 text-primary-fixed text-[11px] font-semibold transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse" />
              <span>{netCashFlow >= 0 ? 'Keuangan Sehat' : 'Perlu Kontrol'}</span>
            </button>
          </div>

          {/* Main Balance Display */}
          <div>
            <div className="text-[28px] font-bold tracking-tight text-surface-container-lowest leading-tight font-sans">
              {displayBalance}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-inverse-on-surface/85">
              <span className="text-[12px] text-surface-variant font-normal">
                Sisa {daysRemaining} hari siklus dompet
              </span>
            </div>
          </div>

          {/* Safe-to-Spend Sub-Card Highlight */}
          <div
            onClick={() => setShowAtsDetails(true)}
            className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest/10 backdrop-blur-md cursor-pointer hover:bg-surface-container-lowest/15 transition-colors border border-surface-container-lowest/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 text-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-surface-variant leading-tight font-medium uppercase tracking-wide">
                  Aman Dibelanjakan Hari Ini
                </span>
                <span className="text-[15px] font-bold text-surface-container-lowest mt-0.5">
                  {displaySafeToday}{' '}
                  <span className="text-surface-variant text-[12px] font-normal">/ hari</span>
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-primary-fixed px-2 py-0.5 rounded-md bg-primary-fixed/10">
              {availableToSpend > 0 ? 'Terkendali' : 'Batas Habis'}
            </span>
          </div>

          {/* Quick Action Buttons Strip Inside Hero */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-surface-container-lowest/10">
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl bg-surface-container-lowest/10 hover:bg-surface-container-lowest/15 text-inverse-on-surface transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] text-primary-fixed">add_circle</span>
              <span className="text-[10px] font-semibold tracking-tight">Catat Cepat</span>
            </button>

            <button
              type="button"
              onClick={onOpenScanReceipt}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl bg-surface-container-lowest/10 hover:bg-surface-container-lowest/15 text-inverse-on-surface transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] text-surface-bright">photo_camera</span>
              <span className="text-[10px] font-semibold tracking-tight">Pindai Struk</span>
            </button>

            <button
              type="button"
              onClick={onOpenTransfer}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl bg-surface-container-lowest/10 hover:bg-surface-container-lowest/15 text-inverse-on-surface transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">swap_horiz</span>
              <span className="text-[10px] font-semibold tracking-tight">Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ATS Breakdown Info Modal */}
      {showAtsDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl p-5 space-y-4 shadow-2xl border-t border-surface-variant max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
                <h3 className="text-[16px] font-bold text-on-surface">Detail Available-To-Spend (ATS)</h3>
              </div>
              <button
                onClick={() => setShowAtsDetails(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              <strong>Available-to-Spend (ATS)</strong> adalah rumus deterministik Rupia untuk menunjukkan uang yang benar-benar bebas dibelanjakan tanpa membahayakan tagihan atau kebutuhan darurat:
            </p>

            <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-[12px] font-mono border border-surface-variant/40">
              <div className="flex justify-between text-on-surface">
                <span>Total Saldo Likuid</span>
                <span className="font-bold">{formatRupiah(totalRecordedBalance)}</span>
              </div>
              <div className="flex justify-between text-error">
                <span>- Kewajiban Rutin Mendatang</span>
                <span>{formatRupiah(atsBreakdown?.upcomingObligations ? Number(atsBreakdown.upcomingObligations) : 0)}</span>
              </div>
              <div className="flex justify-between text-tertiary">
                <span>- Alokasi Anggaran & Target</span>
                <span>{formatRupiah(atsBreakdown?.reservedAllocations ? Number(atsBreakdown.reservedAllocations) : 0)}</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>- Buffer Cadangan Kas Aman</span>
                <span>{formatRupiah(atsBreakdown?.safetyBuffer ? Number(atsBreakdown.safetyBuffer) : 0)}</span>
              </div>
              <div className="border-t border-surface-variant pt-2 flex justify-between font-bold text-[14px] text-primary">
                <span>= Sisa Uang Aman (ATS)</span>
                <span>{formatRupiah(availableToSpend)}</span>
              </div>
            </div>

            <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-3 text-[12px] space-y-1">
              <span className="font-bold text-primary block">Batas Belanja Harian yang Disarankan:</span>
              <p className="text-on-surface-variant">
                <strong>{formatRupiah(dailySafe)} / hari</strong> untuk sisa {daysRemaining} hari di bulan ini.
              </p>
            </div>

            <button
              onClick={() => setShowAtsDetails(false)}
              className="w-full py-2.5 bg-primary-container text-on-primary rounded-xl text-[14px] font-semibold hover:bg-primary transition-colors active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
