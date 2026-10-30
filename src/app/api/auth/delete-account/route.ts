import { NextResponse } from 'next/server';
import { requireAuth, clearSessionCookie, deleteUserAccount } from '@/lib/auth';

export async function DELETE() {
  try {
    const session = await requireAuth();

    // Cascades all data (wallets, transactions, budgets, transfers, categories, goals, AI chat)
    await deleteUserAccount(session.userId);

    // Clear session cookies
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Akun dan seluruh data keuangan Anda berhasil dihapus secara permanen.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 401 });
    }
    console.error('[API DELETE ACCOUNT ERROR]', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}

