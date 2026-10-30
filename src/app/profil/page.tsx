'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Wallet,
  BarChart3,
  Sparkles,
  Target,
  Download,
  Shield,
  LogOut,
  ChevronRight,
  RefreshCw,
  Bell,
  Upload,
  Activity,
  Tag,
  Smartphone,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  X,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import InstallPwaModal from '@/components/pwa/InstallPwaModal';
import { useBalancePrivacy } from '@/lib/privacy-context';

export default function ProfilPage() {
  const router = useRouter();
  const { isBalanceHidden, toggleBalanceHidden } = useBalancePrivacy();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.push('/login');
        } else {
          setUser(d.user);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut({ redirect: false });
    } catch {
      // Continue to login
    }
    router.push('/login');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'hapus') {
      alert('Ketik kata "HAPUS" untuk mengonfirmasi penghapusan akun.');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });
      if (res.ok) {
        await signOut({ redirect: false });
        alert('Akun dan seluruh data keuangan Anda berhasil dihapus.');
        router.push('/login');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus akun.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <MobileShell>
        <div className="flex justify-center py-20">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      </MobileShell>
    );
  }

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <MobileShell user={user}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Profil &amp; Pengaturan
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manajemen akun Google, preferensi privasi, dan kontrol data keuangan Anda.
          </p>
        </div>

        {/* User Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary font-bold text-xl flex items-center justify-center border border-border-subtle shrink-0">
              {initialLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">{user?.name}</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
                  Google Verified
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
              <span className="text-[11px] text-text-secondary mt-1 block">
                Mata Uang Default: <strong>IDR (Rupiah Indonesia)</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-subtle hover:bg-surface-container text-xs font-medium text-text-secondary hover:text-negative transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>

        {/* Settings Sections Grid (Desktop 2-column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Pengaturan Tampilan & Data */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Preferensi &amp; Aksesibilitas
            </h3>

            <div className="rounded-2xl bg-surface-card border border-border-subtle shadow-xs divide-y divide-border-subtle overflow-hidden">
              {/* Balance Privacy Toggle */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Mode Privasi Saldo</h4>
                    <p className="text-[11px] text-text-secondary">
                      {isBalanceHidden ? 'Saldo disamarkan (••••••)' : 'Saldo ditampilkan normal'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleBalanceHidden}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isBalanceHidden
                      ? 'bg-attention text-white border-attention'
                      : 'bg-surface-container border-border-subtle text-text-secondary'
                  }`}
                >
                  {isBalanceHidden ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Install PWA Guide */}
              <button
                type="button"
                onClick={() => setShowInstallModal(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Install Aplikasi PWA</h4>
                    <p className="text-[11px] text-text-secondary">Akses langsung dari layar utama perangkat</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </button>

              {/* Export CSV Data */}
              <a
                href="/api/export"
                download
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Unduh Cadangan Data (CSV)</h4>
                    <p className="text-[11px] text-text-secondary">Ekspor seluruh riwayat transaksi</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </a>
            </div>
          </div>

          {/* Section 2: Fitur Finansial */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Manajemen Finansial
            </h3>

            <div className="rounded-2xl bg-surface-card border border-border-subtle shadow-xs divide-y divide-border-subtle overflow-hidden">
              <Link
                href="/kategori"
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Master Kategori</h4>
                    <p className="text-[11px] text-text-secondary">Atur kategori pengeluaran &amp; pemasukan</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </Link>

              <Link
                href="/impor"
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Impor Mutasi Bank</h4>
                    <p className="text-[11px] text-text-secondary">Unggah mutasi rekening via file CSV</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </Link>

              <Link
                href="/target"
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-secondary">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary">Target &amp; Dana Darurat</h4>
                    <p className="text-[11px] text-text-secondary">Rencana akumulasi tabungan masa depan</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Danger Zone: Permanent Account Deletion */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-negative">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-semibold">Zona Bahaya Akun</h4>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Menghapus akun akan memusnahkan seluruh data dompet, transaksi, mutasi bank, dan anggaran secara permanen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-error-container text-negative hover:bg-negative hover:text-white text-xs font-medium transition-colors"
          >
            Hapus Akun Permanen
          </button>
        </div>
      </div>

      {/* PWA Modal */}
      {showInstallModal && <InstallPwaModal />}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-card p-6 border border-border-subtle shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2 text-negative">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Hapus Akun Permanen</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Tindakan ini akan menghapus seluruh data catatan keuangan secara permanen. Ketik kata{' '}
              <strong className="text-negative">HAPUS</strong> untuk mengonfirmasi.
            </p>

            <input
              type="text"
              placeholder='Ketik "HAPUS"'
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-surface-container-low text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-negative/20"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-xl border border-border-subtle text-text-secondary text-xs font-medium hover:bg-surface-container-low"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'hapus'}
                className="flex-1 py-2 rounded-xl bg-negative text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
