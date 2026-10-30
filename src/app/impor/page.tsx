'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
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
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MobileShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Impor Mutasi Rekening Bank (CSV)
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Dukungan ekspor e-banking BCA, Mandiri Livin&apos;, BRImo, BNI, dan GoPay dengan deduplikasi hash otomatis.
          </p>
        </div>

        {/* Upload Card */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Pilih Dompet / Rekening Tujuan
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="border-2 border-dashed border-border-subtle hover:border-primary bg-surface-container-low rounded-2xl p-8 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-surface-container mx-auto flex items-center justify-center text-text-secondary mb-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-semibold text-text-primary block">
              {file ? file.name : 'Pilih atau Seret File CSV Rekening Koran'}
            </span>
            <span className="text-[11px] text-text-secondary mt-1 block">
              Format umum: Tanggal, Deskripsi, Jumlah/Nominal, Jenis Mutasi (DB/CR)
            </span>
          </div>

          {file && (
            <button
              onClick={handleUploadSubmit}
              disabled={isProcessing}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition-colors"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Proses &amp; Deteksi Transaksi Duplikat</span>
            </button>
          )}
        </div>

        {/* Results Banner */}
        {result && (
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-positive">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-text-primary">
                Hasil Pemrosesan Mutasi
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-surface-container p-3 rounded-xl border border-border-subtle">
                <span className="text-[11px] text-text-secondary block">Total Baris</span>
                <span className="font-bold text-text-primary text-base tabular-nums">{result.total}</span>
              </div>
              <div className="bg-primary-light border border-primary/20 p-3 rounded-xl">
                <span className="text-[11px] text-primary block">Berhasil Masuk</span>
                <span className="font-bold text-primary text-base tabular-nums">{result.imported}</span>
              </div>
              <div className="bg-surface-container border border-border-subtle p-3 rounded-xl">
                <span className="text-[11px] text-text-secondary block">Duplikat Dilewati</span>
                <span className="font-bold text-text-secondary text-base tabular-nums">{result.duplicates}</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/transaksi"
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Riwayat Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
