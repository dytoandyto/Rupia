'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  RefreshCw,
  PiggyBank,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

export default function TargetPage() {
  const { isBalanceHidden } = useBalancePrivacy();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<any | null>(null);

  // New Goal form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(10000000);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isSaving, setIsSaving] = useState(false);

  // Contribution form
  const [contributionAmount, setContributionAmount] = useState('');

  const loadGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const json = await res.json();
        setGoals(json.goals || []);
      }
    } catch (err) {
      console.error('[LOAD GOALS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async () => {
    if (!name.trim() || targetAmount <= 0) {
      alert('Nama dan target dana harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAmount,
          deadline: deadline || undefined,
          priority,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setTargetAmount(10000000);
        loadGoals();
      }
    } catch (err) {
      console.error('[CREATE GOAL ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContribute = async () => {
    const amount = parseInt(contributionAmount, 10);
    if (!contributingGoal || !amount || amount <= 0) {
      alert('Masukkan nominal setoran tabungan');
      return;
    }

    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: contributingGoal.id,
          addAmount: amount,
        }),
      });

      if (res.ok) {
        setContributingGoal(null);
        setContributionAmount('');
        loadGoals();
      }
    } catch (err) {
      console.error('[CONTRIBUTE ERROR]', err);
    }
  };

  return (
    <MobileShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Target Finansial &amp; Simpanan
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Kelola dana darurat, DP properti, dan rencana pembelian masa depan.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Target Baru</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-card border border-border-subtle text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-surface-container mx-auto flex items-center justify-center text-text-secondary">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Belum Ada Target Finansial</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Tentukan target dana darurat 3-6 bulan pengeluaran atau tabungan impian untuk melacak progres akumulasi asetmu.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Target Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-surface-card border border-border-subtle rounded-2xl p-5 space-y-3.5 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-text-primary">{goal.name}</h3>
                    <span className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-primary" />
                      {goal.deadline
                        ? `Target: ${new Date(goal.deadline).toLocaleDateString('id-ID', {
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : 'Tanpa batas waktu'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                    {goal.progressPercentage}%
                  </span>
                </div>

                {/* Restrained Progress Bar */}
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs tabular-nums">
                  <div>
                    <span className="text-[10px] text-text-secondary block">Terkumpul</span>
                    <span className="font-bold text-primary">
                      {formatRupiah(goal.currentAmount, isBalanceHidden)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-secondary block">Target Total</span>
                    <span className="font-semibold text-text-primary">
                      {formatRupiah(goal.targetAmount, isBalanceHidden)}
                    </span>
                  </div>
                </div>

                {/* Contribution Action */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                  <div>
                    <span className="text-text-secondary text-[11px] block">Saran Setoran:</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {formatRupiah(goal.recommendedMonthlyContribution, isBalanceHidden)}/bln
                    </span>
                  </div>
                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
                  >
                    + Tabung
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h4 className="font-bold text-sm text-text-primary">Buat Target Finansial</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Nama Target</label>
                <input
                  type="text"
                  placeholder="Contoh: Dana Darurat 6 Bulan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Target Nominal (IDR)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-sm font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-text-secondary mt-1 block tabular-nums">
                  {formatRupiah(targetAmount)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Tenggat Target (Opsional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container-low"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateGoal}
                disabled={isSaving}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h4 className="font-bold text-sm text-text-primary">Tabung ke Target</h4>
                <p className="text-xs text-text-secondary">{contributingGoal.name}</p>
              </div>
              <button onClick={() => setContributingGoal(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-secondary">Terkumpul Saat Ini:</span>
                <strong className="font-semibold tabular-nums text-text-primary">
                  {formatRupiah(contributingGoal.currentAmount, isBalanceHidden)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Target Akhir:</span>
                <span className="tabular-nums text-text-primary font-medium">
                  {formatRupiah(contributingGoal.targetAmount, isBalanceHidden)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Nominal Setoran Tabungan (IDR)
              </label>
              <input
                type="number"
                placeholder="Contoh: 500000"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-sm font-semibold tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContributingGoal(null)}
                className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container-low"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleContribute}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors"
              >
                Konfirmasi Tabungan
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
