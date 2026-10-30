'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface InstallPwaProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function InstallPwaModal({ forceOpen = false, onClose }: InstallPwaProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|edgios/.test(ua);
    setIsIos(isIosDevice && isSafari);

    // 3. Listen for Android/Chrome/Edge beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check dismissal cooldown (7 days)
      const dismissedUntil = localStorage.getItem('rupia_pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        setIsOpen(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check for iOS first-visit banner if not dismissed
    if (isIosDevice && isSafari) {
      const dismissedUntil = localStorage.getItem('rupia_pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        // Show after 3 seconds on iOS
        const timer = setTimeout(() => setIsOpen(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // Handle installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsOpen(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Snooze for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('rupia_pwa_dismissed_until', nextWeek.toString());
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (isInstalled && !forceOpen) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border border-border-subtle rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full bg-surface-base hover:bg-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary absolute top-4 right-4 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary-forest text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-text-primary">Pasang Aplikasi Rupia</h3>
            <p className="text-xs text-text-secondary">Akses cepat &amp; hemat kuota dari layar utama</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 text-xs text-text-secondary bg-surface-base rounded-2xl p-4 border border-border-subtle">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary-forest shrink-0" />
            <span>Pencatatan cepat satu ketukan tanpa address bar</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary-forest shrink-0" />
            <span>Bekerja offline saat sinyal minim atau dalam perjalanan</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary-forest shrink-0" />
            <span>Aman, privat, dan tanpa beban memori perangkat</span>
          </div>
        </div>

        {/* Platform Specific Instructions */}
        {isIos ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-text-primary">Panduan Pemasangan Safari iOS:</p>
            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary-forest font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Bagikan</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-primary-forest" /> di bilah navigasi Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary-forest font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Gulir ke bawah dan ketuk <strong>&quot;Tambah ke Layar Utama&quot;</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-primary-forest" />.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary-forest font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Ketuk <strong>&quot;Tambah&quot;</strong> di pojok kanan atas. Selesai!</span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2.5 bg-surface-base hover:bg-border-subtle text-text-primary rounded-xl text-xs font-semibold border border-border-subtle transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-primary-forest hover:bg-primary-deep text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Pasang Sekarang ke Perangkat</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-text-secondary hover:text-text-primary text-xs font-medium"
            >
              Nanti Saja
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-text-secondary text-center">
              Untuk memasang, buka menu browser Anda (titik tiga) lalu pilih <strong>&quot;Install App&quot;</strong> atau{' '}
              <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
            </p>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 bg-surface-base hover:bg-border-subtle text-text-primary rounded-xl text-xs font-semibold border border-border-subtle transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

