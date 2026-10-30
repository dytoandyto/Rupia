'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  ChevronLeft,
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
  const [color, setColor] = useState('#10b981');
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
    } catch (err) {
      console.error('[CREATE CATEGORY ERROR]', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Link href="/profil" className="p-1 text-outline hover:text-on-surface">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-on-surface tracking-tight">Kategori Transaksi</h1>
              <p className="text-xs text-on-surface-variant">Atur pos pengeluaran & pemasukan</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-primary-container hover:bg-primary text-white font-bold rounded-xl flex items-center gap-1 text-xs active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-surface-container-high p-1 rounded-2xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('EXPENSE')}
            className={`flex-1 py-2 rounded-xl transition-colors ${
              activeTab === 'EXPENSE' ? 'bg-error text-white font-bold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pengeluaran ({categories.filter((c) => c.type === 'EXPENSE').length})
          </button>
          <button
            onClick={() => setActiveTab('INCOME')}
            className={`flex-1 py-2 rounded-xl transition-colors ${
              activeTab === 'INCOME' ? 'bg-primary text-white font-bold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pemasukan ({categories.filter((c) => c.type === 'INCOME').length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-container-lowest border border-surface-variant/40 p-3 rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color || '#6f7a72' }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-on-surface block">{cat.name}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {cat.isDefault ? 'Kategori Bawaan' : 'Kategori Kustom'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface">
                Tambah Kategori {activeTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-outline hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-on-surface-variant block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Belanja Online, Donasi, Gym"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1">Warna Aksen</label>
                <div className="flex gap-2">
                  {['#167a55', '#005f40', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ba1a1a'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-on-surface' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-surface-variant/30">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary-container hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

