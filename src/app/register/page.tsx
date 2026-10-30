'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect to Google login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 shadow-xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-black text-on-surface tracking-tight">Autentikasi Aman Rupia</h1>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Demi keamanan data finansial Anda, Rupia menggunakan single sign-on resmi Google. Anda tidak perlu membuat password baru.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full py-3 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span>Lanjutkan dengan Google</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
