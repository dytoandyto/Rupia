import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  // Only available in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint hanya tersedia di mode development' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || 'pengguna.google@rupia.id';
    const name = body.name || 'Pengguna Google Rupia';
    const avatarUrl = body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    let user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          isOnboarded: false,
        },
        include: { accounts: true },
      });

      // Default categories
      const defaultCategories = [
        { name: 'Makanan & Minuman', icon: 'Utensils', color: '#10b981', type: 'EXPENSE' },
        { name: 'Transportasi', icon: 'Car', color: '#0ea5e9', type: 'EXPENSE' },
        { name: 'Kebutuhan Rumah', icon: 'Home', color: '#8b5cf6', type: 'EXPENSE' },
        { name: 'Gaji & Pendapatan', icon: 'Banknote', color: '#10b981', type: 'INCOME' },
        { name: 'Lain-lain', icon: 'MoreHorizontal', color: '#64748b', type: 'EXPENSE' },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type as any,
            userId: user.id,
            isDefault: true,
          },
        });
      }

      // Starter wallets
      await prisma.wallet.createMany({
        data: [
          {
            userId: user.id,
            name: 'Bank Mandiri',
            type: 'BANK',
            color: '#005f40',
            icon: 'Landmark',
            openingBalance: BigInt(5000000),
            recordedBalance: BigInt(5000000),
          },
          {
            userId: user.id,
            name: 'GoPay',
            type: 'EWALLET',
            color: '#00a5cf',
            icon: 'Smartphone',
            openingBalance: BigInt(750000),
            recordedBalance: BigInt(750000),
          },
          {
            userId: user.id,
            name: 'Dompet Tunai',
            type: 'CASH',
            color: '#10b981',
            icon: 'Wallet',
            openingBalance: BigInt(250000),
            recordedBalance: BigInt(250000),
          },
        ],
      });

      // Link mock Google account
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-dev-' + Date.now(),
          scope: 'openid email profile',
        },
      });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isOnboarded: user.isOnboarded,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isOnboarded: user.isOnboarded,
      },
      isNewUser,
      redirectUrl: isNewUser ? '/onboarding' : '/beranda',
    });
  } catch (err: any) {
    console.error('[DEV GOOGLE LOGIN ERROR]', err);
    return NextResponse.json({ error: 'Gagal melakukan login simulasi' }, { status: 500 });
  }
}

