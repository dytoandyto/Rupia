import prisma from '../db';
import { AtsService } from './ats-service';
import { BudgetService } from './budget-service';
import { AnalyticsService } from './analytics-service';

export interface HealthScoreDimension {
  name: string;
  score: number; // 0 - 100
  weight: number; // e.g. 0.3
  description: string;
  status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
}

export interface FinancialHealthReport {
  score: number; // 0 - 100
  rating: string; // 'Sangat Sehat' | 'Sehat' | 'Cukup' | 'Butuh Perhatian'
  ratingColor: string;
  isDataSufficient: boolean;
  dataCompletenessMessage?: string;
  dimensions: HealthScoreDimension[];
  strengths: string[];
  improvements: string[];
}

export class HealthScoreService {
  /**
   * Deterministically calculates an explainable 0–100 Financial Health Score.
   * Dimensions:
   * 1. Budget Adherence (30%)
   * 2. Savings Consistency (25%)
   * 3. Upcoming Obligation Coverage (20%)
   * 4. Spending Pace & Volatility (15%)
   * 5. Record Completeness & Reconciliation (10%)
   */
  static async calculateHealthScore(userId: string): Promise<FinancialHealthReport> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Gather Telemetry
    const [transactionsCount, wallets, budgetStatus, ats, analytics] = await Promise.all([
      prisma.transaction.count({
        where: { userId, isVoided: false, date: { gte: startOfMonth } },
      }),
      prisma.wallet.findMany({
        where: { userId, isArchived: false },
      }),
      BudgetService.getActiveBudgetStatus(userId),
      AtsService.calculateAvailableToSpend(userId),
      AnalyticsService.getMonthlyAnalytics(userId),
    ]);

    // Data completeness check
    const isDataSufficient = transactionsCount >= 3;
    let dataCompletenessMessage: string | undefined;
    if (!isDataSufficient) {
      dataCompletenessMessage =
        'Catatan transaksi belum mencukupi untuk penilaian komprehensif (minimal 3 transaksi). Skor saat ini berupa estimasi awal.';
    }

    // Dimension 1: Budget Adherence (Weight: 30%)
    let budgetScore = 75; // neutral default if no budget
    if (budgetStatus) {
      if (budgetStatus.overallPercentageUsed <= 80) budgetScore = 100;
      else if (budgetStatus.overallPercentageUsed <= 100) budgetScore = 80;
      else if (budgetStatus.overallPercentageUsed <= 120) budgetScore = 50;
      else budgetScore = 25;
    }

    // Dimension 2: Savings Consistency (Weight: 25%)
    let savingsScore = 50;
    const income = analytics.currentPeriod.totalIncome;
    const netCash = analytics.currentPeriod.netCashFlow;
    if (income > 0) {
      const savingsRate = (netCash / income) * 100;
      if (savingsRate >= 20) savingsScore = 100; // >=20% savings rule
      else if (savingsRate >= 10) savingsScore = 80;
      else if (savingsRate > 0) savingsScore = 65;
      else savingsScore = 30; // negative cashflow
    }

    // Dimension 3: Upcoming Obligation Coverage (Weight: 20%)
    let obligationScore = 90;
    if (ats.upcomingObligations > 0n) {
      if (ats.availableToSpend > ats.upcomingObligations * 2n) {
        obligationScore = 100;
      } else if (ats.availableToSpend >= ats.upcomingObligations) {
        obligationScore = 80;
      } else {
        obligationScore = 40; // Risk of failing upcoming bills
      }
    }

    // Dimension 4: Spending Pace (Weight: 15%)
    let paceScore = 70;
    if (budgetStatus && budgetStatus.daysRemaining > 0) {
      const remainingSafeDaily = Number(ats.dailySafeToSpend);
      const actualDailyAvg = analytics.currentPeriod.dailyAverageExpense;
      if (actualDailyAvg <= remainingSafeDaily) {
        paceScore = 100;
      } else if (actualDailyAvg <= remainingSafeDaily * 1.3) {
        paceScore = 75;
      } else {
        paceScore = 45;
      }
    }

