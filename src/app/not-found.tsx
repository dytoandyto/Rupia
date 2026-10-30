'use client';

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 text-center">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-8 shadow-xl space-y-4">
        <span className="text-4xl font-black font-mono text-primary">404</span>
        <h2 className="text-base font-bold text-on-surface">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Halaman yang kamu tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/beranda"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

