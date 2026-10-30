'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Info,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import FinancialOverviewCard from '@/components/dashboard/FinancialOverviewCard';
import WalletCarousel from '@/components/dashboard/WalletCarousel';
import BudgetProgressCard from '@/components/dashboard/BudgetProgressCard';
import RecentTransactionsList from '@/components/dashboard/RecentTransactionsList';
import AiInsightWidget from '@/components/dashboard/AiInsightWidget';
import DailyCheckInSheet from '@/components/sheets/DailyCheckInSheet';
import QuickAddSheet from '@/components/sheets/QuickAddSheet';
import ReceiptCameraModal from '@/components/camera/ReceiptCameraModal';
import EmoneyDashboardWidget from '@/components/dashboard/EmoneyDashboardWidget';
import EmoneyCardModal from '@/components/emoney/EmoneyCardModal';
import { formatDateIndo, formatRupiah } from '@/lib/formatters';
import { useBalancePrivacy } from '@/lib/privacy-context';

export default function BerandaPage() {
  const router = useRouter();
  const { isBalanceHidden } = useBalancePrivacy();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [selectedEmoneyWallet, setSelectedEmoneyWallet] = useState<any | null>(null);

  const loadOverview = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.status === 401) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const res = await fetch('/api/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('[LOAD OVERVIEW ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-text-secondary font-medium">Memuat data finansial Rupia...</p>
        </div>
      </MobileShell>
    );
  }

  const now = new Date();
  const currentHour = now.getHours();
  let greetingTime = 'pagi';
  if (currentHour >= 11 && currentHour < 15) greetingTime = 'siang';
  else if (currentHour >= 15 && currentHour < 18) greetingTime = 'sore';
  else if (currentHour >= 18 || currentHour < 4) greetingTime = 'malam';

  const userName = user?.name ? user.name.split(' ')[0] : 'Kawan';
  const currentDateStr = formatDateIndo(now);
  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);

  const income = data?.overview?.incomeThisMonth || 0;
  const expense = data?.overview?.expensesThisMonth || 0;
  const netFlow = data?.overview?.netCashFlow || 0;
  const savingsRate = income > 0 ? Math.round((netFlow / income) * 100) : 0;

  return (
    <MobileShell user={user} unreadNotifsCount={data?.unreadNotifsCount || 0}>
      <div className="space-y-6">
        {/* Top Greeting & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Selamat {greetingTime}, {userName}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {currentDateStr} • Dashboard Arus Kas &amp; Stabilitas Finansial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-container border border-border-subtle text-text-primary text-xs font-medium transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-text-secondary" />
              <span>Pindai Struk</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/ai')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Bot className="w-3.5 h-3.5 text-white" />
              <span>Tanya AI</span>
            </button>
          </div>
        </div>

        {/* Responsive Multi-Column Layout (Desktop Grid 12 cols, Phone 1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================= */}
          {/* LEFT PRIMARY COLUMN (Hero Metric, Cash Flow, Tx History)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Primary Hero Overview Card */}
            {data?.overview && (
              <FinancialOverviewCard
                totalRecordedBalance={data.overview.totalRecordedBalance}
                availableToSpend={data.overview.availableToSpend}
                incomeThisMonth={data.overview.incomeThisMonth}
                expensesThisMonth={data.overview.expensesThisMonth}
                netCashFlow={data.overview.netCashFlow}
                atsBreakdown={data.overview.atsBreakdown}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                onOpenScanReceipt={() => setIsCameraModalOpen(true)}
                onOpenTransfer={() => setIsQuickAddOpen(true)}
              />
            )}

            {/* 2. Monthly Cash Flow Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                    Arus Kas {currentMonthName}
                  </h3>
                  <span className="text-[11px] text-text-secondary">
                    Perbandingan Pemasukan vs Pengeluaran Riil
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    netFlow >= 0
                      ? 'bg-primary-light text-primary border border-primary/20'
                      : 'bg-error-container text-negative border border-error/20'
                  }`}
                >
                  {netFlow >= 0 ? `Surplus ${savingsRate > 0 ? `+${savingsRate}%` : ''}` : 'Defisit Pengeluaran'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                {/* Income */}
                <div className="p-3 rounded-xl bg-surface-container border border-border-subtle/50">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[11px] font-medium">Pemasukan</span>
                    <ArrowDownLeft className="w-3.5 h-3.5 text-positive" />
                  </div>
                  <span className="text-sm font-bold text-text-primary tabular-nums block">
                    {formatRupiah(income, isBalanceHidden)}
                  </span>
                </div>

                {/* Expense */}
                <div className="p-3 rounded-xl bg-surface-container border border-border-subtle/50">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[11px] font-medium">Pengeluaran</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-negative" />
                  </div>
                  <span className="text-sm font-bold text-text-primary tabular-nums block">
                    {formatRupiah(expense, isBalanceHidden)}
                  </span>
                </div>

                {/* Net Cash Flow */}
                <div className="p-3 rounded-xl bg-surface-container border border-border-subtle/50">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[11px] font-medium">Arus Bersih</span>
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums block ${
                      netFlow >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {netFlow >= 0
                      ? `+${formatRupiah(netFlow, isBalanceHidden)}`
                      : `-${formatRupiah(Math.abs(netFlow), isBalanceHidden)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Budget Status Card */}
            <BudgetProgressCard budget={data?.budgetStatus} />

            {/* 4. Recent Transactions Table / List */}
            <RecentTransactionsList
              transactions={data?.recentTransactions || []}
              totalCount={data?.recentTransactions?.length || 0}
            />
          </div>

          {/* ========================================================= */}
          {/* RIGHT SECONDARY COLUMN (Wallets, E-Money, Check-In, AI)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Daily Check-In Reminder Banner */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-text-primary flex items-center justify-center shrink-0 border border-border-subtle">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-text-primary truncate">
                    Evaluasi Harian (20:30 WIB)
                  </span>
                  <span className="text-[11px] text-text-secondary truncate">
                    {data?.hasCheckedIn
                      ? 'Sudah check-in hari ini • Data sinkron'
                      : 'Evaluasi pengeluaranmu hari ini (1 menit)'}
                  </span>
                </div>
              </div>

              {data?.hasCheckedIn ? (
                <span className="text-xs font-medium text-positive inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full bg-primary-light">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-medium transition-colors shrink-0 shadow-xs"
                >
                  Mulai Check-In
                </button>
              )}
            </div>

            {/* 2. Physical E-Money Cards Widget */}
            <EmoneyDashboardWidget
              wallets={data?.wallets || []}
              eMoneyAnalytics={data?.eMoneyAnalytics}
              onOpenCardModal={(w) => setSelectedEmoneyWallet(w)}
            />

            {/* 3. Connected Wallets & Bank Accounts */}
            {data?.wallets && (
              <WalletCarousel
                wallets={data.wallets}
                onWalletReconciled={loadOverview}
              />
            )}

            {/* 4. Rupia AI Financial Intelligence Card */}
            {data?.aiInsight && (
              <AiInsightWidget
                observation={data.aiInsight.observation}
                recommendation={data.aiInsight.recommendation}
              />
            )}
          </div>
        </div>
      </div>

      {/* E-Money Dedicated Card Management Modal */}
      <EmoneyCardModal
        wallet={selectedEmoneyWallet}
        isOpen={Boolean(selectedEmoneyWallet)}
        onClose={() => setSelectedEmoneyWallet(null)}
        onUpdate={loadOverview}
        allWallets={data?.wallets || []}
        categories={
          data?.budgetStatus?.categories?.map((c: any) => ({
            id: c.categoryId,
            name: c.categoryName,
          })) || []
        }
      />

      {/* Daily Check-In Sheet */}
      <DailyCheckInSheet
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCompleted={loadOverview}
        availableToSpend={data?.overview?.availableToSpend || 0}
      />

      {/* Quick Add Sheet */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          setIsQuickAddOpen(false);
          loadOverview();
        }}
      />

      {/* Live Receipt Camera Modal */}
      <ReceiptCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onConfirmReceipt={async () => {
          setIsCameraModalOpen(false);
          loadOverview();
        }}
        wallets={data?.wallets || []}
        categories={
          data?.budgetStatus?.categories?.map((c: any) => ({
            id: c.categoryId,
            name: c.categoryName,
          })) || []
        }
      />
    </MobileShell>
  );
}
