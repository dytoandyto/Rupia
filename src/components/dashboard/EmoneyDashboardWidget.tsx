'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Wifi,
  ChevronRight,
  Car,
  Clock,
  Plus,
} from 'lucide-react';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

interface EmoneyDashboardWidgetProps {
  wallets: any[];
  eMoneyAnalytics?: {
    combinedEWalletAndEMoneyBalance?: string | number;
    recentTopUps?: any[];
    recentCardPurchases?: any[];
    transportAndTollTotal?: number;
    transportTransactionCount?: number;
    lastBalanceVerificationTime?: string | null;
  };
  onOpenCardModal: (wallet: any) => void;
}

export default function EmoneyDashboardWidget({
  wallets,
  eMoneyAnalytics,
  onOpenCardModal,
}: EmoneyDashboardWidgetProps) {
  const { isBalanceHidden } = useBalancePrivacy();
  const emoneyWallets = wallets.filter((w) => w.type === 'EMONEY');

  const combinedBalance = Number(eMoneyAnalytics?.combinedEWalletAndEMoneyBalance || 0);
  const transportTotal = eMoneyAnalytics?.transportAndTollTotal || 0;

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-container text-text-primary flex items-center justify-center border border-border-subtle">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-text-primary tracking-tight">
              Kartu E-Money &amp; Pembayaran Tol
            </h3>
            <span className="text-[11px] text-text-secondary tabular-nums">
              Saldo terdaftar: {formatRupiah(combinedBalance, isBalanceHidden)}
            </span>
          </div>
        </div>
        <Link
          href="/dompet"
          className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-0.5 transition-colors"
        >
          <span>Kelola</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Cards Scroll (or responsive grid on desktop) */}
      {emoneyWallets.length > 0 ? (
        <div className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto pb-1 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none snap-x">
          {emoneyWallets.map((w) => {
            const issuer = (w.issuer || '').toUpperCase();
            let cardBg = 'bg-[#16251E] text-white border-white/10';
            let issuerTitle = 'Mandiri e-money';

            if (issuer === 'BCA' || w.name.toLowerCase().includes('flazz')) {
              cardBg = 'bg-[#003399] text-white border-blue-400/20';
              issuerTitle = 'BCA Flazz';
            } else if (issuer === 'BRI' || w.name.toLowerCase().includes('brizzi')) {
              cardBg = 'bg-[#00529C] text-white border-sky-400/20';
              issuerTitle = 'BRI Brizzi';
            } else if (issuer === 'BNI' || w.name.toLowerCase().includes('tapcash')) {
              cardBg = 'bg-[#C2410C] text-white border-orange-400/20';
              issuerTitle = 'BNI TapCash';
            } else {
              cardBg = 'bg-[#202722] text-white border-white/10';
              issuerTitle = 'Kartu Prabayar';
            }

            return (
              <div
                key={w.id}
                onClick={() => onOpenCardModal(w)}
                className={`min-w-[210px] sm:min-w-0 rounded-xl p-3.5 ${cardBg} border shadow-xs shrink-0 cursor-pointer hover:opacity-95 transition-all flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    {issuerTitle}
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-white/80 rotate-90" />
                </div>

                <div>
                  <span className="text-[11px] text-white/70 block truncate">
                    {w.name} {w.cardLast4 ? `(•• ${w.cardLast4})` : ''}
                  </span>
                  <span className="text-base font-bold text-white tabular-nums block mt-0.5">
                    {formatRupiah(w.recordedBalance, isBalanceHidden)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[10px] text-white/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {w.lastReconciledAt
                      ? formatRelativeDateIndo(new Date(w.lastReconciledAt))
                      : 'Belum verifikasi'}
                  </span>
                  <span className="underline text-white font-medium">Buka Kartu</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-container text-center space-y-2 border border-border-subtle">
          <p className="text-xs text-text-secondary">
            Belum ada kartu e-money (Mandiri e-money, BCA Flazz, BRI Brizzi, BNI TapCash) terdaftar.
          </p>
          <Link
            href="/dompet"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs font-medium text-text-primary hover:bg-surface-container-low transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kartu E-Money</span>
          </Link>
        </div>
      )}

      {/* Toll and Transport Spending Mini Bar */}
      {transportTotal > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-text-primary" />
            <span>Pengeluaran Tol &amp; Parkir Bulan Ini:</span>
          </span>
          <strong className="font-semibold text-text-primary tabular-nums">
            {formatRupiah(transportTotal, isBalanceHidden)}
          </strong>
        </div>
      )}
    </div>
  );
}
