'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Skor Kesehatan Finansial
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Indikator stabilitas arus kas, kedisiplinan anggaran, dan ketahanan finansial.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : !report ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-card border border-border-subtle text-center text-xs text-text-secondary shadow-xs">
            Gagal memuat indikator kesehatan finansial.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Score Card Column (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Data Completeness Notice */}
              {!report.isDataSufficient && (
                <div className="bg-tertiary-container border border-attention/20 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-text-primary shadow-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-attention mt-0.5" />
                  <div>
                    <span className="font-semibold block">Catatan Kelengkapan Data:</span>
                    <span className="text-text-secondary leading-relaxed">
                      {report.dataCompletenessMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Master Gauge Card (Matte Dark Banking Style) */}
              <div className="bg-card-dark text-white rounded-2xl p-6 sm:p-7 text-center space-y-3.5 border border-white/10 shadow-xs">
                <span className="text-xs font-medium text-white/70 uppercase tracking-wider block">
                  Indikator Finansial Terpadu
                </span>

                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-5xl sm:text-6xl font-bold tabular-nums text-white">
                    {report.score}
                  </span>
                  <span className="text-sm font-medium text-white/60 mt-4">/ 100</span>
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">
                    {report.rating}
                  </span>
                </div>

                <p className="text-xs text-white/70 max-w-xs mx-auto pt-2 leading-relaxed">
                  Dihitung dari 5 dimensi aktuaria perbankan: kepatuhan anggaran, konsistensi menabung, rasio likuiditas, pola belanja, dan integritas pencatatan.
                </p>
              </div>
            </div>

            {/* Right Factor Dimensions Column (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Faktor Penilaian &amp; Penjelasan Transparan
              </h3>

              <div className="space-y-3">
                {report.dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-text-primary">
                          {dim.name}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          (Bobot {dim.weight}%)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {dim.score} / 100
                      </span>
                    </div>

                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {dim.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
