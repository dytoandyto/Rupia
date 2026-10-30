'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getOfflineDrafts, syncPendingDrafts } from '@/lib/offline-sync';

export default function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkPendingDrafts = async () => {
    try {
      const drafts = await getOfflineDrafts();
      setPendingCount(drafts.length);
    } catch {
      setPendingCount(0);
    }
  };

  const performSync = async () => {
    if (!navigator.onLine) return;
    try {
      const drafts = await getOfflineDrafts();
      if (drafts.length === 0) return;

      setIsSyncing(true);
      const result = await syncPendingDrafts();
      await checkPendingDrafts();

      if (result.success > 0) {
        setSyncSuccessMsg(`${result.success} transaksi offline berhasil disinkronkan ke server!`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('[OFFLINE SYNC ERROR]', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    checkPendingDrafts();

    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPendingDrafts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      checkPendingDrafts();
      if (navigator.onLine) {
        performSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !syncSuccessMsg && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm pointer-events-auto">
      {!isOnline && (
        <div className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30 shadow-lg px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-tertiary" />
            <div>
              <p>Mode Offline Aktif</p>
              <p className="text-[10px] font-normal text-on-tertiary-fixed/80">
                {pendingCount > 0 ? `${pendingCount} transaksi tersimpan lokal` : 'Transaksi baru akan disimpan lokal'}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-tertiary-container text-white px-2 py-0.5 rounded-full font-bold">
            Lokal
          </span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="bg-primary-container text-on-primary shadow-lg px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-on-primary" />
          <span>Menyinkronkan transaksi lokal ke server...</span>
        </div>
      )}

      {isOnline && syncSuccessMsg && (
        <div className="bg-primary text-on-primary shadow-lg px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary-fixed" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}
    </div>
  );
}
