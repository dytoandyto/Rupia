'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error in query string
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'AccessDenied') {
        setErrorMessage('Otorisasi Google dibatalkan atau ditolak. Silakan coba kembali.');
      } else if (error === 'OAuthCallback') {
        setErrorMessage('Gagal memproses respons dari Google. Periksa koneksi internet Anda.');
      } else if (error === 'Configuration') {
        setErrorMessage('Konfigurasi Google Client ID belum lengkap di environment.');
      } else if (error === 'SessionExpired') {
        setErrorMessage('Sesi masuk Anda telah berakhir. Silakan masuk kembali dengan Google.');
      } else {
        setErrorMessage('Terjadi kendala saat menghubungkan akun Google. Silakan coba lagi.');
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setLoading(true);
      await signIn('google', {
        callbackUrl: '/beranda',
      });
    } catch (err) {
      console.error('[GOOGLE SIGNIN ERROR]', err);
      setErrorMessage('Tidak dapat membuka login Google. Silakan periksa koneksi internet Anda.');
      setLoading(false);
    }
  };

  // Local Dev / Demo Helper when Google credentials are not set up
  const handleDevGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      setDevLoading(true);
      const res = await fetch('/api/auth/google-dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo.google@rupia.id',
          name: 'Budi Santoso',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(data.redirectUrl || '/beranda');
        router.refresh();
      } else {
        setErrorMessage(data.error || 'Simulasi login gagal');
      }
    } catch {
      setErrorMessage('Gagal menghubungi server lokal.');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      {/* Top Emerald Ambient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-primary to-primary-fixed" />

      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mx-auto shadow-lg shadow-primary-container/20 ring-4 ring-primary-container/10">
          <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance_wallet
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">Rupia</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Know your money. Own your future.</p>
        </div>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="bg-error/10 border border-error/30 text-on-surface text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-error">Gagal Masuk</p>
            <p className="text-on-surface-variant leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Google Login Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || devLoading}
          aria-label="Lanjutkan dengan Google"
          className="w-full py-3.5 px-4 bg-white hover:bg-surface border border-outline/30 text-on-surface rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 text-primary-container animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5 shrink-0" />
          )}
          <span>{loading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
        </button>

        {/* Development Mode Simulation Button */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDevGoogleLogin}
              disabled={loading || devLoading}
              className="w-full py-2.5 px-3 bg-surface-container-low hover:bg-surface-container border border-surface-variant text-on-surface-variant hover:text-on-surface rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {devLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              )}
              <span>⚡ Masuk Akun Google (Simulasi Dev)</span>
            </button>
          </div>
        )}
      </div>

      {/* Security & Privacy Reassurance */}
      <div className="bg-surface-container-low/70 border border-surface-variant/40 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 text-primary-container" />
          <span>Keamanan & Privasi Terjamin</span>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          Rupia hanya meminta identitas profil dasar (nama & email). Data keuangan Anda terenkripsi dan terisolasi privat. Kami tidak pernah membagikan data Anda ke pihak ketiga.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span>Multi-Dompet Otomatis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span>OCR Nota Cerdas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span>Skor Finansial ATS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-container shrink-0" />
          <span>Asisten AI Finansial</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 py-8 relative">
      <Suspense
        fallback={
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Memuat Rupia...</p>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
