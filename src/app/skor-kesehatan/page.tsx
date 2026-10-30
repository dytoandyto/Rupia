'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { FinancialHealthReport } from '@/lib/services/health-score-service';

export default function SkorKesehatanPage() {
  const [report, setReport] = useState<FinancialHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health-score')
      .then((r) => r.json())
      .then((d) => setReport(d.report))
      .catch((err) => console.error('[HEALTH SCORE ERROR]', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/beranda" className="p-1 text-outline hover:text-on-surface">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Skor Kesehatan Finansial</h1>
            <p className="text-xs text-on-surface-variant">Indikator transparansi & stabilitas arus kas</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : !report ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 p-6 rounded-3xl text-center text-xs text-on-surface-variant shadow-xs">
            Gagal memuat indikator kesehatan finansial.
          </div>
        ) : (
          <>
            {/* Data Completeness Notice */}
            {!report.isDataSufficient && (
              <div className="bg-tertiary-fixed/40 border border-tertiary/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-on-tertiary-fixed shadow-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-tertiary mt-0.5" />
                <div>
                  <span className="font-bold block">Data Awal Terbatas:</span>
                  {report.dataCompletenessMessage}
                </div>
              </div>
            )}

            {/* Giant Score Gauge Card - Deep Forest Luxury Obsidian */}
            <div className="bg-inverse-surface border border-surface-variant/20 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden shadow-[0_8px_30px_rgb(20,30,26,0.12)] text-surface-bright">
              <span className="text-xs font-bold text-surface-dim uppercase tracking-wider block">
                Indikator Keseluruhan (0 - 100)
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-black font-mono tracking-tight text-surface-bright">
                  {report.score}
                </span>
                <span className="text-sm font-semibold text-surface-dim mt-3">/ 100</span>
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-black/40 border border-white/10 ${report.ratingColor}`}
                >
                  {report.rating}
                </span>
              </div>

              <p className="text-[11px] text-surface-dim max-w-xs mx-auto pt-1 leading-relaxed">
                Skor dihitung secara matematis dari 5 dimensi: kepatuhan anggaran, konsistensi menabung, cakupan tagihan, laju belanja, dan kelengkapan catatan.
              </p>
            </div>

            {/* 5 Explainable Dimensions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Faktor Penilaian & Bobot
              </h3>

              <div className="space-y-2.5">
                {report.dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-4 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-on-surface">{dim.name}</span>
                        <span className="text-[10px] text-outline font-mono">
                          (Bobot {(dim.weight * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-primary-container">
                        {dim.score}/100
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          dim.score >= 80 ? 'bg-primary-container' : dim.score >= 60 ? 'bg-tertiary-fixed-dim' : 'bg-error'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-normal">{dim.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvement Actions */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              {report.strengths.length > 0 && (
                <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Kekuatan Finansialmu:
                  </span>
                  {report.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-on-surface leading-relaxed">
                      • {s}
                    </p>
                  ))}
                </div>
              )}

              {report.improvements.length > 0 && (
                <div className="bg-tertiary-fixed/30 border border-tertiary/20 rounded-2xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Rekomendasi Peningkatan:
                  </span>
                  {report.improvements.map((imp, i) => (
                    <p key={i} className="text-xs text-on-surface leading-relaxed">
                      • {imp}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
}

