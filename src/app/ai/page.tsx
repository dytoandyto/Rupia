'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  Coffee,
  HelpCircle,
  Bot,
  User,
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
        'Halo! Saya **Rupia AI**, asisten intelijen keuangan pribadimu.\n\nSaya memantau saldo dompet, catatan pengeluaran, dan anggaranmu secara riil. Tanyakan apapun tentang kondisi finansialmu atau pilih saran pertanyaan di bawah!',
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
    { text: 'Kenapa uangku cepat habis?', icon: TrendingDown },
    { text: 'Berapa uang yang aman dipakai minggu ini?', icon: ShieldCheck },
    { text: 'Kategori mana yang paling boros?', icon: HelpCircle },
    { text: 'Kalau aku mengurangi kopi Rp10.000 sehari, berapa tabungan tambahanku?', icon: Coffee },
    { text: 'Bandingkan pengeluaranku bulan ini dan bulan lalu.', icon: Sparkles },
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
          content: 'Maaf, terjadi gangguan saat menganalisis data keuanganmu. Silakan coba lagi sebentar lagi.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('[AI CHAT ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex flex-col h-[calc(100vh-140px)] justify-between">
        {/* Chat Header */}
        <div className="pt-1 pb-2 border-b border-surface-variant/40 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              Rupia AI Assistant
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            </h1>
            <p className="text-[10px] text-on-surface-variant">Intelijen Finansial Berbasis Angka Pasti</p>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-primary-container text-white font-medium rounded-tr-none shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface border border-surface-variant/40 rounded-tl-none space-y-1 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 mt-0.5 border border-secondary/20">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-surface-container-low rounded-2xl p-3 text-xs text-on-surface-variant flex items-center gap-2 border border-surface-variant/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-container" />
                <span>Rupia AI sedang menganalisis data ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickQuestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                className="bg-surface-container-lowest hover:bg-surface-container-low border border-surface-variant/40 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-on-surface-variant whitespace-nowrap flex items-center gap-1.5 active:scale-95 transition-all shrink-0 shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-primary-container" />
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
              placeholder="Tanya kondisi keuanganmu..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-surface-container-lowest border border-outline/20 rounded-2xl px-4 py-3 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-primary-container hover:bg-primary active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center shadow-xs disabled:opacity-40 transition-transform"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}

