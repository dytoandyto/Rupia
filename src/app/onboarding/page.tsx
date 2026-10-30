'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Wallet,
  PieChart,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: Wallets setup
  const [mandiriBalance, setMandiriBalance] = useState('5000000');
  const [gopayBalance, setGopayBalance] = useState('500000');
  const [cashBalance, setCashBalance] = useState('250000');

  // Step 3: Budget
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState('4000000');

  // Step 4: Daily Reminder
  const [reminderTime, setReminderTime] = useState('20:30');

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update balances on starter wallets or create
      const walletsRes = await fetch('/api/wallets');
      const walletsData = await walletsRes.json();
      const existingWallets = walletsData.wallets || [];

      // Update or reconcile initial wallets with user's starting balance
      for (const w of existingWallets) {
        let bal = 0;
        if (w.name.toLowerCase().includes('mandiri')) bal = parseInt(mandiriBalance, 10) || 0;
        else if (w.name.toLowerCase().includes('gopay')) bal = parseInt(gopayBalance, 10) || 0;
        else if (w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash')) bal = parseInt(cashBalance, 10) || 0;

        if (bal > 0) {
          await fetch(`/api/wallets/${w.id}/reconcile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actualBalance: bal, createAdjustment: true }),
          });
        }
      }

      // 2. Setup initial monthly budget
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

      // Finish and redirect to Beranda
      router.push('/beranda');
    } catch (err) {
      console.error('[ONBOARDING ERROR]', err);
      router.push('/beranda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Progress Dots */}
        <div className="flex justify-between items-center text-xs text-on-surface-variant">
          <span className="font-semibold text-primary-container">Langkah {step} dari 3</span>
          <button
            onClick={() => router.push('/beranda')}
            className="text-outline hover:text-on-surface text-xs font-medium"
          >
            Lewati Setup →
          </button>
        </div>

        {/* STEP 1: WELCOME & WALLET BALANCES */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Berapa Saldo Awalmu?</h2>
              <p className="text-xs text-on-surface-variant">
                Masukkan saldo awal perkiraan di akun utama agar Available-to-Spend langsung aktif.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Bank Mandiri (Livin)</label>
                <input
                  type="number"
                  value={mandiriBalance}
                  onChange={(e) => setMandiriBalance(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">E-Wallet GoPay</label>
                <input
                  type="number"
                  value={gopayBalance}
                  onChange={(e) => setGopayBalance(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Dompet Uang Tunai (Cash)</label>
                <input
                  type="number"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs mt-4 transition-colors"
            >
              Lanjut ke Anggaran <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: MONTHLY BUDGET LIMIT */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mx-auto mb-2">
                <PieChart className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Target Batas Belanja</h2>
              <p className="text-xs text-on-surface-variant">
                Berapa batas pengeluaran maksimal yang kamu rencanakan untuk bulan ini?
              </p>
            </div>

            <div className="pt-2">
              <label className="text-xs text-on-surface-variant block mb-1">Batas Anggaran Bulanan (IDR)</label>
              <input
                type="number"
                value={monthlyBudgetLimit}
                onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2.5 text-lg font-mono font-bold text-primary-container focus:outline-none focus:border-primary-container"
              />
              <span className="text-[11px] text-outline mt-1 block">
                {formatRupiah(parseInt(monthlyBudgetLimit, 10) || 0)}
              </span>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant/30 text-xs text-on-surface space-y-1">
              <span className="font-semibold text-primary-container block">💡 Aturan 50/30/20 Otomatis:</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Rupia akan membagi anggaran ini secara cerdas ke pos Kebutuhan, Hiburan/Kopi, dan Tabungan.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface-variant hover:text-on-surface font-semibold rounded-xl text-xs transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-2 py-3 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                Lanjut ke Pengingat <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY CHECK-IN REMINDER */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mx-auto mb-2">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Disiplin Check-In Harian</h2>
              <p className="text-xs text-on-surface-variant">
                Pencatatan 60 detik setiap malam menjaga saldo Available-to-Spend selalu 100% akurat.
              </p>
            </div>

            <div className="pt-2">
              <label className="text-xs text-on-surface-variant block mb-1">Jam Pengingat Harian (WIB)</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-base font-mono font-bold text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="p-3 bg-primary-fixed/40 rounded-xl border border-primary/20 text-xs text-primary">
              <span className="font-bold block mb-0.5">Siap Memulai!</span>
              Seluruh preferensi dapat diubah kapan saja di menu Profil.
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface-variant hover:text-on-surface font-semibold rounded-xl text-xs transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="flex-2 py-3 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Buka Beranda Rupia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

