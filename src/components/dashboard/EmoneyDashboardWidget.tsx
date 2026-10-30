'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Wifi,
  ChevronRight,
  Car,
  ArrowDownLeft,
  Clock,
  Plus,
} from 'lucide-react';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';

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
  const emoneyWallets = wallets.filter((w) => w.type === 'EMONEY');

  const combinedBalance = Number(eMoneyAnalytics?.combinedEWalletAndEMoneyBalance || 0);
  const transportTotal = eMoneyAnalytics?.transportAndTollTotal || 0;
  const recentTopUps = eMoneyAnalytics?.recentTopUps || [];

  return (
    <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider">
              Kartu E-Money &amp; Tol
            </h3>
            <span className="text-[10px] text-on-surface-variant">
              Saldo gabungan: {formatRupiah(combinedBalance)}
            </span>
          </div>
        </div>
        <Link
          href="/dompet?type=EMONEY"
          className="text-[11px] font-bold text-primary-container flex items-center gap-0.5 hover:underline"
        >
          <span>Kelola</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Cards Scroll */}
      {emoneyWallets.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {emoneyWallets.map((w) => {
            const issuer = (w.issuer || '').toUpperCase();
            let cardBg = 'bg-gradient-to-r from-[#0f2b48] to-[#163c66]';
            let issuerTitle = 'Mandiri e-money';

            if (issuer === 'BCA' || w.name.toLowerCase().includes('flazz')) {
              cardBg = 'bg-gradient-to-r from-[#003399] to-[#0047ba]';
              issuerTitle = 'BCA Flazz';
            } else if (issuer === 'BRI' || w.name.toLowerCase().includes('brizzi')) {
              cardBg = 'bg-gradient-to-r from-[#00529c] to-[#0070d2]';
              issuerTitle = 'BRI Brizzi';
            } else if (issuer === 'BNI' || w.name.toLowerCase().includes('tapcash')) {
              cardBg = 'bg-gradient-to-r from-[#ea580c] to-[#c2410c]';
              issuerTitle = 'BNI TapCash';
            } else {
              cardBg = 'bg-gradient-to-r from-[#28332e] to-[#1c2622]';
              issuerTitle = 'E-Money Card';
            }

            return (
              <div
                key={w.id}
                onClick={() => onOpenCardModal(w)}
                className={`min-w-[190px] rounded-2xl p-3 text-white ${cardBg} shadow-sm shrink-0 cursor-pointer active:scale-95 transition-all flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
                    {issuerTitle}
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-white/80 rotate-90" />
                </div>

                <div className="my-1">
                  <span className="text-[10px] text-white/70 block">{w.name}</span>
                  <span className="text-base font-black font-mono tracking-tight text-white">
                    {formatRupiah(w.recordedBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-white/70">
                  <span>•••• {w.cardLast4 || '8821'}</span>
                  <span className="text-emerald-300 font-semibold">
                    {w.lastBalanceSource === 'NFC_READ' ? 'NFC Scan' : 'Manual'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-container-low/70 border border-surface-variant/40 rounded-2xl p-3 text-center space-y-1.5">
          <p className="text-xs font-semibold text-on-surface">Belum Ada Kartu E-Money</p>
          <p className="text-[11px] text-on-surface-variant">
            Tambahkan Mandiri e-money, Flazz, Brizzi, atau TapCash untuk lacak tarif tol &amp; parkir.
          </p>
          <Link
            href="/dompet"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kartu E-Money</span>
          </Link>
        </div>
      )}

      {/* Toll & Transport Spending Summary */}
      <div className="bg-surface-container-low border border-surface-variant/30 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <span className="text-on-surface-variant block text-[11px]">Pengeluaran Tol &amp; Transportasi:</span>
            <span className="font-mono font-bold text-on-surface text-sm">
              {formatRupiah(transportTotal)}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full font-semibold">
          Bulan ini
        </span>
      </div>

      {/* Recent Top-Up Item Snippet */}
      {recentTopUps.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-on-surface mb-1.5 px-0.5">
            <span>Top-Up Terakhir</span>
            <span className="text-outline font-normal">Antar Dompet</span>
          </div>
          <div className="space-y-1.5">
            {recentTopUps.slice(0, 2).map((tp) => (
              <div
                key={tp.id}
                className="flex items-center justify-between p-2 bg-surface-container-low/60 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-primary-container shrink-0" />
                  <span className="text-[11px] text-on-surface truncate">
                    {tp.sourceWallet?.name} &rarr; {tp.destinationWallet?.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs text-primary shrink-0">
                  +{formatRupiah(tp.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

