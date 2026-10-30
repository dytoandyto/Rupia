import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'rupia-mobile-v2-super-secret-jwt-key-indonesia-2026-strict'
);

const SESSION_COOKIE_NAME = 'rupia_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  isOnboarded?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      isOnboarded: payload.isOnboarded as boolean | undefined,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSessionPayload | null> {
  try {
    // 1. Check official Auth.js / NextAuth session first
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user) {
      const user = nextAuthSession.user as any;
      const userId = user.id || user.userId;
      if (userId && user.email) {
        return {
          userId,
          email: user.email,
          name: user.name || 'Pengguna Rupia',
          isOnboarded: user.isOnboarded ?? true,
        };
      }
    }
  } catch {
    // Ignore and fallback to custom cookie check
  }

  // 2. Fallback to custom session cookie (used in tests and standalone sessions)
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  } catch {
    // Ignore cookie store errors in non-request contexts
  }

  return null;
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  // Also clear NextAuth cookie if set
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
}

export async function requireAuth(): Promise<UserSessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * Permanently deletes a user account and cascades all financial data.
 * Used for GDPR / privacy compliance and user account deletion flow.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return true;
  } catch (error) {
    console.error('[AUTH] Failed to delete user account:', error);
    throw error;
  }
}
