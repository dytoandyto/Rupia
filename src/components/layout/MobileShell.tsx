'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { syncPendingDrafts, getOfflineDrafts, OfflineDraft } from '@/lib/offline-sync';
import QuickAddSheet from '../sheets/QuickAddSheet';

interface MobileShellProps {
  children: React.ReactNode;
  user?: { name: string; email: string; avatarUrl?: string } | null;
  unreadNotifsCount?: number;
}

export default function MobileShell({
  children,
  user,
  unreadNotifsCount = 0,
}: MobileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await syncPendingDrafts();
      const remaining = await getOfflineDrafts();
      setOfflineDrafts(remaining);
      setIsSyncing(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    getOfflineDrafts().then(setOfflineDrafts);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { href: '/beranda', label: 'Beranda', icon: 'home' },
    { href: '/transaksi', label: 'Transaksi', icon: 'receipt_long' },
    { href: '#add', label: 'Catat', icon: 'add', isAdd: true },
    { href: '/anggaran', label: 'Anggaran', icon: 'pie_chart' },
    { href: '/dompet', label: 'Dompet', icon: 'account_balance_wallet' },
  ];

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) {
    return <main className="min-h-screen bg-surface text-on-surface">{children}</main>;
  }

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-surface-dim/40 text-on-surface flex justify-center antialiased">
      {/* Smartphone Viewport Constrained Container (Mobile First) */}
      <div className="w-full max-w-md min-h-screen bg-surface flex flex-col relative pb-28 shadow-xl overflow-x-hidden border-x border-surface-variant/40">

        {/* Top Header matching Stitch Approved Spec */}
        <header className="sticky top-0 w-full z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-variant/30">
          <div className="h-16 px-margin flex items-center justify-between">
            {/* Brand Logo & App Label */}
            <Link href="/beranda" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary font-bold shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance_wallet
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-bold text-on-surface leading-tight tracking-tight">Rupia</span>
                <span className="text-[10px] font-semibold text-outline tracking-wider uppercase leading-none mt-0.5">
                  Personal Finance
                </span>
              </div>
            </Link>

            {/* Notification & Profile Header Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => router.push('/notifikasi')}
                aria-label="Notifikasi"
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/profil')}
                aria-label="Profil Pengguna"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:ring-2 hover:ring-primary-container/30 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container/15 text-primary-container font-bold text-xs flex items-center justify-center ring-1 ring-primary-container/30">
                  {initialLetter}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Offline & Sync Notification Banner */}
        {!isOnline && (
          <div className="bg-tertiary-container text-on-tertiary px-4 py-2 text-xs flex items-center justify-between sticky top-16 z-30 backdrop-blur-md">
            <span className="flex items-center gap-1.5 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              Mode Offline Aktif. Transaksi disimpan lokal.
            </span>
            {offlineDrafts.length > 0 && (
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                {offlineDrafts.length} draft
              </span>
            )}
          </div>
        )}

        {isOnline && offlineDrafts.length > 0 && (
          <div className="bg-primary-container text-on-primary px-4 py-2 text-xs flex items-center justify-between sticky top-16 z-30 backdrop-blur-md">
            <span className="flex items-center gap-1.5 font-medium">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkronkan draft offline...' : `${offlineDrafts.length} draft offline tersimpan.`}
            </span>
            {!isSyncing && (
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  await syncPendingDrafts();
                  const remaining = await getOfflineDrafts();
                  setOfflineDrafts(remaining);
                  setIsSyncing(false);
                }}
                className="bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 px-2 py-0.5 rounded text-[11px] font-semibold"
              >
                Sinkronkan
              </button>
            )}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 px-margin pt-4">{children}</main>

        {/* Mobile Bottom Navigation Bar (Stitch Approved Spec) */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-surface-variant/40"
          data-active-classes="text-primary font-semibold"
        >
          <div className="h-16 px-space-sm flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              if (item.isAdd) {
                return (
                  <div key="quick-add" className="flex items-center justify-center -mt-5">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddOpen(true)}
                      aria-label="Catat Transaksi Cepat"
                      className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-primary-container text-on-primary shadow-[0_8px_20px_-2px_rgba(22,122,85,0.35)] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[28px]">add</span>
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-colors ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[24px] ${
                      isActive ? 'fill' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick Add Bottom Sheet */}
        <QuickAddSheet
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onSuccess={() => {
            setIsQuickAddOpen(false);
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
