import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Registrasi email dan password publik dinonaktifkan. Silakan gunakan tombol "Lanjutkan dengan Google" pada halaman login.',
      code: 'GOOGLE_AUTH_ONLY',
    },
    { status: 403 }
  );
}
