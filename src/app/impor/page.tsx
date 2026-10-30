'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  ChevronLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';

export default function ImporPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/wallets')
      .then((r) => r.json())
      .then((d) => {
        if (d.wallets && d.wallets.length > 0) {
          setWallets(d.wallets);
          setSelectedWalletId(d.wallets[0].id);
        }
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result as string);
    };
    reader.readAsText(selected);
  };

  const handleUploadSubmit = async () => {
    if (!file || !fileContent || !selectedWalletId) {
      alert('Pilih file CSV dan dompet tujuan');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          csvContent: fileContent,
          defaultWalletId: selectedWalletId,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setResult(json.result);
      } else {
        alert(json.error || 'Gagal mengimpor file');
      }
    } catch (err) {
      console.error('[IMPORT ERROR]', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MobileShell>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/profil" className="p-1 text-outline hover:text-on-surface">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-on-surface tracking-tight">Impor Transaksi CSV</h1>
            <p className="text-xs text-on-surface-variant">Dukungan rekening koran Mandiri & GoPay</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-4 shadow-xs">
          <div>
            <label className="text-xs text-on-surface-variant block mb-1">Pilih Dompet Tujuan Transaksi</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.type})
                </option>
              ))}
            </select>
          </div>

          {/* File Drag / Select Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-outline/30 hover:border-primary-container bg-surface-container-low rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="w-10 h-10 text-primary-container mx-auto mb-2" />
            <span className="text-xs font-semibold text-on-surface block">
              {file ? file.name : 'Ketuk untuk memilih file CSV'}
            </span>
            <span className="text-[11px] text-outline mt-1 block">
              Format: Tanggal, Keterangan, Nominal, Tipe
            </span>
          </div>

          {file && (
            <button
              onClick={handleUploadSubmit}
              disabled={isProcessing}
              className="w-full py-3 bg-primary-container hover:bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition-all"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 stroke-[2.5]" />
              )}
              Proses & Deteksi Duplikat
            </button>
          )}
        </div>

        {/* Import Results Banner */}
        {result && (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-on-surface">Hasil Pemrosesan Impor</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface-container-high p-2.5 rounded-xl border border-surface-variant/30">
                <span className="text-[10px] text-on-surface-variant block">Total Baris</span>
                <span className="font-bold text-on-surface text-base">{result.total}</span>
              </div>
              <div className="bg-primary-fixed border border-primary/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-primary block">Berhasil Masuk</span>
                <span className="font-bold text-primary text-base">{result.imported}</span>
              </div>
              <div className="bg-tertiary-fixed border border-tertiary/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-on-tertiary-fixed block">Duplikat Dilewati</span>
                <span className="font-bold text-on-tertiary-fixed text-base">{result.duplicates}</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/transaksi"
                className="text-xs text-primary-container font-semibold hover:underline"
              >
                Lihat transaksi yang baru diimpor di Linimasa →
              </Link>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

