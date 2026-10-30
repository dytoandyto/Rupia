'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

interface DailyCheckInSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
  availableToSpend: number;
}

export default function DailyCheckInSheet({
  isOpen,
  onClose,
  onCompleted,
  availableToSpend,
}: DailyCheckInSheetProps) {
  const [step, setStep] = useState(1);
  const [hasIncome, setHasIncome] = useState(false);
  const [hasExpenses, setHasExpenses] = useState(true);
  const [hasUnrecorded, setHasUnrecorded] = useState(false);
  const [walletReconciled, setWalletReconciled] = useState(true);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasIncome,
          hasExpenses,
          hasUnrecorded,
          walletReconciled,
          note,
        }),
      });

      if (res.ok) {
        onCompleted();
        onClose();
      }
    } catch (err) {
      console.error('[CHECKIN ERROR]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Check-In Keuangan Harian</h3>
              <p className="text-[11px] text-slate-400">Pukul 20:30 Asia/Jakarta Reminder</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Question 1: Pemasukan Hari Ini */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              1. Ada pemasukan baru hari ini?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasIncome(false)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  !hasIncome ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Tidak Ada
              </button>
              <button
                type="button"
                onClick={() => setHasIncome(true)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  hasIncome ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Ada Pemasukan
              </button>
            </div>
          </div>

          {/* Question 2: Pengeluaran Hari Ini */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              2. Ada transaksi pengeluaran hari ini?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasExpenses(false)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  !hasExpenses ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Hemat (0 Transaksi)
              </button>
              <button
                type="button"
                onClick={() => setHasExpenses(true)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  hasExpenses ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Ada Pengeluaran
              </button>
            </div>
          </div>

          {/* Question 3: Transaksi Belum Dicatat */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              3. Apakah semua transaksi hari ini sudah tercatat di Rupia?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasUnrecorded(false)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  !hasUnrecorded ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Sudah Lengkap ✅
              </button>
              <button
                type="button"
                onClick={() => setHasUnrecorded(true)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  hasUnrecorded ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Masih Ada Tertinggal ⚠️
              </button>
            </div>
          </div>

          {/* Question 4: Kesesuaian Saldo Dompet */}
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              4. Apakah saldo akun Anda (Mandiri/GoPay/Tunai) sesuai?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWalletReconciled(true)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  walletReconciled ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Sesuai Akurat
              </button>
              <button
                type="button"
                onClick={() => setWalletReconciled(false)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  !walletReconciled ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                Perlu Rekonsiliasi
              </button>
            </div>
          </div>

          {/* Note / Reflection */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Catatan Evaluasi Finansial Hari Ini (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Contoh: Belanja bahan masak agak banyak untuk stok 4 hari..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sisa Dana Aman Badge */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-emerald-300 font-medium block">Sisa Dana Aman Dipakai (ATS) Saat Ini:</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{formatRupiah(availableToSpend)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            )}
            Selesaikan Check-In Hari Ini
          </button>
        </div>
      </div>
    </div>
  );
}

