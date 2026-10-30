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
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';

export default function AnggaranPage() {
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

        // Pre-fill default allocations if empty
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
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Anggaran & Alokasi</h1>
            <p className="text-xs text-on-surface-variant">Kontrol pengeluaran dengan batasan disiplin</p>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-primary-container hover:bg-primary text-white font-bold rounded-xl flex items-center gap-1.5 text-xs active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{budget ? 'Ubah' : 'Buat'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : !budget ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <PieChart className="w-10 h-10 text-outline mx-auto" />
            <h3 className="text-base font-bold text-on-surface">Belum Ada Anggaran</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
              Membuat batas anggaran bulanan membantumu mencegah pembengkakan pos pengeluaran dan memastikan tabungan tetap aman.
            </p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Atur Anggaran Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* Grand Total Overview Card - Deep Forest Luxury Obsidian */}
            <div className="bg-inverse-surface border border-surface-variant/20 rounded-3xl p-5 shadow-[0_8px_30px_rgb(20,30,26,0.12)] space-y-4 text-surface-bright relative overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-dim font-medium">{budget.budgetName}</span>
                <span className="font-mono text-surface-dim flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary-fixed" /> Sisa {budget.daysRemaining} hari
                </span>
              </div>

              <div>
                <span className="text-xs text-surface-dim block mb-0.5">Total Pengeluaran / Batas Limit</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-surface-bright">
                    {formatRupiah(budget.totalSpent)}
                  </span>
                  <span className="text-xs text-surface-dim font-mono">
                    / {formatRupiah(budget.totalLimit)}
                  </span>
                </div>
              </div>

              {/* Master Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      budget.status === 'OVERBUDGET'
                        ? 'bg-error'
                        : budget.status === 'CAUTION'
                        ? 'bg-tertiary-fixed'
                        : 'bg-primary-fixed'
                    }`}
                    style={{ width: `${Math.min(100, budget.overallPercentageUsed)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-surface-dim">{budget.overallPercentageUsed}% terpakai</span>
                  <span className="font-semibold text-primary-fixed">
                    Sisa Tersedia: {formatRupiah(budget.totalRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Allocations Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Alokasi Pos Kategori ({budget.categories.length})
              </h3>

              <div className="space-y-2.5">
                {budget.categories.map((c: any) => {
                  let badge = (
                    <span className="text-[10px] bg-primary-fixed text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                      Aman
                    </span>
                  );
                  let barColor = 'bg-primary-container';

                  if (c.status === 'OVERBUDGET') {
                    badge = (
                      <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full border border-error/20 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overbudget
                      </span>
                    );
                    barColor = 'bg-error';
                  } else if (c.status === 'LIMIT_REACHED') {
                    badge = (
                      <span className="text-[10px] bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full border border-tertiary/20 font-medium">
                        Batas Tercapai
                      </span>
                    );
                    barColor = 'bg-tertiary';
                  } else if (c.status === 'CAUTION') {
                    badge = (
                      <span className="text-[10px] bg-tertiary-fixed/60 text-tertiary px-2 py-0.5 rounded-full border border-tertiary/20 font-medium">
                        Waspada (&gt;80%)
                      </span>
                    );
                    barColor = 'bg-tertiary';
                  }

                  return (
                    <div
                      key={c.categoryId}
                      className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-4 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-on-surface truncate max-w-[170px]">
                          {c.categoryName}
                        </span>
                        {badge}
                      </div>

                      <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(100, c.percentageUsed)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant pt-1">
                        <div>
                          <span>Terpakai: </span>
                          <strong className="text-on-surface font-mono">{formatRupiah(c.currentSpent)}</strong>
                        </div>
                        <div className="text-right">
                          <span>Batas: </span>
                          <strong className="text-on-surface font-mono">{formatRupiah(c.allocatedAmount)}</strong>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-surface-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant">
                        <span>Rekomendasi harian:</span>
                        <span className="font-mono font-semibold text-primary-container">
                          {formatRupiah(c.dailyRecommendedLimit)}/hari
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Budget Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">Atur Anggaran Bulanan</h4>
              <button onClick={() => setIsEditModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Total Limit Anggaran (IDR)</label>
                <input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-base font-bold font-mono text-primary-container focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface block">Alokasi per Kategori:</span>
                {categories.map((c) => {
                  const alloc = allocations.find((a) => a.categoryId === c.id);
                  const amount = alloc ? alloc.amount : 0;

                  return (
                    <div key={c.id} className="bg-surface-container-low p-2.5 rounded-xl border border-surface-variant/30 flex items-center justify-between text-xs">
                      <span className="truncate max-w-[120px] font-medium text-on-surface">{c.name}</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setAllocations((prev) => {
                            const copy = [...prev];
                            const existingIdx = copy.findIndex((a) => a.categoryId === c.id);
                            if (existingIdx >= 0) {
                              copy[existingIdx].amount = val;
                            } else {
                              copy.push({ categoryId: c.id, amount: val, percentage: 0 });
                            }
                            return copy;
                          });
                        }}
                        className="w-28 bg-surface-container-lowest border border-outline/20 rounded-lg px-2 py-1 text-right font-mono font-bold text-primary-container focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-surface-variant/30">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBudget}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                Simpan Anggaran
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

