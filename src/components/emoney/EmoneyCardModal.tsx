'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  History,
  ShieldCheck,
  Tag,
  Car,
  Fuel,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { formatRupiah, formatRelativeDateIndo } from '@/lib/formatters';
import { checkNfcSupport, startNfcCardScan } from '@/lib/nfc-reader';

interface EmoneyCardModalProps {
  wallet: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  allWallets: any[];
  categories: any[];
}

export default function EmoneyCardModal({
  wallet,
  isOpen,
  onClose,
  onUpdate,
  allWallets,
  categories,
}: EmoneyCardModalProps) {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'TOPUP' | 'SPEND' | 'RECONCILE' | 'HISTORY'>('ACTIONS');

  // Top-Up Form State
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('100000');
  const [topUpFee, setTopUpFee] = useState('1500');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  // Spend Form State
  const [spendAmount, setSpendAmount] = useState('');
  const [spendDescription, setSpendDescription] = useState('Tarif Gerbang Tol');
  const [spendCategoryId, setSpendCategoryId] = useState('');
  const [isEssential, setIsEssential] = useState(true);
  const [isSpendLoading, setIsSpendLoading] = useState(false);

  // Reconcile / NFC State
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [createAdjustment, setCreateAdjustment] = useState(true);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatusMsg, setNfcStatusMsg] = useState<string | null>(null);
  const [isReconcileLoading, setIsReconcileLoading] = useState(false);

  // History State
  const [cardHistory, setCardHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (!wallet) return;

    // Pick first available bank or e-wallet as default source
    const defaultSource = allWallets.find((w) => w.id !== wallet.id && (w.type === 'EWALLET' || w.type === 'BANK'));
    if (defaultSource) setSourceWalletId(defaultSource.id);

    // Pick transport category if available
    const transportCat = categories.find((c) =>
      c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('tol')
    );
    if (transportCat) setSpendCategoryId(transportCat.id);

    setActualBalanceInput(wallet.recordedBalance ? wallet.recordedBalance.toString() : '0');
    setActiveTab('ACTIONS');
  }, [wallet, allWallets, categories]);

  const loadCardHistory = async () => {
    if (!wallet) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/transactions?walletId=${wallet.id}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setCardHistory(json.transactions || []);
      }
    } catch (err) {
      console.error('[LOAD CARD HISTORY ERROR]', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!wallet || !sourceWalletId) return;
    const amountNum = parseInt(topUpAmount, 10);
    const feeNum = parseInt(topUpFee, 10) || 0;

    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal top-up yang valid.');
      return;
    }

    setIsTopUpLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWalletId,
          destinationWalletId: wallet.id,
          amount: amountNum,
          fee: feeNum,
          notes: topUpNotes || `Top-up ${wallet.name}`,
        }),
      });

      if (res.ok) {
        alert(`Top-up ${formatRupiah(amountNum)} berhasil! Saldo kartu telah bertambah.`);
        onUpdate();
        setActiveTab('ACTIONS');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal memproses top-up');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsTopUpLoading(false);
    }
  };

  const handleSpend = async () => {
    if (!wallet) return;
    const amountNum = parseInt(spendAmount, 10);

    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal pembayaran.');
      return;
    }

    setIsSpendLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: wallet.id,
          categoryId: spendCategoryId || undefined,
          type: 'EXPENSE',
          amount: amountNum,
          description: spendDescription || 'Pembayaran E-Money',
          isEssential,
          source: 'MANUAL',
        }),
      });

      if (res.ok) {
        alert(`Pembayaran ${formatRupiah(amountNum)} berhasil dicatat!`);
        setSpendAmount('');
        onUpdate();
        setActiveTab('ACTIONS');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mencatat pembayaran');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSpendLoading(false);
    }
  };

  const handleStartNfcScan = async () => {
    setNfcScanning(true);
    setNfcStatusMsg('Silakan tempelkan kartu di bagian belakang ponsel Anda...');

    try {
      const result = await startNfcCardScan();
      if (result.success) {
        setNfcStatusMsg(result.message);
      } else {
        setNfcStatusMsg(result.message);
      }
    } catch (err: any) {
      setNfcStatusMsg(err.message || 'Pemindaian gagal.');
    } finally {
      setNfcScanning(false);
    }
  };

  const handleReconcileBalance = async (source = 'MANUAL') => {
    if (!wallet) return;
    const actual = parseInt(actualBalanceInput.replace(/[^0-9]/g, ''), 10);

    if (isNaN(actual) || actual < 0) {
      alert('Masukkan nominal saldo yang valid.');
      return;
    }

    setIsReconcileLoading(true);
    try {
      const res = await fetch(`/api/wallets/${wallet.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualBalance: actual,
          createAdjustment,
          source,
        }),
      });

      if (res.ok) {
        alert('Saldo kartu berhasil diperbarui dan diselaraskan!');
        onUpdate();
        setActiveTab('ACTIONS');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal memperbarui saldo.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsReconcileLoading(false);
    }
  };

  if (!isOpen || !wallet) return null;

  // Determine card style based on issuer
  const issuer = (wallet.issuer || '').toUpperCase();
  let cardGradient = 'bg-gradient-to-br from-[#0f2b48] via-[#163c66] to-[#0a1e33]'; // Default Mandiri
  let issuerLabel = 'Mandiri e-money';

  if (issuer === 'BCA' || wallet.name.toLowerCase().includes('flazz')) {
    cardGradient = 'bg-gradient-to-br from-[#003399] via-[#0047ba] to-[#001f5c]';
    issuerLabel = 'BCA Flazz';
  } else if (issuer === 'BRI' || wallet.name.toLowerCase().includes('brizzi')) {
    cardGradient = 'bg-gradient-to-br from-[#00529c] via-[#0070d2] to-[#00386b]';
    issuerLabel = 'BRI Brizzi';
  } else if (issuer === 'BNI' || wallet.name.toLowerCase().includes('tapcash')) {
    cardGradient = 'bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412]';
    issuerLabel = 'BNI TapCash';
  } else if (issuer === 'CUSTOM' || issuer === 'OTHER') {
    cardGradient = 'bg-gradient-to-br from-[#28332e] via-[#1c2622] to-[#141e1a]';
    issuerLabel = 'Kartu Uang Elektronik';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white border border-border-subtle rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-surface-base hover:bg-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary absolute top-4 right-4 z-10 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Physical Card Visual Graphic */}
        <div className={`w-full rounded-2xl p-5 text-white shadow-xl relative overflow-hidden ${cardGradient}`}>
          {/* Card Chip & Contactless RFID Emblem */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* EMV Chip graphic */}
              <div className="w-9 h-7 rounded-md bg-amber-400/90 border border-amber-300 flex items-center justify-center shadow-xs">
                <div className="w-5 h-4 border border-amber-600/50 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                  <div className="border-r border-amber-600/50" />
                  <div />
                </div>
              </div>
              <Wifi className="w-5 h-5 text-white/80 rotate-90" />
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {issuerLabel}
            </span>
          </div>

          {/* Card Number / Last 4 */}
          <div className="tabular-nums text-sm tracking-widest text-white/80 mb-2">
            •••• •••• •••• {wallet.cardLast4 || '8821'}
          </div>

          {/* Balance & Details */}
          <div className="flex items-end justify-between pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">
                Saldo Tersedia
              </span>
              <span className="text-2xl font-bold tabular-nums tracking-tight text-white">
                {formatRupiah(wallet.recordedBalance)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-white/70 block">Sumber Saldo:</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase">
                {wallet.lastBalanceSource === 'NFC_READ'
                  ? 'NFC Scan'
                  : wallet.lastBalanceSource === 'RECONCILIATION'
                  ? 'Rekonsiliasi'
                  : 'Manual Entry'}
              </span>
            </div>
          </div>
        </div>

        {/* Last Verified Information Pill */}
        <div className="flex items-center justify-between bg-surface-base px-3.5 py-2.5 rounded-xl text-xs text-text-secondary border border-border-subtle">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary-forest shrink-0" />
            <span>
              Verifikasi:{' '}
              {wallet.lastReconciledAt ? formatRelativeDateIndo(wallet.lastReconciledAt) : 'Belum pernah'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-primary-forest bg-primary-light px-2 py-0.5 rounded-full">
            Tersinkron
          </span>
        </div>

        {/* Tab Navigation / Sub-actions */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Aksi Cepat Kartu</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('TOPUP')}
                className="p-3 bg-surface-base hover:bg-white border border-border-subtle rounded-2xl flex flex-col items-center gap-2 text-center transition-all active:scale-95 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary-forest flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-text-primary">Top-Up Saldo</p>
                  <p className="text-[10px] text-text-secondary">Transfer dari GoPay / Bank</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('SPEND')}
                className="p-3 bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 rounded-2xl flex flex-col items-center gap-2 text-center transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Bayar Tol / Parkir</p>
                  <p className="text-[10px] text-on-surface-variant">Catat tarif tol &amp; transit</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('RECONCILE')}
                className="p-3 bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 rounded-2xl flex flex-col items-center gap-2 text-center transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                  <Wifi className="w-5 h-5 rotate-90" />
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Cek &amp; Koreksi Saldo</p>
                  <p className="text-[10px] text-on-surface-variant">Via NFC / Input Manual</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('HISTORY');
                  loadCardHistory();
                }}
                className="p-3 bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 rounded-2xl flex flex-col items-center gap-2 text-center transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-on-surface">Riwayat Transaksi</p>
                  <p className="text-[10px] text-on-surface-variant">Debit &amp; mutasi kartu</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: TOP-UP FLOW */}
        {activeTab === 'TOPUP' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">Top-Up Kartu {wallet.name}</h4>
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-primary-container font-semibold hover:underline"
              >
                Kembali
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Sumber Dana (Dompet / Bank):</label>
                <select
                  value={sourceWalletId}
                  onChange={(e) => setSourceWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                >
                  {allWallets
                    .filter((w) => w.id !== wallet.id)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.recordedBalance)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Nominal Top-Up (IDR):</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2.5 bg-surface border border-outline/30 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {['20000', '50000', '100000', '200000', '500000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopUpAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        topUpAmount === preset
                          ? 'bg-primary-container text-white border-primary-container'
                          : 'bg-surface-container text-on-surface-variant border-surface-variant'
                      }`}
                    >
                      {formatRupiah(parseInt(preset, 10))}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Biaya Admin Top-Up (Opsional):</label>
                <input
                  type="number"
                  value={topUpFee}
                  onChange={(e) => setTopUpFee(e.target.value)}
                  placeholder="1500"
                  className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-xl text-xs font-mono text-on-surface"
                />
                <span className="text-[10px] text-outline mt-0.5 block">
                  Biaya admin dicatat terpisah sebagai pengeluaran dan tidak menambah saldo kartu.
                </span>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl text-[11px] text-on-surface-variant space-y-1">
                <div className="flex justify-between">
                  <span>Dana Berpindah:</span>
                  <span className="font-bold text-on-surface">{formatRupiah(parseInt(topUpAmount, 10) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin:</span>
                  <span className="font-bold text-on-surface">{formatRupiah(parseInt(topUpFee, 10) || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-surface-variant font-bold text-primary-container">
                  <span>Total Aset Tetap:</span>
                  <span>Tidak Mengubah Total Kekayaan</span>
                </div>
              </div>

              <button
                onClick={handleTopUp}
                disabled={isTopUpLoading}
                className="w-full py-3 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isTopUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
                <span>Konfirmasi Top-Up Kartu</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SPEND FLOW (TOLL / PARKING / TRANSIT) */}
        {activeTab === 'SPEND' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">Catat Bayar Tol / Parkir</h4>
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-primary-container font-semibold hover:underline"
              >
                Kembali
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Nominal Pembayaran (IDR):</label>
                <input
                  type="number"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  placeholder="Contoh: 17000"
                  className="w-full px-3 py-2.5 bg-surface border border-outline/30 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
                {/* Preset toll amounts in Jabodetabek */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {[
                    { label: 'Tol Jagorawi (7.5K)', val: '7500' },
                    { label: 'Tol Dalam Kota (10.5K)', val: '10500' },
                    { label: 'Tol JORR (17K)', val: '17000' },
                    { label: 'Parkir 1 Jam (5K)', val: '5000' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setSpendAmount(p.val);
                        setSpendDescription(p.label.split(' (')[0]);
                      }}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-variant text-on-surface-variant rounded-lg text-[10px] font-bold whitespace-nowrap border border-surface-variant"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Keterangan / Lokasi:</label>
                <input
                  type="text"
                  value={spendDescription}
                  onChange={(e) => setSpendDescription(e.target.value)}
                  placeholder="Gerbang Tol Cikarang Utama / Parkir"
                  className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-xl text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">Kategori:</label>
                <select
                  value={spendCategoryId}
                  onChange={(e) => setSpendCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-xl text-xs text-on-surface"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Essential vs Discretionary Toggle */}
              <div className="pt-1">
                <label className="text-[11px] font-bold text-on-surface block mb-1.5">Klasifikasi Pengeluaran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEssential(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isEssential
                        ? 'bg-primary-container text-white border-primary-container shadow-xs'
                        : 'bg-surface-container text-on-surface-variant border-surface-variant'
                    }`}
                  >
                    Kebutuhan (Primer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEssential(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      !isEssential
                        ? 'bg-tertiary-container text-white border-tertiary-container shadow-xs'
                        : 'bg-surface-container text-on-surface-variant border-surface-variant'
                    }`}
                  >
                    Keinginan (Opsional)
                  </button>
                </div>
              </div>

              <button
                onClick={handleSpend}
                disabled={isSpendLoading}
                className="w-full mt-2 py-3 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSpendLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                <span>Potong Saldo Kartu E-Money</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RECONCILE & NFC SCAN */}
        {activeTab === 'RECONCILE' && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">Cek &amp; Koreksi Saldo Kartu</h4>
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-primary-container font-semibold hover:underline"
              >
                Kembali
              </button>
            </div>

            {/* NFC Reader Callout */}
            <div className="bg-surface-container-low border border-surface-variant/40 rounded-2xl p-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mx-auto">
                <Wifi className="w-6 h-6 rotate-90" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-on-surface">Pindai Saldo Kartu via NFC</h5>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                  Tempelkan kartu di antena NFC ponsel Android Anda untuk mendeteksi nomor tag fisik.
                </p>
              </div>

              {nfcStatusMsg && (
                <div className="bg-surface text-on-surface text-[11px] p-2.5 rounded-xl border border-outline/20">
                  {nfcStatusMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleStartNfcScan}
                disabled={nfcScanning}
                className="w-full py-2.5 bg-tertiary-container hover:bg-tertiary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {nfcScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4 rotate-90" />}
                <span>{nfcScanning ? 'Mencari Kartu NFC...' : 'Mulai Pindai NFC'}</span>
              </button>
            </div>

            {/* Manual Balance Entry */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  Saldo Aktual Fisik Terkini (Cek di ATM / Gerbang Tol):
                </label>
                <input
                  type="number"
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  placeholder="Masukkan saldo aktual"
                  className="w-full px-3 py-2.5 bg-surface border border-outline/30 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              {/* Discrepancy indicator */}
              {actualBalanceInput && (
                <div className="bg-surface-container-low p-3 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-on-surface-variant">Selisih dengan Saldo Sistem:</span>
                  <span
                    className={`font-mono font-bold ${
                      parseInt(actualBalanceInput, 10) - Number(wallet.recordedBalance) === 0
                        ? 'text-primary'
                        : 'text-tertiary'
                    }`}
                  >
                    {formatRupiah(parseInt(actualBalanceInput, 10) - Number(wallet.recordedBalance))}
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={createAdjustment}
                  onChange={(e) => setCreateAdjustment(e.target.checked)}
                  className="rounded text-primary-container focus:ring-primary-container"
                />
                <span className="text-[11px] text-on-surface-variant">
                  Buat transaksi penyesuaian otomatis untuk menyeimbangkan saldo
                </span>
              </label>

              <button
                onClick={() => handleReconcileBalance('MANUAL')}
                disabled={isReconcileLoading}
                className="w-full py-3 bg-primary-container hover:bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isReconcileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Simpan Saldo Terverifikasi</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CARD TRANSACTION HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-3 pt-1 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">Riwayat Kartu {wallet.name}</h4>
              <button
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-primary-container font-semibold hover:underline"
              >
                Kembali
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
              </div>
            ) : cardHistory.length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low rounded-2xl p-4">
                <CreditCard className="w-8 h-8 text-outline mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-on-surface">Belum Ada Transaksi</p>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Transaksi tol, parkir, dan top-up untuk kartu ini akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cardHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-surface-variant/30 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-on-surface truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                        <span>{formatRelativeDateIndo(tx.date)}</span>
                        {tx.source && (
                          <span className="bg-surface px-1.5 py-0.2 rounded font-mono text-[9px] border border-outline/20">
                            {tx.source}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        tx.type === 'INCOME' ? 'text-primary' : 'text-on-surface'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Reassurance */}
        <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-center gap-1.5 text-[10px] text-outline text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
          <span>Rupia tidak pernah meminta PIN kartu, password ATM, atau OTP Anda.</span>
        </div>
      </div>
    </div>
  );
}

