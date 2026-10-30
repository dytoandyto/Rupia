'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  Coffee,
  HelpCircle,
  Bot,
  User,
  Sparkles,
  PieChart,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Halo! Saya **Asisten Intelijen Finansial Rupia**.\n\nSaya menganalisis saldo riil dompet, mutasi transaksi, dan batas pos anggaranmu secara faktual. Silakan ajukan pertanyaan seputar arus kas atau pilih topik analisis di bawah.',
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickQuestions = [
    { text: 'Kenapa uangku cepat habis bulan ini?', icon: TrendingDown },
    { text: 'Berapa uang yang aman dibelanjakan minggu ini?', icon: ShieldCheck },
    { text: 'Pos pengeluaran mana yang melampaui rencana?', icon: PieChart },
    { text: 'Jika hemat kopi Rp15.000 sehari, berapa proyeksi tabunganku?', icon: Coffee },
    { text: 'Bandingkan total pengeluaran bulan ini dengan bulan lalu.', icon: Sparkles },
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      if (res.ok) {
        const json = await res.json();
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: json.answer,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Maaf, terjadi kendala saat menghubungkan data ledger. Silakan coba kembali sesaat lagi.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Terjadi gangguan jaringan lokal saat memproses data.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] justify-between space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center border border-border-subtle">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary tracking-tight">
                Asisten Analisis Finansial
              </h1>
              <span className="text-[11px] text-text-secondary">
                Dianalisis berbasis data riil mutasi dan saldo tercatat
              </span>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-primary text-white rounded-tr-none shadow-xs font-medium'
                      : 'bg-surface-card text-text-primary border border-border-subtle rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-surface-container text-text-secondary flex items-center justify-center shrink-0 mt-0.5 border border-border-subtle">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-surface-card rounded-2xl p-3 text-xs text-text-secondary flex items-center gap-2 border border-border-subtle">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Menganalisis catatan keuangan...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="py-1 flex gap-2 overflow-x-auto scrollbar-none">
          {quickQuestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                className="bg-surface-card hover:bg-surface-container border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span>{q.text}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ajukan pertanyaan mengenai pengeluaran atau anggaranmu..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-surface-card border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center shadow-xs disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}
