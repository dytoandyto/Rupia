'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
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
      .then(() => {
        setNotifications([
          {
            id: '1',
            title: 'Waktunya Check-In 20:30 WIB',
            message: 'Evaluasi mutasi pengeluaranmu hari ini agar kalkulasi sisa aman belanja esok hari tetap presisi.',
            type: 'DAILY_CHECKIN',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Status Anggaran Makanan & Minuman',
            message: 'Pengeluaran kategori konsumsi berada pada 45% batas aman bulan berjalan.',
            type: 'BUDGET_ALERT',
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MobileShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Pemberitahuan &amp; Pengingat
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Jadwal evaluasi rutin, sinyal batas anggaran, dan catatan sistem.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-card border border-border-subtle text-center text-xs text-text-secondary shadow-xs">
            Belum ada pemberitahuan baru saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle flex items-start gap-3.5 shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text-primary truncate">{n.title}</span>
                    <span className="text-[11px] text-text-secondary">{formatRelativeDateIndo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
