import prisma, { serializeBigInt } from '../db';
import { AtsService } from './ats-service';
import { BudgetService } from './budget-service';
import { AnalyticsService } from './analytics-service';
import { formatRupiah } from '../formatters';

export interface AiToolResult {
  tool: string;
  data: unknown;
}

export class AiFinancialService {
  /**
   * Authorized Server-Side Financial Tools (Strictly Read-Only & Deterministic)
   */
  static async executeTool(userId: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    switch (toolName) {
      case 'get_wallet_balances': {
        const wallets = await prisma.wallet.findMany({
          where: { userId, isArchived: false },
          select: {
            id: true,
            name: true,
            type: true,
            recordedBalance: true,
            lastVerifiedBalance: true,
            lastReconciledAt: true,
          },
        });
        return serializeBigInt(wallets);
      }

      case 'get_financial_summary': {
        return AtsService.getFinancialOverview(userId);
      }

      case 'get_recent_transactions': {
        const limit = typeof args.limit === 'number' ? args.limit : 10;
        const txs = await prisma.transaction.findMany({
          where: { userId, isVoided: false },
          include: { category: true, wallet: true },
          orderBy: { date: 'desc' },
          take: limit,
        });
        return serializeBigInt(
          txs.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            type: t.type,
            date: t.date,
            wallet: t.wallet.name,
            category: t.category?.name || 'Tanpa Kategori',
          }))
        );
      }

      case 'get_category_spending': {
        const analytics = await AnalyticsService.getMonthlyAnalytics(userId);
        return analytics.categories;
      }

      case 'get_budget_status': {
        return BudgetService.getActiveBudgetStatus(userId);
      }

      case 'get_upcoming_obligations': {
        const obligations = await prisma.financialObligation.findMany({
          where: { userId, isPaid: false },
          orderBy: { dueDate: 'asc' },
        });
        return serializeBigInt(obligations);
      }

      case 'get_spending_trends': {
        const analytics = await AnalyticsService.getMonthlyAnalytics(userId);
        return {
          currentMonth: analytics.currentPeriod,
          previousMonth: analytics.previousPeriod,
          changePercentage: analytics.previousPeriod.expenseChangePercentage,
        };
      }

      case 'calculate_savings_scenario': {
        const dailyReduction = Number(args.dailyReduction || 10000);
        const monthlySaving = dailyReduction * 30;
        const yearlySaving = dailyReduction * 365;
        const fiveYearWith5PctInterest = Math.round(monthlySaving * (((1 + 0.05 / 12) ** 60 - 1) / (0.05 / 12)));

        return {
          dailyReduction,
          monthlySaving,
          yearlySaving,
          fiveYearProjection: fiveYearWith5PctInterest,
        };
      }

      case 'generate_daily_summary': {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const txsToday = await prisma.transaction.findMany({
          where: { userId, isVoided: false, date: { gte: startOfDay } },
        });

        let expenseToday = 0n;
        let incomeToday = 0n;
        for (const t of txsToday) {
          if (t.type === 'EXPENSE') expenseToday += t.amount;
          if (t.type === 'INCOME') incomeToday += t.amount;
        }

        const ats = await AtsService.calculateAvailableToSpend(userId);

        return {
          date: today,
          transactionsCount: txsToday.length,
          expenseToday: Number(expenseToday),
          incomeToday: Number(incomeToday),
          availableToSpend: Number(ats.availableToSpend),
          dailySafePace: Number(ats.dailySafeToSpend),
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Deterministic Fallback Advisor: Answers user financial questions accurately
   * using verified database figures without requiring an active external LLM key.
   */
  static async generateDeterministicAdvice(userId: string, question: string): Promise<string> {
    const q = question.toLowerCase();

    // 1. Kenapa uang cepat habis / boros
    if (q.includes('habis') || q.includes('boros') || q.includes('kenapa')) {
      const analytics = await AnalyticsService.getMonthlyAnalytics(userId);
      const topCat = analytics.categories[0];
      const secondCat = analytics.categories[1];

      let reply = `Berdasarkan data transaksi bulan ini, total pengeluaranmu sudah mencapai **${formatRupiah(analytics.currentPeriod.totalExpenses)}** `;
      reply += `(${analytics.currentPeriod.expenseToIncomeRatio}% dari total pemasukan).\n\n`;

      if (topCat) {
        reply += `📌 **Kategori paling besar:**\n`;
        reply += `1. **${topCat.name}**: ${formatRupiah(topCat.amount)} (${topCat.percentage}% dari total pengeluaran).\n`;
        if (secondCat) {
          reply += `2. **${secondCat.name}**: ${formatRupiah(secondCat.amount)} (${secondCat.percentage}%).\n`;
        }
      }

      reply += `\n💡 **Rekomendasi Rupia:**\n`;
      reply += `Rata-rata pengeluaran harianmu adalah **${formatRupiah(analytics.currentPeriod.dailyAverageExpense)}/hari**. `;
      reply += `Cobalah batasi pengeluaran non-esensial dan terapkan batas harian untuk menjaga sisa saldo tetap aman sampai akhir bulan.`;
      return reply;
    }

    // 2. Pengeluaran Kopi / Kategori Tertentu
    if (q.includes('kopi') || q.includes('makan') || q.includes('bensin') || q.includes('belanja')) {
      const keyword = q.includes('kopi') ? 'kopi' : q.includes('bensin') ? 'bensin' : q.includes('makan') ? 'makan' : 'belanja';
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const matchedTxs = await prisma.transaction.findMany({
        where: {
          userId,
          isVoided: false,
          date: { gte: startOfMonth },
          OR: [
            { description: { contains: keyword } },
            { merchant: { contains: keyword } },
          ],
        },
      });

      const totalSpent = matchedTxs.reduce((acc, t) => acc + t.amount, 0n);
      return `☕ Total pengeluaran untuk **"${keyword}"** bulan ini adalah **${formatRupiah(totalSpent)}** dari **${matchedTxs.length} transaksi** tercatat.`;
    }

    // 3. Uang aman dipakai (Available to Spend)
    if (q.includes('aman') || q.includes('safe') || q.includes('sisa')) {
      const ats = await AtsService.calculateAvailableToSpend(userId);
      let reply = `🛡️ **Uang yang Aman Dipakai (Available-to-Spend):**\n`;
      reply += `• Total Dana Discretionary: **${formatRupiah(ats.availableToSpend)}**\n`;
      reply += `• Rekomendasi Batas Harian: **${formatRupiah(ats.dailySafeToSpend)}/hari** (untuk ${ats.daysRemainingInMonth} hari tersisa).\n\n`;
      reply += `*Perhitungan di atas telah mengamankan cadangan tagihan mendatang (${formatRupiah(ats.upcomingObligations)}) dan buffer pengaman (${formatRupiah(ats.safetyBuffer)}).*`;
      return reply;
    }

    // 4. Simulasi Tabungan
    if (q.includes('kurangi') || q.includes('simulasi') || q.includes('kalau')) {
      const scenario = await this.executeTool(userId, 'calculate_savings_scenario', { dailyReduction: 10000 }) as {
        dailyReduction: number;
        monthlySaving: number;
        yearlySaving: number;
        fiveYearProjection: number;
      };

      return `📈 **Simulasi Penghematan Kopi/Snack:**\n` +
        `Jika kamu menghemat **${formatRupiah(scenario.dailyReduction)} setiap hari**:\n` +
        `• Tambahan tabungan 1 Bulan: **${formatRupiah(scenario.monthlySaving)}**\n` +
        `• Tambahan tabungan 1 Tahun: **${formatRupiah(scenario.yearlySaving)}**\n` +
        `• Proyeksi 5 Tahun (dengan bunga majemuk ~5%): **${formatRupiah(scenario.fiveYearProjection)}** 🎉`;
    }

    // 5. Bandingkan Bulan Lalu
    if (q.includes('bandingkan') || q.includes('lalu') || q.includes('tren')) {
      const analytics = await AnalyticsService.getMonthlyAnalytics(userId);
      const curExp = analytics.currentPeriod.totalExpenses;
      const prevExp = analytics.previousPeriod.totalExpenses;
      const diff = curExp - prevExp;

      let reply = `📊 **Perbandingan Pengeluaran:**\n`;
      reply += `• Bulan ini: **${formatRupiah(curExp)}**\n`;
      reply += `• Bulan lalu: **${formatRupiah(prevExp)}**\n`;
      if (diff > 0) {
        reply += `⚠️ Pengeluaranmu **naik ${analytics.previousPeriod.expenseChangePercentage}%** (+${formatRupiah(diff)}) dibandingkan bulan lalu.`;
      } else {
        reply += `✅ Pengeluaranmu **turun ${Math.abs(analytics.previousPeriod.expenseChangePercentage)}%** dibandingkan bulan lalu. Kerja bagus!`;
      }
      return reply;
    }

    // Default general summary
    const summary = await AtsService.getFinancialOverview(userId);
    return `Halo! Posisi keuanganmu saat ini:\n` +
      `• Total Saldo Tercatat: **${formatRupiah(summary.totalRecordedBalance)}**\n` +
      `• Aman Dibelanjakan: **${formatRupiah(summary.availableToSpend)}**\n` +
      `• Pemasukan Bulan Ini: **${formatRupiah(summary.incomeThisMonth)}**\n` +
      `• Pengeluaran Bulan Ini: **${formatRupiah(summary.expensesThisMonth)}**\n\n` +
      `Ada yang ingin kamu tanyakan lebih spesifik? Misalnya *"Berapa uang aman dipakai minggu ini?"* atau *"Kategori mana yang paling boros?"*`;
  }

  /**
   * Main conversation processor:
   * Uses Gemini LLM with authorized server-side financial context,
   * with seamless fallback to deterministic advisor.
   */
  static async askAssistant(userId: string, question: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is not configured, directly return deterministic guidance
    if (!apiKey) {
      return this.generateDeterministicAdvice(userId, question);
    }

    try {
      // Gather verified context from deterministic services
      const overview = await AtsService.getFinancialOverview(userId);
      const budgetStatus = await BudgetService.getActiveBudgetStatus(userId);
      const analytics = await AnalyticsService.getMonthlyAnalytics(userId);

      const systemPrompt = `Kamu adalah Rupia AI, asisten intelijen finansial pribadi yang ramah, objektif, dan berbasis data pasti.
Lokasi: Indonesia (Mata uang IDR, zona waktu Asia/Jakarta).
Aturan mutlak:
1. Hanya gunakan angka riil yang disediakan dalam DATA KEUANGAN di bawah. Jangan pernah mengarang angka atau transaksi!
2. Jawab dalam Bahasa Indonesia yang ringkas, jelas, dan suportif untuk pengguna smartphone.
3. Berikan saran praktis dan alasan yang jelas.

DATA KEUANGAN PENGGUNA TERVERIFIKASI:
- Total Saldo Tercatat: Rp ${overview.totalRecordedBalance.toLocaleString('id-ID')}
- Uang Aman Dibelanjakan (ATS): Rp ${overview.availableToSpend.toLocaleString('id-ID')} (Rekomendasi harian: Rp ${Number(overview.atsBreakdown.dailySafeToSpend).toLocaleString('id-ID')}/hari)
- Pemasukan Bulan Ini: Rp ${overview.incomeThisMonth.toLocaleString('id-ID')}
- Pengeluaran Bulan Ini: Rp ${overview.expensesThisMonth.toLocaleString('id-ID')}
- Rasio Tabungan: ${overview.savingsRatePercentage}%
- Status Anggaran: ${budgetStatus ? `${budgetStatus.overallPercentageUsed}% terpakai (${budgetStatus.status})` : 'Belum disetel'}
- Kategori Pengeluaran Terbesar: ${analytics.categories.slice(0, 3).map((c) => `${c.name}: Rp ${c.amount.toLocaleString('id-ID')} (${c.percentage}%)`).join(', ')}`;

      // Call Google Gemini REST endpoint directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nPertanyaan Pengguna: ${question}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600,
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn('[RUPIA AI] Gemini API returned error, falling back to deterministic advice.');
        return this.generateDeterministicAdvice(userId, question);
      }

      const resJson = await response.json();
      const answer = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      return answer || this.generateDeterministicAdvice(userId, question);
    } catch (err) {
      console.error('[RUPIA AI] Error contacting LLM API:', err);
      return this.generateDeterministicAdvice(userId, question);
    }
  }
}

