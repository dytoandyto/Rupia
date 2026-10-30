import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    const txs = await prisma.transaction.findMany({
      where: { userId: session.userId, isVoided: false },
      include: { wallet: true, category: true },
      orderBy: { date: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({
        exportDate: new Date(),
        totalTransactions: txs.length,
        transactions: txs.map((t) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          type: t.type,
          amount: Number(t.amount),
          wallet: t.wallet.name,
          category: t.category?.name || 'Tanpa Kategori',
          notes: t.notes,
        })),
      });
    }

    // Default CSV format
    const header = 'ID,Tanggal,Keterangan,Merchant,Tipe,Jumlah (IDR),Dompet,Kategori,Catatan\n';
    const rows = txs.map((t) => {
      const cleanDesc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const cleanMerchant = `"${(t.merchant || '').replace(/"/g, '""')}"`;
      const cleanNotes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      const dateStr = t.date.toISOString().split('T')[0];
      return `${t.id},${dateStr},${cleanDesc},${cleanMerchant},${t.type},${t.amount},"${t.wallet.name}","${t.category?.name || ''}",${cleanNotes}`;
    });

    const csvData = header + rows.join('\n');

    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rupia-transaksi-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

