'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ShieldCheck, RefreshCw, AlertCircle, Wallet, ArrowRight } from 'lucide-react';

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
    <div className="w-full max-w-sm bg-surface-card border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mx-auto shadow-xs">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Rupia</h1>
          <p className="text-xs text-text-secondary mt-1 max-w-[260px] mx-auto leading-relaxed">
            Manajemen finansial pribadi yang tenang, presisi, dan terpercaya.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-error-container border border-negative/20 text-text-primary text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-negative shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-negative">Gagal Masuk</p>
            <p className="text-text-secondary leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Google Login Button */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || devLoading}
          aria-label="Lanjutkan dengan Google"
          className="w-full py-3 px-4 bg-white hover:bg-surface-container border border-border-subtle text-text-primary rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5 shrink-0" />
          )}
          <span>{loading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
        </button>

        {/* Development Mode Simulation Button */}
        {process.env.NODE_ENV !== 'production' && (
          <button
            type="button"
            onClick={handleDevGoogleLogin}
            disabled={loading || devLoading}
            className="w-full py-2 px-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {devLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            )}
            <span>Masuk Demo (Budi Santoso)</span>
          </button>
        )}
      </div>

      {/* Security & Privacy Reassurance */}
      <div className="p-3.5 bg-surface-container rounded-xl border border-border-subtle/60 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-primary font-semibold">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Privasi &amp; Perlindungan Data</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Rupia hanya mengakses profil dasar (nama &amp; email) untuk otentikasi. Data finansial Anda terenkripsi dan tidak pernah dibagikan kepada pihak ketiga.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col justify-center items-center px-4 py-8">
      <Suspense
        fallback={
          <div className="w-full max-w-sm bg-surface-card rounded-2xl p-8 border border-border-subtle shadow-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-text-secondary font-medium">Memuat Rupia...</p>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
