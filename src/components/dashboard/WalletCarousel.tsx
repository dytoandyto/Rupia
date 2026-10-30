'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/formatters';

interface WalletItem {
  id: string;
  name: string;
  type: string;
  accountNo?: string;
  color: string;
  icon: string;
  recordedBalance: number;
  lastVerifiedBalance?: number | null;
  lastReconciledAt?: string | null;
}

interface WalletCarouselProps {
  wallets: WalletItem[];
  onWalletReconciled: () => void;
}

export default function WalletCarousel({ wallets, onWalletReconciled }: WalletCarouselProps) {
  const [reconcilingWallet, setReconcilingWallet] = useState<WalletItem | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [createAdjustment, setCreateAdjustment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getWalletBadge = (w: WalletItem) => {
    switch (w.type) {
      case 'BANK':
        return {
          icon: 'account_balance',
          initials: w.name.includes('Mandiri') ? 'BM' : w.name.includes('BCA') ? 'BCA' : 'BK',
          tag: 'Utama',
          subtext: 'Sinkron 1j lalu',
          iconBg: 'bg-surface-container-high text-primary',
          tagClass: 'text-on-surface-variant',
        };
      case 'EWALLET':
        return {
          icon: 'account_balance_wallet',
          initials: 'E-W',
          tag: 'Aktif',
          subtext: 'Dompet Harian',
          iconBg: 'bg-primary-container/15 text-primary-container',
          tagClass: 'text-primary font-semibold',
        };
      case 'CASH':
        return {
          icon: 'payments',
          initials: 'CASH',
          tag: 'Manual',
          subtext: 'Fisik di Dompet',
          iconBg: 'bg-surface-container text-secondary',
          tagClass: 'text-on-surface-variant',
        };
      case 'INVESTMENT':
        return {
          icon: 'trending_up',
          initials: 'INV',
          tag: 'Investasi',
          subtext: 'Tabungan & Reksadana',
          iconBg: 'bg-tertiary-fixed/30 text-tertiary',
          tagClass: 'text-tertiary font-semibold',
        };
      default:
        return {
          icon: 'wallet',
          initials: 'W',
          tag: 'Dompet',
          subtext: 'Rekening Tambahan',
          iconBg: 'bg-surface-container text-primary',
          tagClass: 'text-on-surface-variant',
        };
    }
  };

  const handleReconcileSubmit = async () => {
    if (!reconcilingWallet) return;
    const actual = parseInt(actualBalanceInput.replace(/[^0-9]/g, ''), 10) || 0;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wallets/${reconcilingWallet.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualBalance: actual,
          createAdjustment,
        }),
      });

      if (res.ok) {
        setReconcilingWallet(null);
        setActualBalanceInput('');
        onWalletReconciled();
      }
    } catch (err) {
      console.error('[RECONCILE SUBMIT ERROR]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-on-surface">Dompet &amp; Rekening</h2>
        <Link
          href="/dompet"
          className="text-[12px] font-semibold text-primary hover:underline transition-all"
        >
          Kelola ({wallets.length})
        </Link>
      </div>

      {/* Horizontal Swipe Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-margin px-margin scrollbar-none snap-x snap-mandatory">
        {wallets.map((w) => {
          const badge = getWalletBadge(w);

          return (
            <div
              key={w.id}
              onClick={() => {
                setReconcilingWallet(w);
                setActualBalanceInput(String(w.recordedBalance));
              }}
              className="min-w-[190px] p-3.5 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between shrink-0 snap-start border border-surface-variant/30 hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg ${badge.iconBg} flex items-center justify-center font-bold text-xs`}
                >
                  {w.type === 'BANK' ? (
                    badge.initials
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      {badge.icon}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${badge.tagClass}`}>{badge.tag}</span>
              </div>

              {/* Bottom Info */}
              <div>
                <span className="text-[12px] text-on-surface-variant block truncate">
                  {w.name}
                </span>
                <span className="text-[15px] font-bold text-on-surface block mt-0.5">
                  {formatRupiah(w.recordedBalance)}
                </span>
                <span className="text-[10px] text-outline block mt-1">
                  {badge.subtext}
                </span>
              </div>
            </div>
          );
        })}

        {/* Add Account Button Tile */}
        <Link
          href="/dompet"
          className="min-w-[130px] p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container text-primary flex flex-col items-center justify-center gap-2 shrink-0 snap-start transition-colors border border-dashed border-primary/30"
        >
          <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </div>
          <span className="text-[10px] font-semibold text-primary">Tambah Akun</span>
        </Link>
      </div>

      {/* Balance Reconciliation Modal */}
      {reconcilingWallet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl p-5 space-y-4 shadow-2xl border-t border-surface-variant">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-on-surface">Rekonsiliasi Saldo</h3>
                <p className="text-[12px] text-on-surface-variant">{reconcilingWallet.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setReconcilingWallet(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 text-[12px] space-y-1.5 border border-surface-variant/40">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Saldo Tercatat Rupia:</span>
                <strong className="font-mono text-on-surface">
                  {formatRupiah(reconcilingWallet.recordedBalance)}
                </strong>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-on-surface block mb-1">
                Saldo Riil Fisik / Mutasi Bank Saat Ini (Rp):
              </label>
              <input
                type="text"
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                placeholder="Misal 8.450.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline/40 text-[16px] font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>

            {(() => {
              const actual = parseInt(actualBalanceInput.replace(/[^0-9]/g, ''), 10) || 0;
              const diff = actual - reconcilingWallet.recordedBalance;

              if (diff !== 0 && actualBalanceInput !== '') {
                return (
                  <div
                    className={`p-3 rounded-xl text-[12px] space-y-2 ${
                      diff < 0
                        ? 'bg-error-container/40 text-on-error-container border border-error/30'
                        : 'bg-primary-container/15 text-primary border border-primary/30'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Selisih Rekonsiliasi:</span>
                      <span>{formatRupiah(Math.abs(diff))} ({diff < 0 ? 'Defisit' : 'Surplus'})</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={createAdjustment}
                        onChange={(e) => setCreateAdjustment(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-[11px] font-medium leading-tight">
                        Buat transaksi penyesuaian otomatis agar saldo sinkron
                      </span>
                    </label>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconcilingWallet(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline/40 text-[14px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReconcileSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-primary-container text-on-primary text-[14px] font-semibold hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Saldo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
