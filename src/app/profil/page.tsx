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
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import InstallPwaModal from '@/components/pwa/InstallPwaModal';

export default function ProfilPage() {
  const router = useRouter();
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

  const menuSections = [
    {
      title: 'Aplikasi & Fitur Unggulan',
      items: [
        {
          label: 'Pasang Aplikasi Rupia (PWA)',
          icon: Smartphone,
          color: 'text-primary-container',
          action: () => setShowInstallModal(true),
        },
        { label: 'Skor Kesehatan Finansial (0-100)', href: '/skor-kesehatan', icon: Activity, color: 'text-emerald-500' },
        { label: 'Analitik & Laporan Arus Kas', href: '/analitik', icon: BarChart3, color: 'text-blue-500' },
        { label: 'Target & Pos Tabungan (Goals)', href: '/target', icon: Target, color: 'text-emerald-500' },
        { label: 'Asisten Finansial Rupia AI', href: '/ai', icon: Sparkles, color: 'text-amber-500' },
      ],
    },
    {
      title: 'Manajemen Rekening & Kategori',
      items: [
        { label: 'Kelola Dompet & Rekonsiliasi Saldo', href: '/dompet', icon: Wallet, color: 'text-emerald-500' },
        { label: 'Kelola Kategori Transaksi', href: '/kategori', icon: Tag, color: 'text-purple-500' },
        { label: 'Impor Transaksi CSV', href: '/impor', icon: Upload, color: 'text-cyan-500' },
        { label: 'Ekspor Data (CSV / JSON)', href: '/api/export', icon: Download, color: 'text-outline', isDirectDownload: true },
        { label: 'Pusat Notifikasi', href: '/notifikasi', icon: Bell, color: 'text-amber-500' },
      ],
    },
    {
      title: 'Keamanan & Autentikasi',
      items: [
        { label: 'Panduan Awal & Setup (Onboarding)', href: '/onboarding', icon: Sparkles, color: 'text-emerald-500' },
        {
          label: 'Akun Google Terhubung',
          icon: Shield,
          color: 'text-primary-container',
          subtitle: user?.email || 'Akun Google Aktif',
        },
      ],
    },
  ];

  if (loading) {
    return (
      <MobileShell>
        <div className="flex justify-center py-20">
          <RefreshCw className="w-6 h-6 text-primary-container animate-spin" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell user={user}>
      <div className="space-y-5 pb-8">
        {/* User Profile Card - Deep Forest Luxury Obsidian */}
        <div className="bg-inverse-surface border border-surface-variant/20 rounded-3xl p-5 flex items-center gap-4 text-surface-bright shadow-[0_8px_30px_rgb(20,30,26,0.12)]">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-surface-bright truncate">{user?.name}</h2>
            <p className="text-xs text-surface-dim truncate">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className="bg-white/10 text-primary-fixed px-2 py-0.5 rounded-full border border-white/10 font-medium">
                IDR (Asia/Jakarta)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                Google Verified
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation Sections */}
        {menuSections.map((sec, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
              {sec.title}
            </h3>
            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl divide-y divide-surface-variant/30 overflow-hidden shadow-xs">
              {sec.items.map((item: any, itemIdx) => {
                const Icon = item.icon;

                if (item.action) {
                  return (
                    <button
                      key={itemIdx}
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <div>
                          <p className="text-xs font-medium text-on-surface">{item.label}</p>
                          {item.subtitle && <p className="text-[10px] text-outline">{item.subtitle}</p>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline" />
                    </button>
                  );
                }

                if (item.isDirectDownload) {
                  return (
                    <a
                      key={itemIdx}
                      href={item.href}
                      download
                      className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-xs font-medium text-on-surface">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline" />
                    </a>
                  );
                }

                if (!item.href) {
                  return (
                    <div key={itemIdx} className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <div>
                          <p className="text-xs font-medium text-on-surface">{item.label}</p>
                          {item.subtitle && <p className="text-[10px] text-outline">{item.subtitle}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] text-primary-container font-semibold">Aktif</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs font-medium text-on-surface">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Account Actions */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-surface-container hover:bg-surface-variant text-on-surface border border-surface-variant rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" /> Keluar dari Akun
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Hapus Akun &amp; Data Keuangan
          </button>
        </div>

        {/* Install PWA Modal on Demand */}
        <InstallPwaModal forceOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm bg-surface-container-lowest border border-error/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-on-surface">Hapus Akun Permanen?</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Seluruh dompet, transaksi, target, anggaran, dan riwayat asisten AI Anda akan dihapus selamanya.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-on-surface block">
                  Ketik <span className="text-error font-extrabold">&quot;HAPUS&quot;</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="HAPUS"
                  className="w-full px-3 py-2 bg-surface border border-error/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-error text-center font-bold"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'hapus'}
                  className="w-full py-2.5 bg-error hover:bg-error/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Hapus Semua Data Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                  }}
                  className="w-full py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
