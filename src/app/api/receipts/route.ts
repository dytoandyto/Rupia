import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ReceiptParser } from '@/lib/services/receipt-service';
import { serializeBigInt } from '@/lib/db';

const saveReceiptSchema = z.object({
  imageUrl: z.string(),
  rawText: z.string().optional(),
  transactionId: z.string().optional(),
  parsed: z.object({
    merchantName: z.string().optional(),
    transactionDate: z.string().or(z.date()).optional(),
    totalAmount: z.number(),
    taxAmount: z.number().optional(),
    discountAmount: z.number().optional(),
    confidence: z.number(),
    hasDiscrepancy: z.boolean(),
    lineItems: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        confidence: z.number(),
      })
    ),
  }),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = saveReceiptSchema.parse(body);

    const receipt = await ReceiptParser.saveReceipt(session.userId, {
      imageUrl: validated.imageUrl,
      rawText: validated.rawText,
      transactionId: validated.transactionId,
      parsed: {
        ...validated.parsed,
        transactionDate: validated.parsed.transactionDate ? new Date(validated.parsed.transactionDate) : new Date(),
        rawText: validated.rawText || '',
      },
    });

    return NextResponse.json({ receipt: serializeBigInt(receipt) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[SAVE RECEIPT ERROR]', error);
    return NextResponse.json({ error: 'Gagal menyimpan nota' }, { status: 500 });
  }
}

