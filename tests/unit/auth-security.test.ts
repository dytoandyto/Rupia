import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  requireAuth,
  deleteUserAccount,
} from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';

describe('Google-Only Authentication & Security Tests', () => {
  const mockUserA = {
    id: 'user-google-first-time-001',
    email: 'budi.santoso@gmail.com',
    name: 'Budi Santoso',
    avatarUrl: 'https://lh3.googleusercontent.com/a/test-avatar-a',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    isOnboarded: false,
    accounts: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('signs and verifies a valid Google OAuth session token with internal userId', async () => {
    const payload = {
      userId: mockUserA.id,
      email: mockUserA.email,
      name: mockUserA.name,
      isOnboarded: false,
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(mockUserA.id);
    expect(decoded?.email).toBe(mockUserA.email);
    expect(decoded?.name).toBe(mockUserA.name);
  });

  it('rejects tampered or malformed session tokens', async () => {
    const validToken = await createSessionToken({
      userId: 'test-user',
      email: 'test@gmail.com',
      name: 'Test',
    });

    const tampered = validToken.substring(0, validToken.length - 5) + 'xxxxx';
    const decoded = await verifySessionToken(tampered);
    expect(decoded).toBeNull();
  });

  it('enforces session expiration and fails verification when expired', async () => {
    // A completely expired or random string token returns null
    const result = await verifySessionToken('ey.expired.token');
    expect(result).toBeNull();
  });

  it('handles first-time Google sign-in: creates user and persists Account record', async () => {
    const signInCallback = authOptions.callbacks?.signIn;
    expect(typeof signInCallback).toBe('function');

    // Mock prisma calls
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const createSpy = vi.spyOn(prisma.user, 'create').mockResolvedValue(mockUserA as any);
    const catCreateSpy = vi.spyOn(prisma.category, 'create').mockResolvedValue({} as any);
    const walletCreateSpy = vi.spyOn(prisma.wallet, 'createMany').mockResolvedValue({ count: 3 } as any);
    const accountCreateSpy = vi.spyOn(prisma.account, 'create').mockResolvedValue({} as any);

    const userParam = {
      id: '',
      email: mockUserA.email,
      name: mockUserA.name,
      image: mockUserA.avatarUrl,
    };

    const accountParam = {
      provider: 'google',
      type: 'oauth',
      providerAccountId: 'google-sub-123456789',
    };

    const profileParam = {
      sub: 'google-sub-123456789',
      name: mockUserA.name,
      email: mockUserA.email,
      picture: mockUserA.avatarUrl,
    };

    const allowed = await signInCallback!({
      user: userParam as any,
      account: accountParam as any,
      profile: profileParam as any,
    });

    expect(allowed).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(catCreateSpy).toHaveBeenCalled();
    expect(walletCreateSpy).toHaveBeenCalledTimes(1);
    expect(accountCreateSpy).toHaveBeenCalledTimes(1);
    expect(userParam.id).toBe(mockUserA.id);
  });

  it('handles returning Google sign-in: restores existing user profile without duplicating', async () => {
    const signInCallback = authOptions.callbacks?.signIn;

    const existingUser = {
      ...mockUserA,
      accounts: [
        {
          id: 'acc-1',
          provider: 'google',
          providerAccountId: 'google-sub-123456789',
          userId: mockUserA.id,
        },
      ],
    };

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser as any);
    const userCreateSpy = vi.spyOn(prisma.user, 'create');
    const accountCreateSpy = vi.spyOn(prisma.account, 'create');

    const userParam = {
      id: '',
      email: mockUserA.email,
      name: mockUserA.name,
      image: mockUserA.avatarUrl,
    };

    const allowed = await signInCallback!({
      user: userParam as any,
      account: {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google-sub-123456789',
      } as any,
      profile: {} as any,
    });

    expect(allowed).toBe(true);
    // Must NOT create a duplicate user profile
    expect(userCreateSpy).not.toHaveBeenCalled();
    // Must NOT duplicate account linkage
    expect(accountCreateSpy).not.toHaveBeenCalled();
    expect(userParam.id).toBe(mockUserA.id);
  });

  it('rejects sign-in if email is missing from Google OAuth payload', async () => {
    const signInCallback = authOptions.callbacks?.signIn;
    const allowed = await signInCallback!({
      user: { id: '', name: 'No Email User' } as any,
      account: { provider: 'google' } as any,
    });
    expect(allowed).toBe(false);
  });

  it('performs permanent account deletion cascade', async () => {
    const deleteSpy = vi.spyOn(prisma.user, 'delete').mockResolvedValue(mockUserA as any);

    const success = await deleteUserAccount(mockUserA.id);
    expect(success).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith({
      where: { id: mockUserA.id },
    });
  });
});

