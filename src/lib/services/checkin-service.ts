import prisma from '../db';
import { AtsService } from './ats-service';

export interface SubmitCheckInInput {
  hasIncome: boolean;
  hasExpenses: boolean;
  hasUnrecorded: boolean;
  walletReconciled: boolean;
  note?: string;
}

export class CheckInService {
  /**
   * Retrieves or initializes the user's notification & check-in preferences.
   */
  static async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          reminderTime: '20:30',
          activeDays: '1,2,3,4,5,6,7',
          pushEnabled: true,
          inAppEnabled: true,
        },
      });
    }

    return pref;
  }

  /**
   * Updates user notification preferences.
   */
  static async updatePreferences(
    userId: string,
    data: {
      reminderTime?: string;
      activeDays?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    }
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Records a completed daily check-in and generates a summary notification.
   */
  static async submitDailyCheckIn(userId: string, input: SubmitCheckInInput) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId,
        date: today,
        hasIncome: input.hasIncome,
        hasExpenses: input.hasExpenses,
        hasUnrecorded: input.hasUnrecorded,
        walletReconciled: input.walletReconciled,
        note: input.note,
        completedAt: today,
      },
    });

    // Generate in-app confirmation notification
    const ats = await AtsService.calculateAvailableToSpend(userId);

    await prisma.notification.create({
      data: {
        userId,
        title: 'Check-In Harian Selesai 🎉',
        message: `Catatan keuangan hari ini telah tersinkronisasi. Sisa dana aman: Rp ${Number(ats.availableToSpend).toLocaleString('id-ID')}.`,
        type: 'DAILY_CHECKIN',
        actionUrl: '/beranda',
      },
    });

    return checkIn;
  }

  /**
   * Checks whether the user has completed their check-in today.
   */
  static async hasCheckedInToday(userId: string): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const existing = await prisma.dailyCheckIn.findFirst({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });

    return !!existing;
  }
}

