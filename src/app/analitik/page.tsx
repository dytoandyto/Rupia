'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  ChevronLeft,
  Car,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function AnalitikPage() {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setReport(d.report))
      .catch((err) => console.error('[ANALYTICS ERROR]', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/profil" className="p-1 text-outline hover:text-on-surface">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Analitik Finansial</h1>
            <p className="text-xs text-on-surface-variant">Pola arus kas &amp; laporan pengeluaran riil</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : !report ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 p-6 rounded-3xl text-center text-xs text-on-surface-variant shadow-xs">
            Data transaksi belum mencukupi untuk analitik.
          </div>
        ) : (
          <>
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] text-on-surface-variant block mb-1">Pemasukan Bulan Ini</span>
                <span className="text-base font-bold font-mono text-primary block">
                  {formatRupiah(report.currentPeriod.totalIncome)}
                </span>
                <span className="text-[10px] text-outline mt-1 block">
                  Bulan lalu: {formatRupiah(report.previousPeriod.totalIncome)}
                </span>
              </div>

              <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-4 shadow-xs">
                <span className="text-[11px] text-on-surface-variant block mb-1">Pengeluaran Bulan Ini</span>
                <span className="text-base font-bold font-mono text-error block">
                  {formatRupiah(report.currentPeriod.totalExpenses)}
                </span>
                <span className="text-[10px] text-outline mt-1 block">
                  Bulan lalu: {formatRupiah(report.previousPeriod.totalExpenses)}
                </span>
              </div>
            </div>

            {/* Net Cash Flow & Savings Ratio */}
            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Net Arus Kas (Bulan Ini)</span>
                <span
                  className={`font-mono font-bold flex items-center gap-1 ${
                    report.currentPeriod.netCashFlow >= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {report.currentPeriod.netCashFlow >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatRupiah(report.currentPeriod.netCashFlow)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/30 text-[11px]">
                <div>
                  <span className="text-on-surface-variant block">Rasio Pengeluaran:</span>
                  <span className="font-bold text-on-surface">
                    {report.currentPeriod.expenseToIncomeRatio}% dari pemasukan
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Rata-rata Harian:</span>
                  <span className="font-bold text-on-surface">
                    {formatRupiah(report.currentPeriod.dailyAverageExpense)}/hari
                  </span>
                </div>
              </div>
            </div>

            {/* Toll & Transport Spending Breakdown */}
            {report.transportAndToll && (
              <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-on-surface text-xs block">
                        Pengeluaran Tol, Parkir &amp; Transit
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        Kartu E-Money &amp; Transportasi
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-on-surface">
                    {formatRupiah(report.transportAndToll.total)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/30 text-[11px]">
                  <div>
                    <span className="text-outline block">Frekuensi Perjalanan:</span>
                    <span className="font-bold text-on-surface">
                      {report.transportAndToll.tripCount} kali transaksi tol/transit
                    </span>
                  </div>
                  <div>
                    <span className="text-outline block">Porsi Pengeluaran:</span>
                    <span className="font-bold text-primary-container">
                      {report.transportAndToll.percentageOfExpenses}% dari total belanja
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Essential vs Discretionary Priority Breakdown */}
            {report.priorityBreakdown && (
              <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                    Kebutuhan vs Keinginan
                  </span>
                  <span className="text-[10px] text-outline">Prinsip 50/30/20</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden flex">
                  <div
                    className="h-full bg-primary-container transition-all"
                    style={{ width: `${report.priorityBreakdown.essentialPercentage}%` }}
                    title="Kebutuhan Primer"
                  />
                  <div
                    className="h-full bg-tertiary-container transition-all"
                    style={{ width: `${report.priorityBreakdown.discretionaryPercentage}%` }}
                    title="Keinginan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-container shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-on-surface">
                        Primer: {formatRupiah(report.priorityBreakdown.essential)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {report.priorityBreakdown.essentialPercentage}% dari belanja
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-tertiary-container shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-on-surface">
                        Keinginan: {formatRupiah(report.priorityBreakdown.discretionary)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {report.priorityBreakdown.discretionaryPercentage}% dari belanja
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Expense Burn Rate Chart */}
            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                  Tren Pengeluaran Harian
                </span>
                <span className="text-[10px] text-outline">Bulan Ini (IDR)</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.dailyTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#6f7a72" fontSize={9} tickLine={false} />
                    <YAxis stroke="#6f7a72" fontSize={9} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#28332e', borderColor: '#3f4943', color: '#f1fcf5', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: number) => [formatRupiah(val), 'Pengeluaran']}
                      labelFormatter={(label) => `Tgl ${label}`}
                    />
                    <Bar dataKey="expense" fill="#167a55" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                Distribusi per Kategori ({report.categories.length})
              </h3>

              <div className="space-y-2.5">
                {report.categories.map((c: any) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-on-surface">{c.name}</span>
                      <span className="font-mono font-bold text-on-surface">
                        {formatRupiah(c.amount)} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-container"
                        style={{ width: `${c.percentage}%`, backgroundColor: c.color || '#167a55' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Largest Expenses */}
            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                5 Pengeluaran Terbesar Bulan Ini
              </h3>

              <div className="space-y-2">
                {report.largestExpenses.map((e: any) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-surface-container-low border border-surface-variant/30"
                  >
                    <div>
                      <span className="font-semibold text-on-surface block truncate max-w-[190px]">
                        {e.merchant || e.description}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {e.categoryName || 'Umum'} • {new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-error">
                      -{formatRupiah(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
}
