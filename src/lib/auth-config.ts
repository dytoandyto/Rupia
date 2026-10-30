import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'google-client-id-placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret-placeholder',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET || 'rupia-mobile-v2-super-secret-jwt-key-indonesia-2026-strict',
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user?.email) {
        try {
          // Find or create user in Prisma database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || (profile as any)?.name || 'Pengguna Rupia',
                avatarUrl: user.image || (profile as any)?.picture || null,
                currency: 'IDR',
                timezone: 'Asia/Jakarta',
                isOnboarded: false,
              },
              include: { accounts: true },
            });

            // Automatically seed default categories for new user
            const defaultCategories = [
              { name: 'Makanan & Minuman', icon: 'Utensils', color: '#10b981', type: 'EXPENSE' },
              { name: 'Transportasi', icon: 'Car', color: '#0ea5e9', type: 'EXPENSE' },
              { name: 'Kebutuhan Rumah', icon: 'Home', color: '#8b5cf6', type: 'EXPENSE' },
              { name: 'Hiburan', icon: 'Gamepad2', color: '#f59e0b', type: 'EXPENSE' },
              { name: 'Kesehatan', icon: 'HeartPulse', color: '#ef4444', type: 'EXPENSE' },
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
                  userId: dbUser.id,
                  isDefault: true,
                },
              });
            }

            // Create initial starter wallets
            await prisma.wallet.createMany({
              data: [
                {
                  userId: dbUser.id,
                  name: 'Bank Mandiri',
                  type: 'BANK',
                  color: '#005f40',
                  icon: 'Landmark',
                  openingBalance: BigInt(0),
                  recordedBalance: BigInt(0),
                },
                {
                  userId: dbUser.id,
                  name: 'GoPay',
                  type: 'EWALLET',
                  color: '#00a5cf',
                  icon: 'Smartphone',
                  openingBalance: BigInt(0),
                  recordedBalance: BigInt(0),
                },
                {
                  userId: dbUser.id,
                  name: 'Dompet Tunai',
                  type: 'CASH',
                  color: '#10b981',
                  icon: 'Wallet',
                  openingBalance: BigInt(0),
                  recordedBalance: BigInt(0),
                },
              ],
            });
          } else {
            // Update profile image or name if updated on Google
            if (user.image && user.image !== dbUser.avatarUrl) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { avatarUrl: user.image },
              });
            }
          }

          // Persist account record if provided and not yet linked
          if (account && account.provider && account.providerAccountId) {
            const hasAccount = dbUser.accounts.some(
              (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            );

            if (!hasAccount) {
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | undefined,
                },
              });
            }
          }

          // Attach database user ID to user object for jwt callback
          user.id = dbUser.id;
          (user as any).isOnboarded = dbUser.isOnboarded;
          return true;
        } catch (error) {
          console.error('[NextAuth] Error in signIn callback:', error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isOnboarded = (user as any).isOnboarded;
      }
      // Re-verify from DB if token.userId missing
      if (!token.userId && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, isOnboarded: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.isOnboarded = dbUser.isOnboarded;
        }
      }
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.userId;
        (session.user as any).userId = token.userId;
        (session.user as any).isOnboarded = token.isOnboarded;
      }
      return session;
    },
  },
};

