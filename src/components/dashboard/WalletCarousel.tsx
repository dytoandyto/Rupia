'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Smartphone,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

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
  issuer?: string | null;
}

interface WalletCarouselProps {
  wallets: WalletItem[];
  onWalletReconciled: () => void;
}

export default function WalletCarousel({ wallets, onWalletReconciled }: WalletCarouselProps) {
  const { isBalanceHidden } = useBalancePrivacy();
  const [reconcilingWallet, setReconcilingWallet] = useState<WalletItem | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [createAdjustment, setCreateAdjustment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getWalletVisual = (w: WalletItem) => {
    switch (w.type) {
      case 'BANK':
        return {
          icon: Landmark,
          tag: 'Bank',
          badgeClass: 'bg-primary-light text-primary border-primary/20',
          issuerText: w.accountNo ? `•••• ${w.accountNo.slice(-4)}` : 'Rekening Utama',
        };
      case 'EWALLET':
        return {
          icon: Smartphone,
          tag: 'E-Wallet',
          badgeClass: 'bg-surface-container text-text-primary border-border-subtle',
          issuerText: 'Dompet Digital',
        };
      case 'EMONEY':
        return {
          icon: CreditCard,
          tag: 'E-Money',
          badgeClass: 'bg-[#EBF5FB] text-[#2471A3] border-[#AED6F1]',
          issuerText: w.issuer || 'Kartu Prabayar',
        };
      case 'CASH':
        return {
          icon: Banknote,
          tag: 'Kas Tunai',
          badgeClass: 'bg-surface-container text-text-secondary border-border-subtle',
          issuerText: 'Uang Fisik',
        };
      case 'SAVINGS':
        return {
          icon: PiggyBank,
          tag: 'Tabungan',
          badgeClass: 'bg-[#F4ECF7] text-[#7D3C98] border-[#D7BDE2]',
          issuerText: 'Dana Simpanan',
        };
      case 'INVESTMENT':
        return {
          icon: TrendingUp,
          tag: 'Investasi',
          badgeClass: 'bg-tertiary-container text-attention border-tertiary-container',
          issuerText: 'Portofolio',
        };
      default:
        return {
          icon: CreditCard,
          tag: 'Akun',
          badgeClass: 'bg-surface-container text-text-secondary border-border-subtle',
          issuerText: 'Dompet',
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
          createAdjustmentTransaction: createAdjustment,
        }),
      });

      if (res.ok) {
        setReconcilingWallet(null);
        onWalletReconciled();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal merekonsiliasi saldo');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary tracking-tight">
            Dompet &amp; Rekening Terdaftar
          </h2>
          <span className="text-[11px] text-text-secondary font-medium">
            ({wallets.length})
          </span>
        </div>
        <Link
          href="/dompet"
          className="text-xs font-medium text-primary hover:text-primary-dark inline-flex items-center gap-0.5 transition-colors"
        >
          <span>Kelola Semua</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Cards Row (Horizontal swipe on phone, multi-card wrap on desktop) */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none snap-x snap-mandatory">
        {wallets.map((w) => {
          const visual = getWalletVisual(w);
          const Icon = visual.icon;

          return (
            <div
              key={w.id}
              onClick={() => {
                setReconcilingWallet(w);
                setActualBalanceInput(String(w.recordedBalance));
              }}
              className="min-w-[210px] sm:min-w-0 p-4 rounded-xl bg-surface-card border border-border-subtle shadow-xs flex flex-col justify-between shrink-0 snap-start hover:border-primary/40 transition-colors cursor-pointer group"
            >
              {/* Card Top: Visual Icon + Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-primary border border-border-subtle group-hover:bg-primary-light group-hover:text-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${visual.badgeClass}`}>
                  {visual.tag}
                </span>
              </div>

              {/* Card Bottom: Balance & Metadata */}
              <div>
                <span className="text-xs font-medium text-text-secondary block truncate">
                  {w.name}
                </span>
                <span className="text-base font-bold text-text-primary tabular-nums block mt-0.5">
                  {formatRupiah(w.recordedBalance, isBalanceHidden)}
                </span>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle/50 text-[10px] text-text-secondary">
                  <span className="truncate">{visual.issuerText}</span>
                  <span className="text-primary font-medium hover:underline">Rekonsiliasi</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Account Tile */}
        <Link
          href="/dompet"
          className="min-w-[140px] sm:min-w-0 p-4 rounded-xl bg-surface-card hover:bg-surface-container-low text-text-secondary hover:text-primary flex flex-col items-center justify-center gap-2 shrink-0 snap-start transition-colors border border-dashed border-border-subtle"
        >
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-text-primary shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">Tambah Akun</span>
        </Link>
      </div>

      {/* Balance Reconciliation Modal */}
      {reconcilingWallet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-card rounded-2xl p-5 space-y-4 shadow-lg border border-border-subtle">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Rekonsiliasi Saldo</h3>
                <p className="text-xs text-text-secondary">{reconcilingWallet.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setReconcilingWallet(null)}
                className="w-7 h-7 rounded-lg text-text-secondary hover:text-text-primary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 text-xs space-y-1.5 border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-text-secondary">Saldo Tercatat di Sistem:</span>
                <strong className="font-semibold tabular-nums text-text-primary">
                  {formatRupiah(reconcilingWallet.recordedBalance, isBalanceHidden)}
                </strong>
              </div>
              {reconcilingWallet.lastVerifiedBalance !== undefined && (
                <div className="flex justify-between text-[11px] text-text-secondary">
                  <span>Verifikasi Terakhir:</span>
                  <span>{reconcilingWallet.lastReconciledAt ? 'Ada catatan' : 'Belum pernah'}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">
                Saldo Nyata Fisik / Rekening Saat Ini (IDR)
              </label>
              <input
                type="number"
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                placeholder="Contoh: 1500000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary tabular-nums"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={createAdjustment}
                onChange={(e) => setCreateAdjustment(e.target.checked)}
                className="mt-0.5 rounded border-border-subtle text-primary focus:ring-primary/20"
              />
              <span className="leading-snug">
                Buat transaksi <strong>Penyesuaian (Adjustment)</strong> otomatis jika ada selisih.
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconcilingWallet(null)}
                className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container-low"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReconcileSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Rekonsiliasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
