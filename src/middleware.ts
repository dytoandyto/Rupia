import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and public paths to ignore
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html'
  ) {
    return NextResponse.next();
  }

  // Session cookies
  const rupiaToken = request.cookies.get('rupia_session')?.value;
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthenticated = Boolean(rupiaToken || nextAuthToken);

  // Protected pages
  const protectedPaths = [
    '/beranda',
    '/transaksi',
    '/dompet',
    '/anggaran',
    '/analitik',
    '/ai',
    '/profil',
    '/target',
    '/skor-kesehatan',
    '/kategori',
    '/notifikasi',
    '/impor',
    '/onboarding',
  ];

  const isProtectedPath = protectedPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // Redirect unauthenticated users trying to access protected paths
  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting login, redirect to beranda
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/beranda', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html).*)',
  ],
};

