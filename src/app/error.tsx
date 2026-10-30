'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 text-center">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-8 shadow-xl space-y-4">
        <AlertTriangle className="w-10 h-10 text-tertiary mx-auto" />
        <h2 className="text-base font-bold text-on-surface">Terjadi Kendala Sistem</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Sistem mengalami kendala sementara saat memproses data. Integritas saldo tetap aman.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}

