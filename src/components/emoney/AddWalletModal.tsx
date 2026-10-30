'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Building2,
  Smartphone,
  CreditCard,
  Banknote,
  PiggyBank,
  ShieldCheck,
  RefreshCw,
  Check,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: () => void;
}

const WALLET_TYPES = [
  {
    type: 'EMONEY',
    label: 'Kartu E-Money',
    desc: 'Mandiri e-money, BCA Flazz, Brizzi, TapCash',
    icon: CreditCard,
    color: '#005f40',
  },
  {
    type: 'EWALLET',
    label: 'Dompet Digital',
    desc: 'GoPay, OVO, DANA, ShopeePay',
    icon: Smartphone,
    color: '#00a5cf',
  },
  {
    type: 'BANK',
    label: 'Rekening Bank',
    desc: 'BCA, Mandiri, BRI, BNI, Jago',
    icon: Building2,
    color: '#10b981',
  },
  {
    type: 'CASH',
    label: 'Uang Tunai (Kas)',
    desc: 'Dompet fisik / uang kas harian',
    icon: Banknote,
    color: '#16a34a',
  },
  {
    type: 'SAVINGS',
    label: 'Tabungan Khusus',
    desc: 'Pos dana darurat / simpanan',
    icon: PiggyBank,
    color: '#8b5cf6',
  },
];

const EMONEY_PRESETS = [
  { name: 'Mandiri e-money', issuer: 'MANDIRI', color: '#0f2b48' },
  { name: 'BCA Flazz', issuer: 'BCA', color: '#003399' },
  { name: 'BRI Brizzi', issuer: 'BRI', color: '#00529c' },
  { name: 'BNI TapCash', issuer: 'BNI', color: '#ea580c' },
  { name: 'Kartu E-Money Lainnya', issuer: 'OTHER', color: '#28332e' },
];

export default function AddWalletModal({ isOpen, onClose, onSuccess, onCreated }: AddWalletModalProps) {
  const [selectedType, setSelectedType] = useState<string>('EMONEY');
  const [name, setName] = useState('Mandiri e-money');
  const [issuer, setIssuer] = useState('MANDIRI');
  const [cardLast4, setCardLast4] = useState('');
  const [openingBalance, setOpeningBalance] = useState('100000');
  const [color, setColor] = useState('#0f2b48');
  const [accountNo, setAccountNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset: typeof EMONEY_PRESETS[0]) => {
    setName(preset.name);
    setIssuer(preset.issuer);
    setColor(preset.color);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama dompet/kartu wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType,
          issuer: selectedType === 'EMONEY' ? issuer : undefined,
          cardLast4: selectedType === 'EMONEY' && cardLast4 ? cardLast4.trim() : undefined,
          accountNo: accountNo.trim() || undefined,
          color,
          icon: selectedType === 'EMONEY' ? 'CreditCard' : 'Wallet',
          openingBalance: parseInt(openingBalance, 10) || 0,
          lastBalanceSource: 'MANUAL',
        }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        if (onCreated) onCreated();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal membuat dompet/kartu');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white border border-border-subtle rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-surface-base hover:bg-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary absolute top-4 right-4 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="font-semibold text-base text-text-primary">Tambah Dompet / Kartu Baru</h3>
          <p className="text-xs text-text-secondary">Lacak kartu uang elektronik, e-wallet, dan rekening bank</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Wallet Type Selector */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5">Pilih Jenis Dompet / Akun:</label>
            <div className="grid grid-cols-2 gap-2">
              {WALLET_TYPES.map((wt) => {
                const Icon = wt.icon;
                const isSelected = selectedType === wt.type;
                return (
                  <button
                    key={wt.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(wt.type);
                      if (wt.type === 'EMONEY') {
                        handleSelectPreset(EMONEY_PRESETS[0]);
                      } else if (wt.type === 'EWALLET') {
                        setName('GoPay');
                        setColor('#00a5cf');
                      } else if (wt.type === 'BANK') {
                        setName('Bank Mandiri');
                        setColor('#10b981');
                      } else if (wt.type === 'CASH') {
                        setName('Dompet Tunai');
                        setColor('#16a34a');
                      } else {
                        setName('Tabungan Khusus');
                        setColor('#8b5cf6');
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary-light border-primary-forest text-primary-forest'
                        : 'bg-surface-base border-border-subtle hover:bg-white text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: wt.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary-forest' : 'text-text-primary'}`}>
                        {wt.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary line-clamp-1">{wt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* E-Money Presets */}
          {selectedType === 'EMONEY' && (
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1.5">Pilih Penerbit Kartu:</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {EMONEY_PRESETS.map((p) => {
                  const isSelected = issuer === p.issuer;
                  return (
                    <button
                      key={p.issuer}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                        isSelected
                          ? 'bg-primary-forest text-white border-primary-forest shadow-xs'
                          : 'bg-surface-base text-text-secondary border-border-subtle hover:text-text-primary'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallet Name */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">Nama Dompet / Label Kartu:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: e-money Tol Jagorawi"
              required
              className="w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary-forest focus:bg-white transition-all font-medium"
            />
          </div>

          {/* 4 Digit Kartu for E-Money */}
          {selectedType === 'EMONEY' && (
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                4 Digit Terakhir Nomor Kartu (Opsional):
              </label>
              <input
                type="text"
                maxLength={4}
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Contoh: 8821"
                className="w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-xl text-xs tabular-nums text-text-primary tracking-widest focus:outline-none focus:border-primary-forest focus:bg-white transition-all"
              />
              <span className="text-[10px] text-text-secondary mt-1 block">
                Digunakan untuk membedakan kartu jika Anda memiliki lebih dari 1 kartu sejenis.
              </span>
            </div>
          )}

          {/* Account Number for Bank / E-Wallet */}
          {(selectedType === 'BANK' || selectedType === 'EWALLET') && (
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Nomor Rekening / HP (Opsional):</label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="0812xxxx atau 14000xxxxx"
                className="w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary-forest focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Opening Balance */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">Saldo Awal (IDR):</label>
            <input
              type="number"
              min="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-xl text-xs tabular-nums font-bold text-text-primary focus:outline-none focus:border-primary-forest focus:bg-white transition-all"
            />
            {openingBalance && (
              <span className="text-[10px] text-text-secondary font-medium mt-1 block tabular-nums">
                {formatRupiah(parseInt(openingBalance, 10) || 0)}
              </span>
            )}
          </div>

          {/* Security Reassurance */}
          <div className="bg-surface-base border border-border-subtle p-3 rounded-xl flex items-center gap-2 text-xs text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-primary-forest shrink-0" />
            <span>Rupia tidak pernah meminta PIN kartu, password perbankan, atau kode OTP.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary-forest hover:bg-primary-deep text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Simpan Dompet Baru</span>
          </button>
        </form>
      </div>
    </div>
  );
}

