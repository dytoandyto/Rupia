'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  BarChart3,
  Target,
  ShieldCheck,
  Bot,
  FileSpreadsheet,
  Plus,
  Bell,
  Eye,
  EyeOff,
  User,
  LogOut,
  WifiOff,
  RefreshCw,
  Home,
  Receipt,
  Settings,
} from 'lucide-react';
import { syncPendingDrafts, getOfflineDrafts, OfflineDraft } from '@/lib/offline-sync';
import { useBalancePrivacy } from '@/lib/privacy-context';
import { formatDateIndo } from '@/lib/formatters';
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
  const { isBalanceHidden, toggleBalanceHidden } = useBalancePrivacy();

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

  // Desktop Sidebar Navigation Items
  const sidebarItems = [
    { href: '/beranda', label: 'Beranda', icon: LayoutDashboard },
    { href: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
    { href: '/dompet', label: 'Dompet & Kartu', icon: Wallet },
    { href: '/anggaran', label: 'Anggaran', icon: PieChart },
    { href: '/analitik', label: 'Analitik Finansial', icon: BarChart3 },
    { href: '/target', label: 'Target Finansial', icon: Target },
    { href: '/skor-kesehatan', label: 'Skor Kesehatan', icon: ShieldCheck },
    { href: '/ai', label: 'Asisten AI', icon: Bot },
    { href: '/impor', label: 'Impor Mutasi', icon: FileSpreadsheet },
  ];

  // Mobile Bottom Navigation (5 core thumb items)
  const mobileNavItems = [
    { href: '/beranda', label: 'Beranda', icon: Home },
    { href: '/transaksi', label: 'Transaksi', icon: Receipt },
    { href: '#add', label: 'Catat', icon: Plus, isAdd: true },
    { href: '/anggaran', label: 'Anggaran', icon: PieChart },
    { href: '/dompet', label: 'Dompet', icon: Wallet },
  ];

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) {
    return <main className="min-h-screen bg-app-bg text-text-primary">{children}</main>;
  }

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const currentDateFormatted = formatDateIndo(new Date());

  const getPageTitle = () => {
    if (pathname === '/beranda') return 'Beranda Finansial';
    if (pathname.startsWith('/transaksi')) return 'Riwayat Transaksi';
    if (pathname.startsWith('/dompet')) return 'Dompet & Kartu';
    if (pathname.startsWith('/anggaran')) return 'Perencanaan Anggaran';
    if (pathname.startsWith('/analitik')) return 'Analitik & Arus Kas';
    if (pathname.startsWith('/target')) return 'Target & Dana Darurat';
    if (pathname.startsWith('/skor-kesehatan')) return 'Skor Kesehatan Finansial';
    if (pathname.startsWith('/ai')) return 'Asisten Intelijen Rupia';
    if (pathname.startsWith('/impor')) return 'Impor Mutasi Bank';
    if (pathname.startsWith('/profil')) return 'Profil & Keamanan';
    if (pathname.startsWith('/notifikasi')) return 'Pemberitahuan';
    if (pathname.startsWith('/kategori')) return 'Kategori Transaksi';
    return 'Rupia Finance';
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col md:flex-row antialiased">
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (Visible on md and larger)                */}
      {/* ========================================================= */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 bg-surface-card border-r border-border-subtle z-50">
        <div className="flex flex-col flex-1 h-full min-h-0">
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-border-subtle">
            <Link href="/beranda" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-xs">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold tracking-tight text-text-primary leading-tight">
                  Rupia
                </span>
                <span className="text-[10px] font-medium text-text-secondary tracking-wide uppercase leading-none mt-0.5">
                  Fintech Pribadi
                </span>
              </div>
            </Link>

            {/* Privacy Mask Toggle in Sidebar */}
            <button
              type="button"
              onClick={toggleBalanceHidden}
              title={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container-low transition-colors"
            >
              {isBalanceHidden ? <EyeOff className="w-4 h-4 text-attention" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Primary Quick-Add Action Button */}
          <div className="p-4 border-b border-border-subtle">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium text-xs tracking-tight shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-none">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/beranda' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Offline / Sync Notification in Sidebar */}
          {!isOnline && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-tertiary-container text-text-primary text-[11px] flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 text-attention shrink-0" />
              <span>Mode Offline. Draft tersimpan lokal.</span>
            </div>
          )}

          {isOnline && offlineDrafts.length > 0 && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-primary-light text-primary text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{offlineDrafts.length} draft offline</span>
              </span>
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  await syncPendingDrafts();
                  const remaining = await getOfflineDrafts();
                  setOfflineDrafts(remaining);
                  setIsSyncing(false);
                }}
                className="underline font-semibold ml-1 shrink-0"
              >
                Sync
              </button>
            </div>
          )}

          {/* User Account Footer */}
          <div className="p-3 border-t border-border-subtle bg-surface-card flex items-center justify-between">
            <Link
              href="/profil"
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center border border-border-subtle shrink-0">
                {initialLetter}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || 'Pengguna Rupia'}
                </span>
                <span className="text-[11px] text-text-secondary truncate">
                  {user?.email || 'Akun Personal'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                await signOut({ redirect: false });
                router.push('/login');
              }}
              title="Keluar"
              className="p-1.5 rounded-lg text-text-secondary hover:text-negative hover:bg-error-container/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN VIEWPORT (Responsive on mobile & desktop)            */}
      {/* ========================================================= */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-h-screen">
        {/* Desktop Top Bar (Clean, art-directed header) */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-border-subtle bg-surface-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              {getPageTitle()}
            </h1>
            <span className="text-xs text-text-secondary px-2.5 py-0.5 rounded-full bg-surface-container border border-border-subtle font-normal">
              {currentDateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Mask Pill */}
            <button
              type="button"
              onClick={toggleBalanceHidden}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-surface-container-low hover:bg-surface-container border border-border-subtle transition-colors"
            >
              {isBalanceHidden ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-attention" />
                  <span>Saldo Tersembunyi</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Sembunyikan Saldo</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <Link
              href="/notifikasi"
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container-low border border-border-subtle transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-negative ring-2 ring-white" />
              )}
            </Link>

            {/* User Profile Pill */}
            <Link
              href="/profil"
              className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center border border-border-subtle hover:ring-2 hover:ring-primary/20 transition-all"
            >
              {initialLetter}
            </Link>
          </div>
        </header>

        {/* Mobile Top Header (Visible on phone < md) */}
        <header className="md:hidden sticky top-0 w-full z-40 pt-safe bg-surface-card/95 backdrop-blur-md border-b border-border-subtle">
          <div className="h-14 px-4 flex items-center justify-between">
            <Link href="/beranda" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-xs">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-text-primary">Rupia</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleBalanceHidden}
                aria-label="Sembunyikan atau tampilkan saldo"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                {isBalanceHidden ? <EyeOff className="w-4 h-4 text-attention" /> : <Eye className="w-4 h-4" />}
              </button>

              <Link
                href="/notifikasi"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-negative ring-2 ring-white" />
                )}
              </Link>

              <Link
                href="/profil"
                className="w-7 h-7 ml-1 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center border border-border-subtle"
              >
                {initialLetter}
              </Link>
            </div>
          </div>
        </header>

        {/* Offline Banner for Mobile */}
        {!isOnline && (
          <div className="md:hidden bg-tertiary-container text-text-primary px-4 py-2 text-xs flex items-center justify-between sticky top-14 z-30 border-b border-border-subtle">
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <WifiOff className="w-3.5 h-3.5 text-attention" />
              Offline. Draft tersimpan di memori perangkat.
            </span>
            {offlineDrafts.length > 0 && (
              <span className="bg-surface-card px-1.5 py-0.5 rounded text-[10px] font-bold border border-border-subtle">
                {offlineDrafts.length}
              </span>
            )}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 pb-28 md:pb-12">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Fixed 5 items on phone) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface-card/95 backdrop-blur-lg border-t border-border-subtle shadow-xs">
          <div className="h-16 px-2 flex items-center justify-around">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.isAdd) {
                return (
                  <div key="quick-add" className="flex items-center justify-center -mt-5">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddOpen(true)}
                      aria-label="Catat Transaksi Cepat"
                      className="w-12 h-12 rounded-full bg-primary text-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-1 transition-colors ${
                    isActive ? 'text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick Add Bottom Sheet Modal */}
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
