'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

export default function AnggaranPage() {
  const { isBalanceHidden } = useBalancePrivacy();
  const [budget, setBudget] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form states
  const [totalLimit, setTotalLimit] = useState(5000000);
  const [allocations, setAllocations] = useState<{ categoryId: string; amount: number; percentage: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadBudget = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const json = await res.json();
        setBudget(json.budget);
        if (json.budget) {
          setTotalLimit(json.budget.totalLimit);
        }
      }

      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catJson = await catRes.json();
        const expCats = (catJson.categories || []).filter((c: any) => c.type === 'EXPENSE');
        setCategories(expCats);

        if (expCats.length > 0 && allocations.length === 0) {
          const perCat = Math.round(5000000 / expCats.length);
          setAllocations(
            expCats.map((c: any) => ({
              categoryId: c.id,
              amount: perCat,
              percentage: Math.round(100 / expCats.length),
            }))
          );
        }
      }
    } catch (err) {
      console.error('[LOAD BUDGET ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleSaveBudget = async () => {
    setIsSaving(true);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: budget?.budgetId,
          name: 'Anggaran Bulanan',
          period: 'MONTHLY',
          startDate,
          endDate,
          totalLimit,
          allocations: allocations.map((a) => ({
            categoryId: a.categoryId,
            allocatedAmount: a.amount,
            allocatedPercentage: a.percentage,
          })),
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        loadBudget();
      }
    } catch (err) {
      console.error('[SAVE BUDGET ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Anggaran &amp; Alokasi Pos
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Kontrol pengeluaran bulanan menggunakan metode envelope budgeting disiplin.
            </p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{budget ? 'Ubah Alokasi' : 'Atur Anggaran'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : !budget ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-card border border-border-subtle text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-surface-container mx-auto flex items-center justify-center text-text-secondary">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Belum Ada Anggaran Aktif</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Membuat batas belanja bulanan membantumu membatasi pos hiburan/jajan dan menjaga tabungan tetap aman.
            </p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Atur Anggaran Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Overview Column (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-card-dark text-white rounded-2xl p-5 sm:p-6 border border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70 font-medium">{budget.budgetName}</span>
                  <span className="text-white/80 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#34D399]" /> Sisa {budget.daysRemaining} hari
                  </span>
                </div>

                <div>
                  <span className="text-xs text-white/70 block mb-1">Total Pengeluaran / Limit</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white">
                      {formatRupiah(budget.totalSpent, isBalanceHidden)}
                    </span>
                    <span className="text-xs text-white/60 tabular-nums">
                      / {formatRupiah(budget.totalLimit, isBalanceHidden)}
                    </span>
                  </div>
                </div>

                {/* Master Restrained Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        budget.status === 'OVERBUDGET'
                          ? 'bg-negative'
                          : budget.status === 'CAUTION'
                          ? 'bg-attention'
                          : 'bg-[#34D399]'
                      }`}
                      style={{ width: `${Math.min(100, budget.overallPercentageUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">{budget.overallPercentageUsed}% terpakai</span>
                    <span className="font-semibold text-white tabular-nums">
                      Sisa: {formatRupiah(budget.totalRemaining, isBalanceHidden)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Envelope Rule Advice */}
              <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs text-xs space-y-2">
                <h4 className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Saran Kedisiplinan Pos</span>
                </h4>
                <p className="text-text-secondary leading-relaxed">
                  Jika satu kategori mendekati batas limit, alihkan pengeluaran non-pokok atau hemat pos jajan harian agar tidak membebani dana daruratmu.
                </p>
              </div>
            </div>

            {/* Right Category Breakdown Column (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Alokasi Pos Kategori ({budget.categories.length})
              </h3>

              <div className="space-y-3">
                {budget.categories.map((c: any) => {
                  let badge = (
                    <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                      Aman
                    </span>
                  );
                  let barColor = 'bg-primary';

                  if (c.status === 'OVERBUDGET') {
                    badge = (
                      <span className="text-[10px] bg-error-container text-negative px-2 py-0.5 rounded-full border border-negative/20 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overbudget
                      </span>
                    );
                    barColor = 'bg-negative';
                  } else if (c.status === 'LIMIT_REACHED' || c.status === 'CAUTION') {
                    badge = (
                      <span className="text-[10px] bg-tertiary-container text-attention px-2 py-0.5 rounded-full border border-attention/20 font-medium">
                        Waspada (&gt;80%)
                      </span>
                    );
                    barColor = 'bg-attention';
                  }

                  return (
                    <div
                      key={c.categoryId}
                      className="p-4 rounded-xl bg-surface-card border border-border-subtle shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-text-primary truncate max-w-[200px]">
                          {c.categoryName}
                        </span>
                        {badge}
                      </div>

                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${Math.min(100, c.percentageUsed)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-secondary tabular-nums">
                        <span>
                          Terpakai:{' '}
                          <strong className="text-text-primary">
                            {formatRupiah(c.spentAmount, isBalanceHidden)}
                          </strong>
                        </span>
                        <span>
                          Limit: {formatRupiah(c.allocatedAmount, isBalanceHidden)} ({c.percentageUsed}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-surface-card p-6 border border-border-subtle shadow-lg space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="text-sm font-bold text-text-primary">Atur Batas Anggaran Bulanan</h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Total Batas Anggaran Keseluruhan (IDR)
                  </label>
                  <input
                    type="number"
                    value={totalLimit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value, 10) || 0;
                      setTotalLimit(newLimit);
                      if (allocations.length > 0) {
                        const perCat = Math.round(newLimit / allocations.length);
                        setAllocations(
                          allocations.map((a) => ({
                            ...a,
                            amount: perCat,
                          }))
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-white text-text-primary font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs text-text-secondary mt-1 block tabular-nums">
                    {formatRupiah(totalLimit)}
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t border-border-subtle">
                  <span className="text-xs font-semibold text-text-primary block">
                    Alokasi per Kategori Pengeluaran:
                  </span>
                  {allocations.map((alloc, idx) => {
                    const cat = categories.find((c) => c.id === alloc.categoryId);
                    return (
                      <div key={alloc.categoryId} className="p-3 bg-surface-container rounded-xl space-y-1.5 border border-border-subtle">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-text-primary">{cat?.name || 'Kategori'}</span>
                          <span className="text-text-secondary tabular-nums font-mono">
                            {formatRupiah(alloc.amount)} ({alloc.percentage}%)
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={alloc.percentage}
                          onChange={(e) => {
                            const newPct = parseInt(e.target.value, 10) || 0;
                            const newAlloc = [...allocations];
                            newAlloc[idx] = {
                              ...newAlloc[idx],
                              percentage: newPct,
                              amount: Math.round((totalLimit * newPct) / 100),
                            };
                            setAllocations(newAlloc);
                          }}
                          className="w-full accent-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
