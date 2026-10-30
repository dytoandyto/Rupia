'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Camera,
  FileSpreadsheet,
  Sparkles,
  Delete,
  Check,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { saveOfflineDraft } from '@/lib/offline-sync';
import ReceiptCameraModal from '../camera/ReceiptCameraModal';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAddSheet({ isOpen, onClose, onSuccess }: QuickAddSheetProps) {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amountStr, setAmountStr] = useState('0');
  const [description, setDescription] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedDestinationWalletId, setSelectedDestinationWalletId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isEssential, setIsEssential] = useState(true);
  const [naturalText, setNaturalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Wallets & Categories
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load wallets & categories
    fetch('/api/wallets')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallets && data.wallets.length > 0) {
          setWallets(data.wallets);
          if (!selectedWalletId) setSelectedWalletId(data.wallets[0].id);
          if (!selectedDestinationWalletId && data.wallets.length > 1) {
            setSelectedDestinationWalletId(data.wallets[1].id);
          }
        }
      })
      .catch(() => {});

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          const firstExp = data.categories.find((c: { type: string }) => c.type === 'EXPENSE');
          if (firstExp && !selectedCategoryId) setSelectedCategoryId(firstExp.id);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Keypad Handlers
  const handleKeypadPress = (key: string) => {
    if (key === 'BACKSPACE') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === 'CLEAR') {
      setAmountStr('0');
      return;
    }
    if (key === '000') {
      if (amountStr === '0') return;
      setAmountStr((prev) => prev + '000');
      return;
    }

    setAmountStr((prev) => (prev === '0' ? key : prev + key));
  };

  const currentAmount = parseInt(amountStr, 10) || 0;

  // Natural Language Interpreter
  const handleNaturalLanguageParse = async () => {
    if (!naturalText.trim()) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naturalText }),
      });
      const data = await res.json();
      if (data.parsed) {
        const p = data.parsed;
        if (p.amount > 0) setAmountStr(p.amount.toString());
        if (p.description) setDescription(p.description);
        if (p.type) setActiveTab(p.type);

        if (p.walletName) {
          const matchedW = wallets.find((w) => w.name.toLowerCase().includes(p.walletName.toLowerCase()));
          if (matchedW) setSelectedWalletId(matchedW.id);
        }
        if (p.destinationWalletName) {
          const matchedDst = wallets.find((w) => w.name.toLowerCase().includes(p.destinationWalletName.toLowerCase()));
          if (matchedDst) setSelectedDestinationWalletId(matchedDst.id);
        }
        if (p.categoryName) {
          const matchedC = categories.find((c) => c.name.toLowerCase().includes(p.categoryName.toLowerCase()));
          if (matchedC) setSelectedCategoryId(matchedC.id);
        }
      }
    } catch (err) {
      console.error('[NL PARSE ERROR]', err);
    }
  };

  // Submit Transaction (Online or Offline Draft)
  const handleSubmit = async () => {
    if (currentAmount <= 0) {
      alert('Masukkan nominal lebih dari Rp 0');
      return;
    }
    if (!selectedWalletId) {
      alert('Pilih dompet');
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'TRANSFER') {
        if (selectedWalletId === selectedDestinationWalletId) {
          alert('Dompet asal dan tujuan harus berbeda');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceWalletId: selectedWalletId,
            destinationWalletId: selectedDestinationWalletId,
            amount: currentAmount,
            notes: description,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Gagal memproses transfer');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Expense or Income
        if (!navigator.onLine) {
          // Save offline draft directly
          await saveOfflineDraft({
            walletId: selectedWalletId,
            categoryId: selectedCategoryId || undefined,
            type: activeTab,
            amount: currentAmount,
            description: description || (activeTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'),
            date: new Date().toISOString(),
          });
          alert('Tersimpan di draft offline! Akan disinkronkan saat terhubung kembali.');
        } else {
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId: selectedWalletId,
              categoryId: selectedCategoryId || undefined,
              type: activeTab,
              amount: currentAmount,
              description: description || (activeTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'),
              isEssential: activeTab === 'EXPENSE' ? isEssential : true,
              date: new Date().toISOString(),
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            alert(err.error || 'Gagal menyimpan transaksi');
            setIsSubmitting(false);
            return;
          }
        }
      }

      onSuccess();
    } catch (err) {
      console.error('[SAVE TRANSACTION ERROR]', err);
      // Fallback offline draft
      if (activeTab !== 'TRANSFER') {
        await saveOfflineDraft({
          walletId: selectedWalletId,
          categoryId: selectedCategoryId || undefined,
          type: activeTab,
          amount: currentAmount,
          description: description || 'Pengeluaran',
          date: new Date().toISOString(),
        });
        alert('Tersimpan di draft offline lokal!');
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-end justify-center">
        <div className="w-full max-w-md bg-surface-container-lowest border-t border-surface-variant/40 rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl">
          
          {/* Header */}
          <div className="p-4 pb-2 flex items-center justify-between border-b border-surface-variant/30">
            {/* Action Mode Toggle Pills */}
            <div className="flex bg-surface-container-high p-1 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('EXPENSE')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'EXPENSE' ? 'bg-error text-white font-bold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('INCOME')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'INCOME' ? 'bg-primary text-white font-bold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TRANSFER')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'TRANSFER' ? 'bg-secondary text-white font-bold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Action Shortcuts: Live Scan & CSV Import */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium text-primary-container active:scale-98 shadow-xs"
              >
                <Camera className="w-4 h-4 text-primary-container" />
                <span>Pindai Nota (Live Camera)</span>
              </button>
              <button
                onClick={() => {
                  window.location.href = '/impor';
                  onClose();
                }}
                className="bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium text-secondary active:scale-98 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-secondary" />
                <span>Impor File CSV</span>
              </button>
            </div>

            {/* Natural Language Prompt Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder='Ketik bebas: "Kopi 22rb GoPay" atau "Bensin 50k Mandiri"...'
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNaturalLanguageParse()}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline pr-10 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 shadow-xs"
              />
              <button
                type="button"
                onClick={handleNaturalLanguageParse}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-container hover:text-primary p-1"
                title="Tafsirkan Teks"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Amount Display - Deep Forest Luxury Obsidian */}
            <div className="bg-inverse-surface rounded-2xl p-4 border border-surface-variant/20 text-center shadow-inner">
              <span className="text-xs text-surface-dim block mb-1">Nominal Transaksi</span>
              <div className="text-3xl font-bold font-mono text-surface-bright tracking-tight">
                {formatRupiah(currentAmount)}
              </div>
            </div>

            {/* Description & Wallets Form */}
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Catatan / Keterangan (cth: Kopi Kenangan, Bensin)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
                />
              </div>

              {/* Wallet Selector Chips */}
              <div>
                <label className="text-[11px] text-on-surface-variant block mb-1">
                  {activeTab === 'TRANSFER' ? 'Dompet Asal' : 'Pilih Dompet'}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWalletId(w.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                        selectedWalletId === w.id
                          ? 'bg-primary-container text-white border-primary-container font-bold shadow-xs'
                          : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Wallet (if Transfer) */}
              {activeTab === 'TRANSFER' && (
                <div>
                  <label className="text-[11px] text-on-surface-variant block mb-1">Dompet Tujuan</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {wallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedDestinationWalletId(w.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                          selectedDestinationWalletId === w.id
                            ? 'bg-secondary text-white border-secondary font-bold shadow-xs'
                            : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Chips (if Expense or Income) */}
              {activeTab !== 'TRANSFER' && (
                <div>
                  <label className="text-[11px] text-on-surface-variant block mb-1">Kategori</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {categories
                      .filter((c) => c.type === activeTab)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                            selectedCategoryId === c.id
                              ? 'bg-primary-container text-white border-primary-container font-bold shadow-xs'
                              : 'bg-surface-container-high border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Essential vs Discretionary Tag for Expenses */}
              {activeTab === 'EXPENSE' && (
                <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-variant/30 text-xs">
                  <span className="text-[11px] text-on-surface-variant font-medium">Prioritas:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEssential(true)}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        isEssential
                          ? 'bg-primary-container text-white shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Kebutuhan (Primer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEssential(false)}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        !isEssential
                          ? 'bg-tertiary-container text-white shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Keinginan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'BACKSPACE'].map((key) => {
                const isBackspace = key === 'BACKSPACE';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="h-12 bg-surface-container-low hover:bg-surface-container-high active:scale-95 rounded-xl text-lg font-semibold font-mono text-on-surface flex items-center justify-center transition-transform select-none shadow-xs border border-surface-variant/20"
                  >
                    {isBackspace ? <Delete className="w-5 h-5" /> : key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Save Action Button */}
          <div className="p-4 bg-surface-container-lowest border-t border-surface-variant/30">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || currentAmount <= 0}
              className="w-full py-3.5 bg-primary-container hover:bg-primary active:scale-98 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition-all"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5 stroke-[3]" />
              )}
              Simpan Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* Live Camera Modal */}
      <ReceiptCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onConfirmReceipt={async ({ parsed, walletId, categoryId }) => {
          // Save via API
          const res = await fetch('/api/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: 'data:image/jpeg;base64,receipt_saved',
              rawText: parsed.rawText,
              parsed,
            }),
          });
          const json = await res.json();

          // Create ledger transaction
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId,
              categoryId,
              type: 'EXPENSE',
              amount: parsed.totalAmount,
              description: `Belanja di ${parsed.merchantName || 'Nota'}`,
              merchant: parsed.merchantName,
              receiptId: json.receipt?.id,
            }),
          });

          onSuccess();
        }}
        wallets={wallets}
        categories={categories}
      />
    </>
  );
}

