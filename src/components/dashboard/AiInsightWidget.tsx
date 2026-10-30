'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AiInsightWidgetProps {
  observation: string;
  recommendation: string;
}

export default function AiInsightWidget({ observation, recommendation }: AiInsightWidgetProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative rounded-2xl bg-surface-container-low p-4 shadow-sm overflow-hidden border border-surface-variant/30">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-tertiary font-bold tracking-wide uppercase">
              Rupia AI Insight
            </span>
            <span className="text-[10px] text-outline">Hari ini</span>
          </div>

          <h3 className="text-[14px] font-bold text-on-surface mt-1 leading-snug">
            {observation}
          </h3>

          <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
            {recommendation}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <Link
              href="/ai"
              className="inline-flex items-center gap-1 text-[12px] text-primary font-semibold hover:underline"
            >
              <span>Lihat Rekomendasi AI</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>

            <button
              type="button"
              aria-label="Abaikan"
              onClick={() => setIsDismissed(true)}
              className="text-on-surface-variant/60 hover:text-on-surface transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
