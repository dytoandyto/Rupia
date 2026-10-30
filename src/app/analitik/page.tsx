'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  Car,
  ShieldCheck,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRupiah } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function AnalitikPage() {
  const { isBalanceHidden } = useBalancePrivacy();
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Analitik &amp; Arus Kas
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Laporan pola pengeluaran, rasio kebutuhan pokok vs gaya hidup, dan evaluasi bulanan.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : !report ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-card border border-border-subtle text-center text-xs text-text-secondary shadow-xs">
            Data transaksi belum mencukupi untuk membuat laporan analitik.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Inflow vs Outflow Comparison Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-text-secondary text-xs">
                    <span>Pemasukan Bulan Ini</span>
                    <ArrowDownLeft className="w-4 h-4 text-positive" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-positive tabular-nums block">
                    {formatRupiah(report.currentPeriod.totalIncome, isBalanceHidden)}
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    Bulan lalu: {formatRupiah(report.previousPeriod.totalIncome, isBalanceHidden)}
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-text-secondary text-xs">
                    <span>Pengeluaran Bulan Ini</span>
                    <ArrowUpRight className="w-4 h-4 text-negative" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-negative tabular-nums block">
                    {formatRupiah(report.currentPeriod.totalExpenses, isBalanceHidden)}
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    Bulan lalu: {formatRupiah(report.previousPeriod.totalExpenses, isBalanceHidden)}
                  </span>
                </div>
              </div>

              {/* Net Cash Flow & Daily Average */}
              <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Arus Kas Bersih
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums flex items-center gap-1 ${
                      report.currentPeriod.netCashFlow >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {report.currentPeriod.netCashFlow >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {report.currentPeriod.netCashFlow >= 0 ? '+' : ''}
                    {formatRupiah(report.currentPeriod.netCashFlow, isBalanceHidden)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle text-xs">
                  <div>
                    <span className="text-text-secondary block">Rasio Belanja / Pemasukan:</span>
                    <span className="font-semibold text-text-primary text-sm mt-0.5 block">
                      {report.currentPeriod.expenseToIncomeRatio}%
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Rata-rata Pengeluaran:</span>
                    <span className="font-semibold text-text-primary text-sm mt-0.5 block tabular-nums">
                      {formatRupiah(report.currentPeriod.dailyAverageExpense, isBalanceHidden)} / hari
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Burn Rate Chart */}
              <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-text-primary tracking-tight">
                      Tren Pengeluaran Harian
                    </h3>
                    <span className="text-[11px] text-text-secondary">
                      Aktivitas transaksi harian (IDR)
                    </span>
                  </div>
                </div>

                <div className="w-full h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.dailyBurnRate || []}>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#707970' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#707970' }}
                        tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`)}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(Number(val)), 'Pengeluaran']}
                        labelFormatter={(lbl) => `Tanggal ${lbl}`}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E5E9E3',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" fill="#176B4D" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Essential vs Discretionary (Rule 50/30/20) */}
              {report.priorityBreakdown && (
                <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-text-primary tracking-tight">
                        Kebutuhan Pokok vs Keinginan
                      </h3>
                      <span className="text-[11px] text-text-secondary">Prinsip 50/30/20</span>
                    </div>
                  </div>

                  {/* Restrained Stacked Bar */}
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${report.priorityBreakdown.essentialPercentage}%` }}
                      title="Kebutuhan Pokok"
                    />
                    <div
                      className="h-full bg-attention transition-all"
                      style={{ width: `${report.priorityBreakdown.discretionaryPercentage}%` }}
                      title="Keinginan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span>Kebutuhan Pokok</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary tabular-nums block">
                        {formatRupiah(report.priorityBreakdown.essential, isBalanceHidden)}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {report.priorityBreakdown.essentialPercentage}% dari total belanja
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-text-primary">
                        <span className="w-2 h-2 rounded-full bg-attention" />
                        <span>Gaya Hidup &amp; Keinginan</span>
                      </div>
                      <span className="text-sm font-bold text-text-primary tabular-nums block">
                        {formatRupiah(report.priorityBreakdown.discretionary, isBalanceHidden)}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {report.priorityBreakdown.discretionaryPercentage}% dari total belanja
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Toll & Transit Spending Breakdown */}
              {report.transportAndToll && (
                <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-container text-text-primary flex items-center justify-center border border-border-subtle">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-text-primary">
                          Tol, Parkir &amp; Transit Fisik
                        </h3>
                        <span className="text-[11px] text-text-secondary">
                          Kartu E-Money &amp; Uang Elektronik
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-text-primary">
                      {formatRupiah(report.transportAndToll.total, isBalanceHidden)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle text-xs">
                    <div>
                      <span className="text-text-secondary block">Frekuensi Tap:</span>
                      <span className="font-semibold text-text-primary">
                        {report.transportAndToll.tripCount} kali transaksi
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">Porsi Pengeluaran:</span>
                      <span className="font-semibold text-text-primary">
                        {report.transportAndToll.percentageOfExpenses}% dari belanja
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
