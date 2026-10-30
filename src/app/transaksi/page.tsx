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
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah, formatShortDateIndo, formatRelativeDateIndo, formatTimeIndo } from '@/lib/formatters';

export default function TransaksiPage() {
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
      .catch(() => {});
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
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Riwayat Transaksi</h1>
            <p className="text-xs text-on-surface-variant">Linimasa arus kas & catatan pembukuan</p>
          </div>
          <a
            href="/api/export"
            download
            className="p-2 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-xl border border-outline/20 flex items-center gap-1.5 text-xs font-medium shadow-xs transition-colors"
            title="Ekspor CSV"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Ekspor</span>
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari deskripsi, merchant, atau toko..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline/20 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-xl font-medium border whitespace-nowrap transition-colors ${
              typeFilter === ''
                ? 'bg-primary-container text-white border-primary-container font-bold shadow-xs'
                : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Semua Tipe
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl font-medium border whitespace-nowrap transition-colors ${
              typeFilter === 'EXPENSE'
                ? 'bg-error text-white border-error font-bold shadow-xs'
                : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`px-3 py-1.5 rounded-xl font-medium border whitespace-nowrap transition-colors ${
              typeFilter === 'INCOME'
                ? 'bg-primary text-white border-primary font-bold shadow-xs'
                : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setTypeFilter('TRANSFER')}
            className={`px-3 py-1.5 rounded-xl font-medium border whitespace-nowrap transition-colors ${
              typeFilter === 'TRANSFER'
                ? 'bg-secondary text-white border-secondary font-bold shadow-xs'
                : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-8 text-center shadow-xs">
            <Receipt className="w-8 h-8 text-outline mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-on-surface">Tidak Ada Transaksi</h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Tidak ada catatan transaksi yang sesuai dengan filter pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER';

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="bg-surface-container-lowest hover:bg-surface-container-low border border-surface-variant/30 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors active:scale-99 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-primary-fixed text-primary'
                          : isTransfer
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-on-surface block truncate">
                        {tx.merchant || tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-0.5">
                        <span className="truncate max-w-[90px]">{tx.wallet?.name}</span>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">
                          {tx.category?.name || (isTransfer ? 'Transfer' : 'Umum')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`text-xs font-bold font-mono block ${
                        isIncome ? 'text-primary' : isTransfer ? 'text-secondary' : 'text-on-surface'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                      {formatRupiah(tx.amount)}
                    </span>
                    <span className="text-[10px] text-outline block">
                      {formatRelativeDateIndo(tx.date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Detail & Void Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">Rincian Transaksi</h4>
              <button onClick={() => setSelectedTx(null)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Obsidian Hero Focus Box */}
            <div className="bg-inverse-surface p-4 rounded-2xl border border-surface-variant/20 text-center shadow-inner">
              <span className="text-xs text-surface-dim block mb-1">
                {selectedTx.type === 'INCOME' ? 'Pemasukan' : selectedTx.type === 'TRANSFER' ? 'Transfer' : 'Pengeluaran'}
              </span>
              <span
                className={`text-2xl font-bold font-mono block ${
                  selectedTx.type === 'INCOME' ? 'text-primary-fixed' : selectedTx.type === 'TRANSFER' ? 'text-secondary-fixed' : 'text-surface-bright'
                }`}
              >
                {formatRupiah(selectedTx.amount)}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-surface-variant/40">
              <div className="flex justify-between py-1.5">
                <span className="text-on-surface-variant">Keterangan:</span>
                <span className="font-semibold text-on-surface">{selectedTx.description}</span>
              </div>
              {selectedTx.merchant && (
                <div className="flex justify-between py-1.5">
                  <span className="text-on-surface-variant">Merchant / Toko:</span>
                  <span className="font-semibold text-on-surface">{selectedTx.merchant}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-on-surface-variant">Dompet:</span>
                <span className="font-semibold text-on-surface">{selectedTx.wallet?.name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-on-surface-variant">Kategori:</span>
                <span className="font-semibold text-on-surface">{selectedTx.category?.name || 'Umum'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-on-surface-variant">Tanggal:</span>
                <span className="font-mono text-on-surface">{formatShortDateIndo(selectedTx.date)} {formatTimeIndo(selectedTx.date)}</span>
              </div>
              {selectedTx.notes && (
                <div className="py-1.5">
                  <span className="text-on-surface-variant block mb-0.5">Catatan:</span>
                  <span className="text-on-surface-variant italic">{selectedTx.notes}</span>
                </div>
              )}
            </div>

            {/* Void / Reverse Action */}
            {!selectedTx.transferId && (
              <div className="pt-2 border-t border-surface-variant/40">
                <label className="text-[11px] text-on-surface-variant block mb-1">
                  Ingin membatalkan transaksi ini? Tuliskan alasannya:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Alasan pembatalan (salah catat, void, dll)"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="flex-1 bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-error focus:ring-1 focus:ring-error/20"
                  />
                  <button
                    onClick={handleVoidTransaction}
                    disabled={isVoiding || !voidReason.trim()}
                    className="bg-error/10 hover:bg-error/20 text-error border border-error/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Batalkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MobileShell>
  );
}

