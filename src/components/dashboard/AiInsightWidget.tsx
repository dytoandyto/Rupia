'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight, X } from 'lucide-react';

interface AiInsightWidgetProps {
  observation: string;
  recommendation: string;
}

export default function AiInsightWidget({ observation, recommendation }: AiInsightWidgetProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="relative rounded-2xl bg-surface-card p-4 sm:p-5 border border-border-subtle shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <Bot className="w-4 h-4 text-primary" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-primary font-bold tracking-wider uppercase">
              Rupia Financial Intelligence
            </span>
            <button
              type="button"
              aria-label="Tutup rekomendasi"
              onClick={() => setIsDismissed(true)}
              className="text-text-secondary hover:text-text-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="text-xs font-semibold text-text-primary mt-1 leading-snug">
            {observation}
          </h3>

          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {recommendation}
          </p>

          <div className="mt-3">
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              <span>Konsultasikan dengan Asisten AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
