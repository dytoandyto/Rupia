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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant absolute top-4 right-4 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance_wallet
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-on-surface">Pasang Aplikasi Rupia</h3>
            <p className="text-xs text-on-surface-variant">Akses cepat langsung dari layar utama</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 text-xs text-on-surface-variant bg-surface-container-low/60 rounded-2xl p-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Pencatatan lebih cepat &amp; layar penuh tanpa URL bar</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Mode offline untuk mencatat saat tidak ada sinyal</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>Aman, ringan, dan tidak memakan memori ponsel</span>
          </div>
        </div>

        {/* Platform Specific Instructions */}
        {isIos ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-on-surface">Panduan Pemasangan Safari iOS:</p>
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-container/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Bagikan</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-primary" /> di bilah bawah Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-container/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-primary" />.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-container/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Ketuk <strong>&quot;Tambah&quot;</strong> di pojok kanan atas layar. Selesai!</span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-primary-container hover:bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Pasang Sekarang ke Ponsel</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-on-surface-variant hover:text-on-surface text-xs font-medium"
            >
              Nanti Saja
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-on-surface-variant text-center">
              Untuk memasang, buka menu browser Anda (titik tiga) lalu pilih <strong>&quot;Install App&quot;</strong> atau{' '}
              <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
            </p>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

