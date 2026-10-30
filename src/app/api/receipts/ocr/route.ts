import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ReceiptParser } from '@/lib/services/receipt-service';

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();

    const rawText = body.text || '';
    if (!rawText && !body.imageBase64) {
      return NextResponse.json({ error: 'Teks OCR atau gambar diperlukan' }, { status: 400 });
    }

    const parsed = ReceiptParser.parseReceiptText(rawText);

    return NextResponse.json({
      parsed,
      rawText,
    });
  } catch (error) {
    console.error('[RECEIPT OCR API ERROR]', error);
    return NextResponse.json({ error: 'Gagal memproses nota' }, { status: 500 });
  }
}