    // Dimension 5: Record Completeness & Reconciliation (Weight: 10%)
    let completenessScore = 80;
    if (ats.hasUnverifiedWallets) completenessScore -= 30;
    if (transactionsCount >= 5) completenessScore += 20;
    completenessScore = Math.max(20, Math.min(100, completenessScore));

    // Weighted Grand Score
    const totalScore = Math.round(
      budgetScore * 0.3 +
      savingsScore * 0.25 +
      obligationScore * 0.2 +
      paceScore * 0.15 +
      completenessScore * 0.1
    );

    let rating = 'Sehat';
    let ratingColor = 'text-emerald-400';

    if (totalScore >= 85) {
      rating = 'Sangat Sehat';
      ratingColor = 'text-emerald-400';
    } else if (totalScore >= 70) {
      rating = 'Sehat';
      ratingColor = 'text-emerald-300';
    } else if (totalScore >= 50) {
      rating = 'Cukup';
      ratingColor = 'text-amber-400';
    } else {
      rating = 'Butuh Perhatian';
      ratingColor = 'text-rose-400';
    }

    const getStatus = (s: number) => {
      if (s >= 85) return 'EXCELLENT';
      if (s >= 70) return 'GOOD';
      if (s >= 50) return 'MODERATE';
      return 'POOR';
    };

    const dimensions: HealthScoreDimension[] = [
      {
        name: 'Kepatuhan Anggaran',
        score: budgetScore,
        weight: 0.3,
        description: budgetStatus
          ? `${budgetStatus.overallPercentageUsed}% anggaran bulanan terpakai.`
          : 'Belum ada anggaran bulanan aktif.',
        status: getStatus(budgetScore),
      },
      {
        name: 'Konsistensi Tabungan',
        score: savingsScore,
        weight: 0.25,
        description: `Net cash flow bulan ini ${analytics.currentPeriod.netCashFlow >= 0 ? '+' : ''}${analytics.currentPeriod.netCashFlow.toLocaleString('id-ID')} IDR.`,
        status: getStatus(savingsScore),
      },
      {
        name: 'Cakupan Tagihan Mendatang',
        score: obligationScore,
        weight: 0.2,
        description: `Total tagihan jatuh tempo: ${Number(ats.upcomingObligations).toLocaleString('id-ID')} IDR.`,
        status: getStatus(obligationScore),
      },
      {
        name: 'Laju Pengeluaran Harian',
        score: paceScore,
        weight: 0.15,
        description: `Rata-rata harian: ${analytics.currentPeriod.dailyAverageExpense.toLocaleString('id-ID')} IDR.`,
        status: getStatus(paceScore),
      },
      {
        name: 'Kelengkapan & Rekonsiliasi Data',
        score: completenessScore,
        weight: 0.1,
        description: ats.hasUnverifiedWallets
          ? 'Ada dompet yang belum diverifikasi dalam 7 hari.'
          : 'Seluruh saldo dompet terverifikasi mutakhir.',
        status: getStatus(completenessScore),
      },
    ];

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (budgetScore >= 80) strengths.push('Pengeluaran terkendali dengan baik di bawah batas anggaran.');
    else improvements.push('Disiplin pada batas anggaran kategori agar tidak overbudget di akhir bulan.');

    if (savingsScore >= 80) strengths.push('Rasio tabungan positif dan konsisten di atas 10% pendapatan.');
    else improvements.push('Tingkatkan tabungan atau kurangi belanja diskresioner.');

    if (ats.hasUnverifiedWallets) improvements.push('Lakukan rekonsiliasi saldo aktual dompet secara berkala.');
    else strengths.push('Integritas saldo dompet tercatat dan terverifikasi akurat.');

    return {
      score: totalScore,
      rating,
      ratingColor,
      isDataSufficient,
      dataCompletenessMessage,
      dimensions,
      strengths,
      improvements,
    };
  }
}

