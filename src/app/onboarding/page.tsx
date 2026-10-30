'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  PieChart,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Wallets setup
  const [mandiriBalance, setMandiriBalance] = useState('5000000');
  const [gopayBalance, setGopayBalance] = useState('500000');
  const [cashBalance, setCashBalance] = useState('250000');

  // Step 2: Budget
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState('4000000');

  // Step 3: Daily Reminder
  const [reminderTime, setReminderTime] = useState('20:30');

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const walletsRes = await fetch('/api/wallets');
      const walletsData = await walletsRes.json();
      const existingWallets = walletsData.wallets || [];

      for (const w of existingWallets) {
        let bal = 0;
        if (w.name.toLowerCase().includes('mandiri') || w.name.toLowerCase().includes('bca'))
          bal = parseInt(mandiriBalance, 10) || 0;
        else if (w.name.toLowerCase().includes('gopay'))
          bal = parseInt(gopayBalance, 10) || 0;
        else if (w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash'))
          bal = parseInt(cashBalance, 10) || 0;

        if (bal > 0) {
          await fetch(`/api/wallets/${w.id}/reconcile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actualBalance: bal, createAdjustment: true }),
          });
        }
      }

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      const expCats = (catData.categories || []).filter((c: any) => c.type === 'EXPENSE');

      const budgetLimitNum = parseInt(monthlyBudgetLimit, 10) || 4000000;
      if (expCats.length > 0) {
        const perCat = Math.round(budgetLimitNum / expCats.length);
        await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Anggaran Bulanan',
            period: 'MONTHLY',
            startDate,
            endDate,
            totalLimit: budgetLimitNum,
            allocations: expCats.map((c: any) => ({
              categoryId: c.id,
              allocatedAmount: perCat,
              allocatedPercentage: Math.round(100 / expCats.length),
            })),
          }),
        });
      }

      router.push('/beranda');
    } catch {
      router.push('/beranda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-surface-card border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
        {/* Progress Header */}
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-primary">Langkah {step} dari 3</span>
          <button
            onClick={() => router.push('/beranda')}
            className="text-text-secondary hover:text-text-primary font-medium"
          >
            Lewati Setup →
          </button>
        </div>

        {/* STEP 1: INITIAL BALANCES */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-2 border border-primary/20">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Berapa Saldo Awalmu?</h2>
              <p className="text-xs text-text-secondary">
                Saldo awal digunakan untuk menghitung batas Available-to-Spend secara akurat.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Rekening Bank Utama (IDR)</label>
                <input
                  type="number"
                  value={mandiriBalance}
                  onChange={(e) => setMandiriBalance(e.target.value)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-sm font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1">E-Wallet (GoPay / OVO)</label>
                <input
                  type="number"
                  value={gopayBalance}
                  onChange={(e) => setGopayBalance(e.target.value)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-sm font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1">Kas Tunai (Dompet Fisik)</label>
                <input
                  type="number"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(e.target.value)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-sm font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs mt-4 transition-colors"
            >
              <span>Lanjut ke Anggaran</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 2: MONTHLY BUDGET LIMIT */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-surface-container text-text-primary flex items-center justify-center mx-auto mb-2 border border-border-subtle">
                <PieChart className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Batas Anggaran Bulanan</h2>
              <p className="text-xs text-text-secondary">
                Rencana pengeluaran maksimal agar tidak mengalami defisit di akhir bulan.
              </p>
            </div>

            <div className="pt-1">
              <label className="text-xs text-text-secondary block mb-1">
                Batas Pengeluaran Bulan Ini (IDR)
              </label>
              <input
                type="number"
                value={monthlyBudgetLimit}
                onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2.5 text-base font-bold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-xs text-text-secondary mt-1 block tabular-nums">
                {formatRupiah(parseInt(monthlyBudgetLimit, 10) || 0)}
              </span>
            </div>

            <div className="p-3 bg-surface-container rounded-xl border border-border-subtle text-xs text-text-secondary space-y-1">
              <span className="font-semibold text-text-primary block">Prinsip Alokasi Pos:</span>
              <p className="text-[11px] leading-relaxed">
                Rupia akan mengelompokkan anggaran ini ke dalam pos Makanan, Transportasi, Hiburan, dan Tabungan.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary font-medium rounded-xl text-xs transition-colors border border-border-subtle"
              >
                Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY CHECK-IN REMINDER */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-surface-container text-text-primary flex items-center justify-center mx-auto mb-2 border border-border-subtle">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-base font-bold text-text-primary">Jadwal Evaluasi Harian</h2>
              <p className="text-xs text-text-secondary">
                Evaluasi 60 detik setiap malam untuk memastikan tidak ada transaksi tunai yang terlewat.
              </p>
            </div>

            <div className="pt-1">
              <label className="text-xs text-text-secondary block mb-1">
                Jam Pengingat Malam (WIB)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-base font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="p-3 bg-primary-light rounded-xl border border-primary/20 text-xs text-primary font-medium">
              Preferensi dan data awal ini dapat Anda sesuaikan kapan saja melalui menu Pengaturan.
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary font-medium rounded-xl text-xs transition-colors border border-border-subtle"
              >
                Kembali
              </button>
              <button
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Buka Beranda</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
