'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  Landmark,
  Smartphone,
  Banknote,
  CreditCard,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Clock,
  ArrowRightLeft,
  X,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';
import EmoneyCardModal from '@/components/emoney/EmoneyCardModal';
import AddWalletModal from '@/components/emoney/AddWalletModal';

export default function DompetPage() {
  const { isBalanceHidden } = useBalancePrivacy();
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
  const [isReconciling, setIsReconciling] = useState(false);

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

  const handleReconcileSubmit = async () => {
    if (!reconcilingWallet) return;
    const actual = parseInt(actualBalanceInput.replace(/[^0-9]/g, ''), 10) || 0;

    setIsReconciling(true);
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
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan rekonsiliasi');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsReconciling(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return Landmark;
      case 'EWALLET':
        return Smartphone;
      case 'CASH':
        return Banknote;
      case 'SAVINGS':
        return PiggyBank;
      case 'INVESTMENT':
        return TrendingUp;
      default:
        return CreditCard;
    }
  };

  const filteredWallets = wallets.filter((w) => {
    if (selectedFilter === 'ALL') return true;
    return w.type === selectedFilter;
  });

  const totalAssets = wallets.reduce((sum, w) => sum + Number(w.recordedBalance), 0);
  const combinedEWalletAndEMoney = wallets
    .filter((w) => w.type === 'EWALLET' || w.type === 'EMONEY')
    .reduce((sum, w) => sum + Number(w.recordedBalance), 0);

  return (
    <MobileShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Dompet &amp; Rekening Finansial
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Kelola saldo bank, e-wallet, kas fisik, dan kartu uang elektronik dengan verifikasi akurat.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>

        {/* Balance Overview Card (Matte Deep Forest Style) */}
        <div className="bg-card-dark text-white rounded-2xl p-5 sm:p-6 border border-white/10 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-white/70 block uppercase tracking-wider font-medium">
                Total Aset Seluruh Dompet
              </span>
              <span className="text-3xl font-bold tabular-nums text-white block mt-1">
                {formatRupiah(totalAssets, isBalanceHidden)}
              </span>
            </div>
            <span className="text-xs font-medium bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/10">
              {wallets.length} Akun Terdaftar
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
            <span>Saldo Gabungan E-Wallet &amp; E-Money:</span>
            <span className="font-semibold tabular-nums text-white">
              {formatRupiah(combinedEWalletAndEMoney, isBalanceHidden)}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'Semua Akun' },
            { id: 'BANK', label: 'Rekening Bank' },
            { id: 'EWALLET', label: 'E-Wallet' },
            { id: 'EMONEY', label: 'Kartu E-Money Fisik' },
            { id: 'CASH', label: 'Kas Tunai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium border whitespace-nowrap transition-colors ${
                selectedFilter === tab.id
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-card border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Wallet Cards List / Responsive Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-2xl border border-border-subtle p-6 space-y-2">
            <CreditCard className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
            <h3 className="font-semibold text-sm text-text-primary">Tidak Ada Akun pada Kategori Ini</h3>
            <p className="text-xs text-text-secondary">
              Gunakan tombol &quot;Tambah Akun Baru&quot; di atas untuk menambahkan instrumen keuangan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWallets.map((w) => {
              const isEmoney = w.type === 'EMONEY';
              const Icon = getIcon(w.type);

              // Distinct render for Physical E-Money Cards
              if (isEmoney) {
                const issuer = (w.issuer || '').toUpperCase();
                let cardBg = 'bg-[#16251E] text-white border-white/10';
                let issuerName = 'Mandiri e-money';

                if (issuer === 'BCA' || w.name.toLowerCase().includes('flazz')) {
                  cardBg = 'bg-[#003399] text-white border-blue-400/20';
                  issuerName = 'BCA Flazz';
                } else if (issuer === 'BRI' || w.name.toLowerCase().includes('brizzi')) {
                  cardBg = 'bg-[#00529C] text-white border-sky-400/20';
                  issuerName = 'BRI Brizzi';
                } else if (issuer === 'BNI' || w.name.toLowerCase().includes('tapcash')) {
                  cardBg = 'bg-[#C2410C] text-white border-orange-400/20';
                  issuerName = 'BNI TapCash';
                } else {
                  cardBg = 'bg-[#202722] text-white border-white/10';
                  issuerName = 'Kartu Prabayar';
                }

                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedEmoneyWallet(w)}
                    className="bg-surface-card border border-border-subtle rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-primary/40 transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    {/* Visual Card Banner Header */}
                    <div className={`w-full rounded-xl p-3.5 ${cardBg} border shadow-xs flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/80 block">
                            {issuerName}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {w.name} {w.cardLast4 ? `(•• ${w.cardLast4})` : ''}
                          </span>
                        </div>
                      </div>
                      <Wifi className="w-4 h-4 text-white rotate-90" />
                    </div>

                    {/* Balance Info */}
                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <span className="text-[11px] text-text-secondary block">Saldo Tercatat:</span>
                        <span className="text-lg font-bold text-text-primary tabular-nums">
                          {formatRupiah(w.recordedBalance, isBalanceHidden)}
                        </span>
                      </div>
                      <span className="text-[11px] text-primary font-medium underline">
                        Buka Kartu &amp; Top-Up →
                      </span>
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.lastReconciledAt
                          ? `Verifikasi: ${formatRelativeDateIndo(w.lastReconciledAt)}`
                          : 'Belum verifikasi NFC'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container font-mono">
                        {w.lastBalanceSource === 'NFC_SCAN' ? 'NFC Scan' : 'Manual'}
                      </span>
                    </div>
                  </div>
                );
              }

              // Normal Wallet (Bank, E-Wallet, Cash, Savings)
              return (
                <div
                  key={w.id}
                  className="bg-surface-card border border-border-subtle rounded-2xl p-4.5 space-y-3 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-text-primary border border-border-subtle">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-text-primary truncate max-w-[170px]">
                          {w.name}
                        </h4>
                        <span className="text-[11px] text-text-secondary">
                          {w.type === 'BANK'
                            ? `Rekening ${w.accountNo ? `•• ${w.accountNo.slice(-4)}` : ''}`
                            : w.type === 'EWALLET'
                            ? 'Dompet Digital'
                            : 'Kas Fisik'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReconcilingWallet(w);
                        setActualBalanceInput(String(w.recordedBalance));
                      }}
                      className="px-2.5 py-1 rounded-lg border border-border-subtle hover:bg-surface-container text-text-secondary text-[11px] font-medium transition-colors"
                    >
                      Rekonsiliasi
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] text-text-secondary block">Saldo Tercatat:</span>
                    <span className="text-xl font-bold text-text-primary tabular-nums block mt-0.5">
                      {formatRupiah(w.recordedBalance, isBalanceHidden)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-text-secondary">
                    <span>
                      {w.lastReconciledAt
                        ? `Sinkron: ${formatRelativeDateIndo(w.lastReconciledAt)}`
                        : 'Belum diverifikasi'}
                    </span>
                    <span className="text-primary font-medium">Aktif</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* E-Money Modal */}
        <EmoneyCardModal
          wallet={selectedEmoneyWallet}
          isOpen={Boolean(selectedEmoneyWallet)}
          onClose={() => setSelectedEmoneyWallet(null)}
          onUpdate={loadData}
          allWallets={wallets}
          categories={categories}
        />

        {/* Add Wallet Modal */}
        <AddWalletModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={loadData}
        />

        {/* Reconcile Modal */}
        {reconcilingWallet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-surface-card p-5 border border-border-subtle shadow-lg space-y-4">
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
                  <span className="text-text-secondary">Saldo Tercatat Sistem:</span>
                  <strong className="font-semibold tabular-nums text-text-primary">
                    {formatRupiah(reconcilingWallet.recordedBalance, isBalanceHidden)}
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary block">
                  Saldo Riil Aktual (IDR)
                </label>
                <input
                  type="number"
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  placeholder="Contoh: 2500000"
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
                  Buat transaksi Penyesuaian (Adjustment) jika terdapat selisih.
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
                  disabled={isReconciling}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isReconciling ? 'Menyimpan...' : 'Simpan Rekonsiliasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
