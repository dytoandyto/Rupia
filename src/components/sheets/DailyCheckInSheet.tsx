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
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-border-subtle rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary-forest flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-primary">Check-In Keuangan Harian</h3>
              <p className="text-xs text-text-secondary">Refleksi 1 menit untuk menjaga akurasi catatan</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-base transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question 1: Pemasukan Hari Ini */}
          <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle">
            <label className="text-xs font-semibold text-text-primary block mb-2">
              1. Apakah ada pemasukan baru hari ini?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasIncome(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  !hasIncome 
                    ? 'bg-white border-border-subtle text-text-primary shadow-xs font-semibold' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Tidak Ada
              </button>
              <button
                type="button"
                onClick={() => setHasIncome(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  hasIncome 
                    ? 'bg-primary-forest border-primary-forest text-white font-semibold shadow-xs' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Ada Pemasukan
              </button>
            </div>
          </div>

          {/* Question 2: Pengeluaran Hari Ini */}
          <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle">
            <label className="text-xs font-semibold text-text-primary block mb-2">
              2. Ada transaksi belanja atau pengeluaran hari ini?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasExpenses(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  !hasExpenses 
                    ? 'bg-white border-border-subtle text-text-primary shadow-xs font-semibold' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Nol Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setHasExpenses(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  hasExpenses 
                    ? 'bg-primary-forest border-primary-forest text-white font-semibold shadow-xs' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Ada Pengeluaran
              </button>
            </div>
          </div>

          {/* Question 3: Transaksi Belum Dicatat */}
          <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle">
            <label className="text-xs font-semibold text-text-primary block mb-2">
              3. Apakah seluruh transaksi hari ini sudah dicatat?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasUnrecorded(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  !hasUnrecorded 
                    ? 'bg-white border-border-subtle text-positive font-semibold shadow-xs' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Sudah Lengkap
              </button>
              <button
                type="button"
                onClick={() => setHasUnrecorded(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  hasUnrecorded 
                    ? 'bg-attention/10 border-attention/30 text-attention font-semibold' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Ada Tertinggal
              </button>
            </div>
          </div>

          {/* Question 4: Kesesuaian Saldo Dompet */}
          <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle">
            <label className="text-xs font-semibold text-text-primary block mb-2">
              4. Apakah saldo akun (Bank/e-Money/Tunai) sudah sesuai?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWalletReconciled(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  walletReconciled 
                    ? 'bg-white border-border-subtle text-positive font-semibold shadow-xs' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Sesuai & Akurat
              </button>
              <button
                type="button"
                onClick={() => setWalletReconciled(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  !walletReconciled 
                    ? 'bg-attention/10 border-attention/30 text-attention font-semibold' 
                    : 'bg-transparent border-transparent text-text-secondary hover:bg-white/50'
                }`}
              >
                Perlu Rekonsiliasi
              </button>
            </div>
          </div>

          {/* Note / Reflection */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">Catatan Evaluasi Singkat (Opsional)</label>
            <textarea
              rows={2}
              placeholder="Catatan kecil pengingat atau rencana keuangan besok..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-surface-base border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary-forest focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Available to Spend Badge */}
          <div className="bg-surface-base border border-border-subtle rounded-2xl p-3.5 flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">Sisa Dana Aman Dipakai (ATS):</span>
            <span className="text-sm font-bold tabular-nums text-text-primary">{formatRupiah(availableToSpend)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-border-subtle">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary-forest hover:bg-primary-deep text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            )}
            Selesaikan Check-In
          </button>
        </div>
      </div>
    </div>
  );
}

