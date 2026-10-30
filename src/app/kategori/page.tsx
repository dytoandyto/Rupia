'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Utensils,
  Fuel,
  ShoppingBag,
  Zap,
  Coffee,
  HeartPulse,
  Briefcase,
  Laptop,
  TrendingUp,
  X,
  RefreshCw,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';

export default function KategoriPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [color, setColor] = useState('#176B4D');
  const [icon, setIcon] = useState('Tag');
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories || []);
      }
    } catch (err) {
      console.error('[LOAD CATEGORIES ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          color,
          icon,
          type: activeTab,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        loadCategories();
      }
    } catch {
      alert('Gagal menambahkan kategori');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <MobileShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Master Kategori Transaksi
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Klasifikasi pos pengeluaran dan pemasukan untuk akurasi laporan keuangan.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Kategori Baru</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-card p-1 rounded-xl border border-border-subtle max-w-xs text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'EXPENSE'
                ? 'bg-primary text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pengeluaran ({categories.filter((c) => c.type === 'EXPENSE').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'INCOME'
                ? 'bg-primary text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pemasukan ({categories.filter((c) => c.type === 'INCOME').length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredCategories.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-surface-card border border-border-subtle shadow-xs flex items-center justify-between hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle"
                    style={{ backgroundColor: `${c.color || '#176B4D'}15`, color: c.color || '#176B4D' }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-text-primary">{c.name}</h3>
                    <span className="text-[10px] text-text-secondary">
                      {c.isDefault ? 'Kategori Bawaan' : 'Kustom Pengguna'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Category Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-card p-6 border border-border-subtle shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-bold text-sm text-text-primary">Tambah Kategori Baru</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: Langganan Streaming, Kopi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">Warna Aksen</label>
                  <div className="flex gap-2">
                    {['#176B4D', '#104A37', '#2471A3', '#7D3C98', '#A86B18', '#C44747'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setColor(hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          color === hex ? 'scale-110 border-text-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container-low"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
