import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Serializes BigInt values in objects to Numbers for JSON responses.
 * Since IDR amounts fit comfortably within JS Number.MAX_SAFE_INTEGER (~9 quadrillion),
 * converting to Number preserves exact integer values in JSON without breaking charts/UI.
 */
export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === 'bigint') {
    return Number(data) as unknown as T;
  }
  if (data instanceof Date) {
    return data as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(serializeBigInt) as unknown as T;
  }
  if (typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      copy[key] = serializeBigInt(val);
    }
    return copy as T;
  }
  return data;
}

export default prisma;

