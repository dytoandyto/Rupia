import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  color: z.string().default('#10b981'),
  icon: z.string().default('Tag'),
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: session.userId }, { isDefault: true }],
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const validated = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        userId: session.userId,
        name: validated.name,
        color: validated.color,
        icon: validated.icon,
        type: validated.type,
        isDefault: false,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 });
  }
}

