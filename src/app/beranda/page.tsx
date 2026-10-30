'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import FinancialOverviewCard from '@/components/dashboard/FinancialOverviewCard';
import WalletCarousel from '@/components/dashboard/WalletCarousel';
import BudgetProgressCard from '@/components/dashboard/BudgetProgressCard';
import RecentTransactionsList from '@/components/dashboard/RecentTransactionsList';
import AiInsightWidget from '@/components/dashboard/AiInsightWidget';
import DailyCheckInSheet from '@/components/sheets/DailyCheckInSheet';
import QuickAddSheet from '@/components/sheets/QuickAddSheet';
import ReceiptCameraModal from '@/components/camera/ReceiptCameraModal';
import { formatDateIndo, formatRupiah } from '@/lib/formatters';

export default function BerandaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

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
          <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <p className="text-[12px] text-on-surface-variant font-medium">Memuat data keuangan Rupia...</p>
        </div>
      </MobileShell>
    );
  }

  // Determine Greeting based on current hour in WIB
  const now = new Date();
  const currentHour = now.getHours();
  let greetingTime = 'pagi';
  if (currentHour >= 11 && currentHour < 15) greetingTime = 'siang';
  else if (currentHour >= 15 && currentHour < 18) greetingTime = 'sore';
  else if (currentHour >= 18 || currentHour < 4) greetingTime = 'malam';

  const userName = user?.name ? user.name.split(' ')[0] : 'Kawan';
  const currentDateStr = formatDateIndo(now);
  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(now);

  const income = data?.overview?.incomeThisMonth || 0;
  const expense = data?.overview?.expensesThisMonth || 0;
  const netFlow = data?.overview?.netCashFlow || 0;
  const savingsRate = income > 0 ? Math.round((netFlow / income) * 100) : 0;

  return (
    <MobileShell user={user} unreadNotifsCount={data?.unreadNotifsCount || 0}>
      <div className="flex flex-col w-full pb-8 space-y-5">
        {/* 1. Greeting & Quick Tools Header (Stitch Approved) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[20px] font-bold text-on-surface truncate">
                Selamat {greetingTime}, {userName}
              </h1>
              <span className="text-[18px]">👋</span>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-0.5">{currentDateStr}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              aria-label="Pindai Struk"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-[12px] font-semibold transition-all active:scale-95 shadow-sm border border-surface-variant/30"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span className="hidden sm:inline">Pindai</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/ai')}
              aria-label="Tanya AI"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-container text-on-primary text-[12px] font-semibold transition-all active:scale-95 shadow-sm hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span>Tanya AI</span>
            </button>
          </div>
        </div>

        {/* 2. Primary Balance Hero Card (Deep Forest Luxury Aesthetic) */}
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

        {/* 3. Daily Money Check-in Card (Gentle Habit-Building Moment) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-variant/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                fact_check
              </span>
              {!data?.hasCheckedIn && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest animate-pulse" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-on-surface truncate">
                Check-in Keuangan Hari Ini
              </span>
              <span className="text-[12px] text-on-surface-variant truncate">
                {data?.hasCheckedIn
                  ? 'Sudah check-in hari ini • Catatan rapi'
                  : 'Belum mereview pengeluaran hari ini'}
              </span>
            </div>
          </div>

          {data?.hasCheckedIn ? (
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-container text-primary font-semibold text-[12px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> Selesai
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsCheckInOpen(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-[12px] font-semibold transition-colors active:scale-95"
            >
              Mulai (1m)
            </button>
          )}
        </div>

        {/* 4. Connected Wallets & Accounts (Dompet & Rekening Terhubung) */}
        {data?.wallets && (
          <WalletCarousel
            wallets={data.wallets}
            onWalletReconciled={loadOverview}
          />
        )}

        {/* 5. Monthly Cash Flow Summary (Arus Kas Bulan Ini) */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-on-surface">Arus Kas {currentMonthName}</h2>
            <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary-fixed/20">
              {netFlow >= 0 ? `Surplus ${savingsRate > 0 ? `+${savingsRate}%` : ''}` : 'Perlu Kontrol'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Income */}
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-on-surface-variant">Pemasukan</span>
                <span className="material-symbols-outlined text-primary text-[16px]">arrow_downward</span>
              </div>
              <div className="mt-2">
                <span className="text-[13px] text-primary block leading-tight font-bold font-mono">
                  {formatRupiah(income)}
                </span>
                <span className="text-[10px] text-primary/80 mt-1 block">Bulan ini</span>
              </div>
            </div>

            {/* Expense */}
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-on-surface-variant">Pengeluaran</span>
                <span className="material-symbols-outlined text-error text-[16px]">arrow_upward</span>
              </div>
              <div className="mt-2">
                <span className="text-[13px] text-on-surface block leading-tight font-bold font-mono">
                  {formatRupiah(expense)}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1 block">Terpakai</span>
              </div>
            </div>

            {/* Net Flow */}
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-on-surface-variant">Arus Kas</span>
                <span className="material-symbols-outlined text-primary-container text-[16px]">savings</span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-[13px] block leading-tight font-bold font-mono ${
                    netFlow >= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {netFlow >= 0 ? `+${formatRupiah(netFlow)}` : `-${formatRupiah(Math.abs(netFlow))}`}
                </span>
                <span className="text-[10px] text-primary mt-1 block">
                  {netFlow >= 0 ? 'Aman (Surplus)' : 'Defisit'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Rupia AI Intelligent Insight Card */}
        {data?.aiInsight && (
          <AiInsightWidget
            observation={data.aiInsight.observation}
            recommendation={data.aiInsight.recommendation}
          />
        )}

        {/* 7. Budget Section ("Status Anggaran Aktif") */}
        <BudgetProgressCard budget={data?.budgetStatus} />

        {/* 8. Recent Transactions ("Transaksi Terkini") */}
        <RecentTransactionsList
          transactions={data?.recentTransactions || []}
          totalCount={data?.recentTransactions?.length || 0}
        />
      </div>

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
        onConfirmReceipt={async (res) => {
          setIsCameraModalOpen(false);
          loadOverview();
        }}
        wallets={data?.wallets || []}
        categories={data?.budgetStatus?.categories?.map((c: any) => ({ id: c.categoryId, name: c.categoryName })) || []}
      />
    </MobileShell>
  );
}
