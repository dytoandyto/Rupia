'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 shadow-xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-black text-on-surface tracking-tight">Akun Terhubung Google</h1>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Rupia tidak menyimpan kata sandi. Keamanan akun Anda dikelola langsung melalui akun Google Anda.
          </p>
        </div>

        <Link
          href="/login"
          className="w-full py-3 bg-primary-container hover:bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </div>
    </div>
  );
}
