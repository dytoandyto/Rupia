import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Login dengan kata sandi dinonaktifkan demi keamanan. Silakan gunakan tombol resmi "Lanjutkan dengan Google".',
      code: 'GOOGLE_AUTH_ONLY',
    },
    { status: 403 }
  );
}
