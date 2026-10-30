'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Receipt,
  AlertCircle,
  X,
  Trash2,
  RefreshCw,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import {
  formatRupiah,
  formatShortDateIndo,
  formatRelativeDateIndo,
  formatTimeIndo,
} from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

export default function TransaksiPage() {
  const { isBalanceHidden } = useBalancePrivacy();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (walletFilter) params.append('walletId', walletFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('[LOAD TXS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/wallets')
      .then((r) => r.json())
      .then((d) => setWallets(d.wallets || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [search, typeFilter, walletFilter]);

  const handleVoidTransaction = async () => {
    if (!selectedTx || !voidReason.trim()) {
      alert('Tuliskan alasan pembatalan transaksi');
      return;
    }

    setIsVoiding(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      });

      if (res.ok) {
        setSelectedTx(null);
        setVoidReason('');
        loadTransactions();
      } else {
        const json = await res.json();
        alert(json.error || 'Gagal membatalkan transaksi');
      }
    } catch (err) {
      console.error('[VOID ERROR]', err);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <MobileShell>
      <div className="space-y-5">
        {/* Header & Export Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Riwayat Transaksi
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Seluruh catatan arus kas, pembukuan mutasi, dan jejak audit pembatalan.
            </p>
          </div>

          <a
            href="/api/export"
            download
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-surface-card hover:bg-surface-container text-text-primary rounded-xl border border-border-subtle text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Ekspor CSV</span>
          </a>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari deskripsi, merchant, atau toko..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-low border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Wallet dropdown filter */}
            <div className="sm:col-span-4">
              <select
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Semua Dompet &amp; Akun</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 rounded-lg font-medium border whitespace-nowrap transition-colors ${typeFilter === ''
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg font-medium border whitespace-nowrap transition-colors ${typeFilter === 'EXPENSE'
                  ? 'bg-negative text-white border-negative shadow-xs'
                  : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setTypeFilter('INCOME')}
              className={`px-3 py-1.5 rounded-lg font-medium border whitespace-nowrap transition-colors ${typeFilter === 'INCOME'
                  ? 'bg-positive text-white border-positive shadow-xs'
                  : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setTypeFilter('TRANSFER')}
              className={`px-3 py-1.5 rounded-lg font-medium border whitespace-nowrap transition-colors ${typeFilter === 'TRANSFER'
                  ? 'bg-primary-dark text-white border-primary-dark shadow-xs'
                  : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Transactions Table (Desktop) & Grouped List (Mobile) */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle text-center shadow-xs">
            <Receipt className="w-8 h-8 text-text-secondary mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-text-primary">Tidak Ada Transaksi Ditemukan</h4>
            <p className="text-xs text-text-secondary mt-1">
              Sesuaikan kata kunci pencarian atau filter dompet yang dipilih.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-card border border-border-subtle shadow-xs overflow-hidden">
            {/* Desktop Table View (Hidden on mobile < md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container border-b border-border-subtle text-text-secondary font-semibold">
                    <th className="py-3 px-4">Tanggal &amp; Jam</th>
                    <th className="py-3 px-4">Deskripsi / Toko</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Dompet Asal</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    const isTransfer = tx.type === 'TRANSFER';
                    const isVoided = tx.status === 'VOID';

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-surface-container-low cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                          {formatShortDateIndo(tx.date)}, {formatTimeIndo(tx.date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[240px]">
                              {tx.merchant || tx.description}
                            </span>
                            {tx.isEssential === false && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-tertiary-container text-attention">
                                Keinginan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container font-medium">
                            {tx.category?.name || (isTransfer ? 'Transfer' : 'Umum')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary font-medium">
                          {tx.wallet?.name}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-semibold tabular-nums whitespace-nowrap ${isVoided
                              ? 'line-through text-text-secondary'
                              : isIncome
                                ? 'text-positive'
                                : isTransfer
                                  ? 'text-text-primary'
                                  : 'text-text-primary'
                            }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatRupiah(tx.amount, isBalanceHidden)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isVoided ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-error-container text-negative">
                              VOID
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">
                              Berhasil
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked List View (Visible on mobile < md) */}
            <div className="md:hidden divide-y divide-border-subtle/60">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const isVoided = tx.status === 'VOID';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border-subtle ${isIncome
                            ? 'bg-primary-light text-positive'
                            : isTransfer
                              ? 'bg-surface-container text-text-primary'
                              : 'bg-surface-container text-text-secondary'
                          }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-4 h-4 text-positive" />
                        ) : isTransfer ? (
                          <ArrowRightLeft className="w-4 h-4 text-attention" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-text-secondary" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`text-xs font-semibold block truncate ${isVoided ? 'line-through text-text-secondary' : 'text-text-primary'
                            }`}
                        >
                          {tx.merchant || tx.description}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
                          <span className="truncate max-w-[100px]">{tx.wallet?.name}</span>
                          <span>•</span>
                          <span className="truncate max-w-[100px]">
                            {tx.category?.name || (isTransfer ? 'Transfer' : 'Umum')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span
                        className={`text-xs font-semibold tabular-nums block ${isVoided
                            ? 'line-through text-text-secondary'
                            : isIncome
                              ? 'text-positive'
                              : 'text-text-primary'
                          }`}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatRupiah(tx.amount, isBalanceHidden)}
                      </span>
                      <span className="text-[10px] text-text-secondary block">
                        {formatRelativeDateIndo(tx.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction Detail & Void Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-surface-card p-6 border border-border-subtle shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-text-primary">Detail Transaksi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2 bg-surface-container-low rounded-xl border border-border-subtle">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider block">
                  Nominal Transaksi
                </span>
                <span
                  className={`text-2xl font-bold tabular-nums block mt-0.5 ${selectedTx.type === 'INCOME' ? 'text-positive' : 'text-text-primary'
                    }`}
                >
                  {selectedTx.type === 'INCOME' ? '+' : selectedTx.type === 'TRANSFER' ? '' : '-'}
                  {formatRupiah(selectedTx.amount, isBalanceHidden)}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {selectedTx.merchant || selectedTx.description}
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-border-subtle/50">
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Waktu Transaksi</span>
                  <span className="font-medium text-text-primary">
                    {formatShortDateIndo(selectedTx.date)}, {formatTimeIndo(selectedTx.date)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Dompet Sumber</span>
                  <span className="font-medium text-text-primary">{selectedTx.wallet?.name}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Kategori</span>
                  <span className="font-medium text-text-primary">
                    {selectedTx.category?.name || 'Umum'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Klasifikasi Pengeluaran</span>
                  <span className="font-medium text-text-primary">
                    {selectedTx.isEssential === false
                      ? 'Keinginan (Discretionary)'
                      : 'Kebutuhan Pokok (Essential)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Status Pembukuan</span>
                  <span
                    className={`font-semibold ${selectedTx.status === 'VOID' ? 'text-negative' : 'text-positive'
                      }`}
                  >
                    {selectedTx.status === 'VOID' ? 'Dibatalkan (VOID)' : 'Tercatat Aktif'}
                  </span>
                </div>
              </div>

              {/* Cancellation / Void Workflow */}
              {selectedTx.status !== 'VOID' && (
                <div className="pt-2 border-t border-border-subtle space-y-2">
                  <label className="text-[11px] font-semibold text-text-primary block">
                    Alasan Pembatalan (Audit Trail):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Salah input nominal / duplikat"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-negative/20 text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={handleVoidTransaction}
                    disabled={isVoiding}
                    className="w-full py-2.5 rounded-xl bg-error-container text-negative hover:bg-negative hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isVoiding ? 'Membatalkan...' : 'Batalkan Transaksi (Rollback)'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
