'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Plus,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  RefreshCw,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';

export default function TargetPage() {
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
        loadGoals();
      }
    } catch (err) {
      console.error('[CREATE GOAL ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContributeSubmit = async () => {
    if (!contributingGoal) return;
    const amt = parseInt(contributionAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (amt <= 0) return;

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONTRIBUTE',
          goalId: contributingGoal.id,
          amount: amt,
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
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Link href="/profil" className="p-1 text-outline hover:text-on-surface">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-on-surface tracking-tight">Target Finansial</h1>
              <p className="text-xs text-on-surface-variant">Rencanakan pos tabungan & masa depanmu</p>
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
        ) : goals.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <Target className="w-10 h-10 text-outline mx-auto" />
            <h3 className="text-base font-bold text-on-surface">Belum Ada Target Finansial</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
              Buat target seperti Dana Darurat 6 Bulan, Beli Gadget Kerja, atau DP Rumah untuk melacak progres tabunganmu.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Buat Target Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{goal.name}</h3>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-primary-container" />
                      {goal.deadline
                        ? `Target: ${new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`
                        : 'Tanpa batas waktu'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary border border-primary/20">
                    {goal.progressPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-container transition-all duration-300"
                    style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-outline block">Terkumpul</span>
                    <span className="font-mono font-bold text-primary-container">
                      {formatRupiah(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-outline block">Target Total</span>
                    <span className="font-mono font-bold text-on-surface">
                      {formatRupiah(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Recommended Contribution Info */}
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-variant/30 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-on-surface-variant block">Rekomendasi Setoran:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {formatRupiah(goal.recommendedMonthlyContribution)}/bulan
                    </span>
                  </div>
                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="px-3 py-1.5 bg-primary-container hover:bg-primary text-white font-semibold rounded-lg shadow-xs active:scale-95 transition-all"
                  >
                    + Nabung
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">Buat Target Finansial</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Nama Target</label>
                <input
                  type="text"
                  placeholder="Contoh: Dana Darurat 6 Bulan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Target Nominal (IDR)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-base font-bold font-mono text-primary-container focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Batas Waktu (Deadline)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
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
                onClick={handleCreateGoal}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-on-surface">Nabung ke: {contributingGoal.name}</h4>
            <p className="text-xs text-on-surface-variant">
              Catatan: Menambah progres target tabungan ini mencatat alokasi virtual tanpa mutasi saldo rekening real.
            </p>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Nominal Tambahan Tabungan (IDR)</label>
              <input
                type="number"
                placeholder="Contoh: 500000"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2.5 text-base font-bold font-mono text-primary-container focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setContributingGoal(null)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleContributeSubmit}
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

