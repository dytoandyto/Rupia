'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Check,
  RefreshCw,
  Upload,
  AlertTriangle,
  Zap,
  ZapOff,
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import { ParsedReceiptResult, ParsedReceiptLineItem } from '@/lib/services/receipt-service';

interface ReceiptCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReceipt: (data: {
    receiptId?: string;
    parsed: ParsedReceiptResult;
    walletId: string;
    categoryId?: string;
  }) => Promise<void>;
  wallets: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export default function ReceiptCameraModal({
  isOpen,
  onClose,
  onConfirmReceipt,
  wallets,
  categories,
}: ReceiptCameraModalProps) {
  const [step, setStep] = useState<'CAMERA' | 'PREVIEW' | 'OCR_PROGRESS' | 'REVIEW'>('CAMERA');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [parsedResult, setParsedResult] = useState<ParsedReceiptResult | null>(null);

  // Review Form state
  const [merchantName, setMerchantName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [lineItems, setLineItems] = useState<ParsedReceiptLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || step !== 'CAMERA') return;

    let mounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? (track.getCapabilities() as unknown as { torch?: boolean }) : null;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch (err) {
        console.warn('[CAMERA ERROR]', err);
        setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan tombol upload.');
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, step]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchEnabled;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
    } catch {
      // ignore
    }
  };

  // Capture Image from Video
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop camera stream immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setCapturedImage(dataUrl);
    setRotation(0);
    setStep('PREVIEW');
  };

  // Handle File Input Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setRotation(0);
      setStep('PREVIEW');
    };
    reader.readAsDataURL(file);
  };

  // Rotate Captured Image 90 deg
  const rotateImage = () => {
    setRotation((r) => (r + 90) % 360);
  };

  // Run OCR & Parsing
  const runOcr = async () => {
    if (!capturedImage) return;
    setStep('OCR_PROGRESS');
    setOcrProgress(20);

    try {
      // Dynamically import Tesseract to avoid heavy client bundle on initial load
      const { createWorker } = await import('tesseract.js');
      setOcrProgress(40);

      const worker = await createWorker('ind');
      setOcrProgress(65);

      const ret = await worker.recognize(capturedImage);
      await worker.terminate();
      setOcrProgress(90);

      const rawText = ret.data.text;

      // Send to server parser
      const res = await fetch('/api/receipts/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, imageBase64: capturedImage }),
      });

      const json = await res.json();
      const parsed: ParsedReceiptResult = json.parsed;

      setParsedResult(parsed);
      setMerchantName(parsed.merchantName || 'Nota Pembelian');
      setTotalAmount(parsed.totalAmount || 0);
      setLineItems(parsed.lineItems || []);
      setStep('REVIEW');
    } catch (err) {
      console.error('[OCR FAILED]', err);
      // Fallback manual entry review
      setParsedResult({
        merchantName: 'Nota Pembelian',
        lineItems: [],
        totalAmount: 0,
        confidence: 0.2,
        rawText: '',
        hasDiscrepancy: false,
      });
      setMerchantName('Nota Pembelian');
      setTotalAmount(0);
      setStep('REVIEW');
    }
  };

  // Save Transaction & Receipt
  const handleSaveVerified = async () => {
    if (totalAmount <= 0) {
      alert('Jumlah total harus lebih dari Rp 0');
      return;
    }
    if (!selectedWalletId) {
      alert('Pilih dompet pembayaran');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmReceipt({
        parsed: {
          merchantName,
          totalAmount,
          lineItems,
          confidence: parsedResult?.confidence || 0.8,
          rawText: parsedResult?.rawText || '',
          hasDiscrepancy: parsedResult?.hasDiscrepancy || false,
        },
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });
      onClose();
    } catch (err) {
      console.error('[CONFIRM RECEIPT ERROR]', err);
      alert('Gagal menyimpan nota dan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none">
      {/* 1. CAMERA LIVE VIEW */}
      {step === 'CAMERA' && (
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-white tracking-wide">Pindai Nota Belanja</span>
            {hasTorch ? (
              <button
                onClick={toggleTorch}
                className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-amber-400"
              >
                {torchEnabled ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Video Preview */}
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
            {cameraError ? (
              <div className="p-6 text-center max-w-xs">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-slate-300 mb-4">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Pilih dari Galeri
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewport Frame Guideline */}
                <div className="absolute inset-x-8 inset-y-24 border-2 border-emerald-400/70 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  </div>
                  <p className="text-center text-xs text-emerald-300 font-medium bg-slate-950/70 py-1 px-3 rounded-full mx-auto backdrop-blur-sm">
                    Posisikan seluruh kertas nota di dalam kotak
                  </p>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Shutter Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 z-10 flex items-center justify-around bg-gradient-to-t from-black/90 to-transparent">
            {/* Gallery Upload Fallback */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-200"
              title="Upload File"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Shutter Button */}
            <button
              onClick={handleCapture}
              disabled={!!cameraError}
              aria-label="Ambil Foto Nota"
              className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-slate-200" />
            </button>

            <div className="w-12 h-12" />
          </div>
        </div>
      )}

      {/* 2. PHOTO PREVIEW */}
      {step === 'PREVIEW' && capturedImage && (
        <div className="relative w-full h-full flex flex-col justify-between bg-black">
          <div className="p-4 flex items-center justify-between z-10">
            <button
              onClick={() => setStep('CAMERA')}
              className="text-white bg-slate-800/80 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
            </button>
            <span className="text-sm font-semibold text-white">Konfirmasi Foto</span>
            <button
              onClick={rotateImage}
              className="text-white bg-slate-800/80 p-2 rounded-full"
              title="Putar 90 Derajat"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={capturedImage}
              alt="Receipt Preview"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-h-full max-w-full object-contain rounded-xl shadow-lg transition-transform"
            />
          </div>

          <div className="p-6 pb-8 bg-slate-900 border-t border-slate-800 flex gap-3">
            <button
              onClick={() => setStep('CAMERA')}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
            >
              Foto Ulang
            </button>
            <button
              onClick={runOcr}
              className="flex-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Proses OCR Nota
            </button>
          </div>
        </div>
      )}

      {/* 3. OCR PROCESSING PROGRESS */}
      {step === 'OCR_PROGRESS' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-6" />
          <h3 className="text-lg font-bold text-white mb-2">Membaca Nota Belanja...</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-6">
            Mengekstrak nama toko, tanggal, item pembelian, dan nominal total secara otomatis.
          </p>
          <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-emerald-400 mt-2">{ocrProgress}%</span>
        </div>
      )}

      {/* 4. VERIFY & EDIT REVIEW SCREEN */}
      {step === 'REVIEW' && (
        <div className="w-full h-full flex flex-col bg-surface text-on-surface overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-surface-variant/40 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-md z-10">
            <h3 className="font-bold text-base text-on-surface">Periksa Hasil Pindai Nota</h3>
            <button onClick={onClose} className="text-outline hover:text-on-surface">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Discrepancy Alert Banner */}
            {parsedResult?.hasDiscrepancy && (
              <div className="bg-tertiary-fixed/40 border border-tertiary/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-on-tertiary-fixed">
                <AlertTriangle className="w-4 h-4 shrink-0 text-tertiary mt-0.5" />
                <div>
                  <span className="font-bold block">Peringatan Selisih Hitung:</span>
                  {parsedResult.discrepancyMessage}
                </div>
              </div>
            )}

            {/* Merchant Name */}
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Nama Toko / Merchant</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container font-medium"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Total Belanja (IDR)</label>
              <input
                type="number"
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2.5 text-lg font-bold text-primary-container focus:outline-none focus:border-primary-container font-mono"
              />
            </div>

            {/* Wallet Selection */}
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Bayar Menggunakan Dompet</label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Kategori Pengeluaran</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline/20 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Itemized Breakdown List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface">Rincian Barang Terdeteksi ({lineItems.length})</label>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {lineItems.length === 0 ? (
                  <p className="text-xs text-outline italic">Tidak ada rincian item terdeteksi terpisah.</p>
                ) : (
                  lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-lowest p-2.5 rounded-xl border border-surface-variant/30 flex items-center justify-between text-xs shadow-xs"
                    >
                      <span className="font-medium text-on-surface truncate max-w-[180px]">{item.name}</span>
                      <span className="font-mono text-primary-container font-semibold">{formatRupiah(item.totalPrice)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Confirm Button */}
          <div className="p-4 bg-surface-container-lowest border-t border-surface-variant/30 flex gap-2">
            <button
              onClick={() => setStep('PREVIEW')}
              className="py-3 px-4 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:text-on-surface transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleSaveVerified}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-primary-container hover:bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              Simpan Transaksi & Nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

