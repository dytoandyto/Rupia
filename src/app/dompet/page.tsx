'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  ChevronLeft,
  Building2,
  Smartphone,
  Banknote,
  CreditCard,
  PiggyBank,
  CheckCircle,
  AlertCircle,
  Wifi,
  Clock,
  ArrowRightLeft,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';
import EmoneyCardModal from '@/components/emoney/EmoneyCardModal';
import AddWalletModal from '@/components/emoney/AddWalletModal';

export default function DompetPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'EMONEY' | 'EWALLET' | 'BANK' | 'CASH'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmoneyWallet, setSelectedEmoneyWallet] = useState<any | null>(null);
  const [reconcilingWallet, setReconcilingWallet] = useState<any | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [createAdjustment, setCreateAdjustment] = useState(false);

  const loadData = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/categories'),
      ]);
      if (wRes.ok) {
        const wJson = await wRes.json();
        setWallets(wJson.wallets || []);
      }
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCategories(cJson.categories || []);
      }
    } catch (err) {
      console.error('[LOAD DATA ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReconcile = async () => {
    if (!reconcilingWallet) return;
    const actual = parseInt(actualBalanceInput.replace(/[^0-9]/g, ''), 10) || 0;

    try {
      const res = await fetch(`/api/wallets/${reconcilingWallet.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualBalance: actual,
          createAdjustment,
          source: 'MANUAL',
        }),
      });

      if (res.ok) {
        setReconcilingWallet(null);
        setActualBalanceInput('');
        loadData();
      }
    } catch (err) {
      console.error('[RECONCILE ERROR]', err);
    }
  };

  const getIcon = (walletType: string) => {
    switch (walletType) {
      case 'EMONEY':
        return CreditCard;
      case 'BANK':
        return Building2;
      case 'EWALLET':
        return Smartphone;
      case 'CASH':
        return Banknote;
      case 'SAVINGS':
        return PiggyBank;
      default:
        return Wallet;
    }
  };

  // Filter wallets
  const filteredWallets = wallets.filter((w) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'EMONEY') return w.type === 'EMONEY';
    if (selectedFilter === 'EWALLET') return w.type === 'EWALLET';
    if (selectedFilter === 'BANK') return w.type === 'BANK';
    if (selectedFilter === 'CASH') return w.type === 'CASH' || w.type === 'SAVINGS';
    return true;
  });

  // Calculate totals
  const totalAssets = wallets.reduce((sum, w) => sum + Number(w.recordedBalance), 0);
  const combinedEWalletAndEMoney = wallets
    .filter((w) => w.type === 'EWALLET' || w.type === 'EMONEY')
    .reduce((sum, w) => sum + Number(w.recordedBalance), 0);

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Link href="/profil" className="p-1 text-outline hover:text-on-surface">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-on-surface tracking-tight">Kelola Dompet &amp; Kartu</h1>
              <p className="text-xs text-on-surface-variant">Rekonsiliasi saldo bank, e-wallet &amp; kartu e-money</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-primary-container hover:bg-primary text-white font-bold rounded-xl flex items-center gap-1 text-xs active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Balance Overview Card - Deep Forest Luxury Obsidian */}
        <div className="bg-inverse-surface border border-surface-variant/20 rounded-3xl p-5 text-white shadow-lg space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">
                Total Aset Seluruh Dompet
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {formatRupiah(totalAssets)}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white/10 text-primary-fixed px-2 py-0.5 rounded-full border border-white/10">
              {wallets.length} Dompet Aktif
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
            <span>Saldo Gabungan E-Wallet &amp; E-Money:</span>
            <span className="font-mono font-bold text-primary-fixed">
              {formatRupiah(combinedEWalletAndEMoney)}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'EMONEY', label: 'Kartu E-Money' },
            { id: 'EWALLET', label: 'E-Wallet' },
            { id: 'BANK', label: 'Bank' },
            { id: 'CASH', label: 'Kas & Tunai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-3xl border border-surface-variant/40 p-6 space-y-2">
            <CreditCard className="w-10 h-10 text-outline mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-on-surface">Tidak Ada Dompet pada Kategori Ini</h3>
            <p className="text-xs text-on-surface-variant">
              Ketuk tombol &quot;Tambah&quot; di atas untuk menambahkan kartu e-money atau dompet digital baru.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWallets.map((w) => {
              const isEmoney = w.type === 'EMONEY';
              const Icon = getIcon(w.type);
              const isReconciledRecently =
                w.lastReconciledAt &&
                new Date(w.lastReconciledAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000;

              // Distinct render for Physical E-Money Cards
              if (isEmoney) {
                const issuer = (w.issuer || '').toUpperCase();
                let cardBg = 'bg-gradient-to-r from-[#0f2b48] to-[#163c66]';
                let issuerName = 'Mandiri e-money';

                if (issuer === 'BCA' || w.name.toLowerCase().includes('flazz')) {
                  cardBg = 'bg-gradient-to-r from-[#003399] to-[#0047ba]';
                  issuerName = 'BCA Flazz';
                } else if (issuer === 'BRI' || w.name.toLowerCase().includes('brizzi')) {
                  cardBg = 'bg-gradient-to-r from-[#00529c] to-[#0070d2]';
                  issuerName = 'BRI Brizzi';
                } else if (issuer === 'BNI' || w.name.toLowerCase().includes('tapcash')) {
                  cardBg = 'bg-gradient-to-r from-[#ea580c] to-[#c2410c]';
                  issuerName = 'BNI TapCash';
                } else {
                  cardBg = 'bg-gradient-to-r from-[#28332e] to-[#1c2622]';
                  issuerName = 'E-Money Card';
                }

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedEmoneyWallet(w)}
                    className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4.5 space-y-3 shadow-xs hover:border-primary-container/40 transition-all cursor-pointer group"
                  >
                    {/* Visual Card Banner Header */}
                    <div className={`w-full rounded-2xl p-3.5 text-white ${cardBg} shadow-xs flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-white/80 block">
                            {issuerName}
                          </span>
                          <span className="font-mono text-xs text-white tracking-wider">
                            •••• {w.cardLast4 || '8821'}
                          </span>
                        </div>
                      </div>
                      <Wifi className="w-4 h-4 text-white/80 rotate-90" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h3 className="font-bold text-sm text-on-surface group-hover:text-primary-container transition-colors">
                          {w.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-0.5">
                          <Clock className="w-3 h-3 text-outline" />
                          <span>
                            {w.lastReconciledAt ? formatRelativeDateIndo(w.lastReconciledAt) : 'Belum diverifikasi'}
                          </span>
                          <span className="bg-surface-container px-1.5 py-0.2 rounded font-mono uppercase text-[9px]">
                            {w.lastBalanceSource === 'NFC_READ' ? 'NFC' : 'Manual'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-outline block">Saldo Kartu:</span>
                        <span className="text-lg font-bold font-mono text-on-surface">
                          {formatRupiah(w.recordedBalance)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-surface-variant/30 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-primary-container font-semibold">
                        Kelola Top-Up &amp; Bayar Tol &rarr;
                      </span>
                      {isReconciledRecently ? (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary-fixed px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Akurat
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-tertiary font-medium bg-tertiary-fixed px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Perlu Cek
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Standard Bank / E-Wallet / Cash Card
              return (
                <div
                  key={w.id}
                  className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: w.color || '#167a55' }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-on-surface">{w.name}</h3>
                        <span className="text-[10px] text-on-surface-variant">
                          {w.type} {w.accountNo ? `• ${w.accountNo}` : ''}
                        </span>
                      </div>
                    </div>

                    {isReconciledRecently ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary-fixed px-2 py-0.5 rounded-full border border-primary/20">
                        <CheckCircle className="w-3 h-3" /> Akurat
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-tertiary font-medium bg-tertiary-fixed px-2 py-0.5 rounded-full border border-tertiary/20">
                        <AlertCircle className="w-3 h-3" /> Perlu Cek
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <div>
                      <span className="text-[10px] text-outline block">Saldo Tercatat:</span>
                      <span className="text-xl font-bold font-mono text-on-surface">
                        {formatRupiah(w.recordedBalance)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setReconcilingWallet(w);
                        setActualBalanceInput(w.recordedBalance.toString());
                      }}
                      className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-primary-container rounded-xl text-xs font-semibold border border-outline/10 active:scale-95 transition-all shadow-xs"
                    >
                      Rekonsiliasi Saldo
                    </button>
                  </div>

                  <div className="pt-2 border-t border-surface-variant/30 flex justify-between text-[10px] text-outline">
                    <span>
                      Verifikasi terakhir:{' '}
                      {w.lastReconciledAt ? formatRelativeDateIndo(w.lastReconciledAt) : 'Belum diverifikasi'}
                    </span>
                    <span>Awal: {formatRupiah(w.openingBalance)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Wallet Modal */}
        <AddWalletModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadData}
        />

        {/* E-Money Dedicated Card Management Modal */}
        <EmoneyCardModal
          wallet={selectedEmoneyWallet}
          isOpen={Boolean(selectedEmoneyWallet)}
          onClose={() => setSelectedEmoneyWallet(null)}
          onUpdate={loadData}
          allWallets={wallets}
          categories={categories}
        />

        {/* Standard Reconcile Modal for Non-E-Money wallets */}
        {reconcilingWallet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
              <h4 className="font-bold text-sm text-on-surface">
                Rekonsiliasi Saldo: {reconcilingWallet.name}
              </h4>
              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-variant/30 flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Saldo Tercatat:</span>
                <span className="font-mono font-bold text-on-surface">
                  {formatRupiah(reconcilingWallet.recordedBalance)}
                </span>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">
                  Berapa saldo aktual saat ini?
                </label>
                <input
                  type="number"
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-base font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={createAdjustment}
                  onChange={(e) => setCreateAdjustment(e.target.checked)}
                  className="mt-0.5 rounded border-outline text-primary-container focus:ring-primary-container"
                />
                <span>Buat transaksi penyesuaian otomatis jika ada selisih.</span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setReconcilingWallet(null)}
                  className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReconcile}
                  className="flex-1 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
