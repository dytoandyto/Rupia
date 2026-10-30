import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { AiFinancialService } from '@/lib/services/ai-service';

const chatSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { message, conversationId } = chatSchema.parse(body);

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: {
          userId: session.userId,
          title: message.slice(0, 30) + '...',
        },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'user',
        content: message,
      },
    });

    // Ask Rupia AI (with authorized deterministic tools and Gemini LLM)
    const answer = await AiFinancialService.askAssistant(session.userId, message);

    // Save assistant reply
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: answer,
      },
    });

    return NextResponse.json({
      conversationId: convId,
      answer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('[AI CHAT ERROR]', error);
    return NextResponse.json({ error: 'Gagal memproses percakapan AI' }, { status: 500 });
  }
}

