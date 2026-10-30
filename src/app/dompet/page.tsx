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
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
  X,
  RefreshCw,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';

export default function DompetPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reconcilingWallet, setReconcilingWallet] = useState<any | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [createAdjustment, setCreateAdjustment] = useState(false);

  // New Wallet form
  const [name, setName] = useState('');
  const [type, setType] = useState<'BANK' | 'EWALLET' | 'CASH' | 'INVESTMENT' | 'OTHER'>('BANK');
  const [accountNo, setAccountNo] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const loadWallets = async () => {
    try {
      const res = await fetch('/api/wallets');
      if (res.ok) {
        const json = await res.json();
        setWallets(json.wallets || []);
      }
    } catch (err) {
      console.error('[LOAD WALLETS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleCreateWallet = async () => {
    if (!name.trim()) {
      alert('Nama dompet wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          accountNo: accountNo || undefined,
          openingBalance: parseInt(openingBalance, 10) || 0,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setAccountNo('');
        setOpeningBalance('0');
        loadWallets();
      }
    } catch (err) {
      console.error('[CREATE WALLET ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

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
        }),
      });

      if (res.ok) {
        setReconcilingWallet(null);
        setActualBalanceInput('');
        loadWallets();
      }
    } catch (err) {
      console.error('[RECONCILE ERROR]', err);
    }
  };

  const getIcon = (walletType: string) => {
    switch (walletType) {
      case 'BANK': return Building2;
      case 'EWALLET': return Smartphone;
      case 'CASH': return Banknote;
      default: return Wallet;
    }
  };

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
              <h1 className="text-lg font-bold text-on-surface tracking-tight">Kelola Dompet</h1>
              <p className="text-xs text-on-surface-variant">Rekonsiliasi saldo bank, e-wallet & kas</p>
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

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((w) => {
              const Icon = getIcon(w.type);
              const isReconciledRecently =
                w.lastReconciledAt &&
                new Date(w.lastReconciledAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000;

              return (
                <div
                  key={w.id}
                  className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
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
                      Verifikasi terakhir: {w.lastReconciledAt ? formatRelativeDateIndo(w.lastReconciledAt) : 'Belum diverifikasi'}
                    </span>
                    <span>Saldo awal: {formatRupiah(w.openingBalance)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Wallet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">Tambah Dompet Baru</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant block mb-1">Nama Dompet / Akun</label>
                <input
                  type="text"
                  placeholder="Contoh: BCA Prioritas, OVO, Dompet Saku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                />
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Tipe Akun</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="BANK">Rekening Bank</option>
                  <option value="EWALLET">E-Wallet (GoPay, OVO, dll)</option>
                  <option value="CASH">Uang Tunai (Cash)</option>
                  <option value="INVESTMENT">Investasi (Reksadana/Saham)</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Nomor Rekening / HP (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 123-456-7890"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Saldo Awal (IDR)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-surface-variant/30">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan Dompet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcilingWallet && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-on-surface">
              Rekonsiliasi: {reconcilingWallet.name}
            </h4>
            <div className="bg-surface-container-low p-3 rounded-xl border border-surface-variant/30 flex justify-between items-center text-xs">
              <span className="text-on-surface-variant">Saldo Tercatat:</span>
              <span className="font-mono font-bold text-on-surface">
                {formatRupiah(reconcilingWallet.recordedBalance)}
              </span>
            </div>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Berapa saldo aktual saat ini?</label>
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
    </MobileShell>
  );
}

