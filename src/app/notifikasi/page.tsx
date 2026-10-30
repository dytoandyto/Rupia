'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronLeft,
  CalendarCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { formatRelativeDateIndo } from '@/lib/formatters';

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d) => {
        // Mock / fetch notifs
        setNotifications([
          {
            id: '1',
            title: 'Waktunya Check-In 20:30',
            message: 'Evaluasi pengeluaranmu hari ini untuk menjaga akurasi Available-to-Spend.',
            type: 'DAILY_CHECKIN',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Pos Anggaran Makanan & Minuman',
            message: 'Pengeluaran kategori Makanan & Minuman berjalan sesuai rencana batas harian.',
            type: 'BUDGET_ALERT',
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        <div className="flex items-center gap-2 pt-1">
          <Link href="/beranda" className="p-1 text-outline hover:text-on-surface">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Notifikasi & Pengingat</h1>
            <p className="text-xs text-on-surface-variant">Pengingat harian 20:30 & sinyal anggaran</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 p-8 rounded-3xl text-center text-xs text-on-surface-variant shadow-xs">
            Tidak ada notifikasi baru saat ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-surface-container-lowest border border-surface-variant/40 p-4 rounded-2xl flex items-start gap-3 shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface truncate">{n.title}</span>
                    <span className="text-[10px] text-outline">{formatRelativeDateIndo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

