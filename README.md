# RUPIA V2
> **Mobile-First AI Personal Finance Intelligence**  
> *"Know your money. Own your future."*

---

## 📱 Ringkasan Produk & Keunggulan Utama

**Rupia** dirancang khusus dari sudut pandang pengguna smartphone di Indonesia yang rutin mencatat pengeluaran harian, memotret nota struk belanja, memantau ketersediaan uang tunai dan e-wallet (Mandiri, GoPay, Tunai), serta berkonsultasi dengan asisten keuangan cerdas berbasis data pasti.

Aplikasi ini secara deterministik menjawab 6 pertanyaan finansial mendasar:
1. **Berapa total uang yang saya miliki?** (Total Saldo Tercatat di semua dompet)
2. **Berapa uang yang aman untuk dibelanjakan?** (Mesin *Available-to-Spend* / ATS)
3. **Ke mana saja uang saya mengalir?** (Analitik & distribusi kategori pengeluaran)
4. **Pengeluaran mana yang tidak perlu / boros?** (Peringatan pos anggaran >80% dan overbudget)
5. **Berapa lama uang saya bisa bertahan?** (Laju bakar pengeluaran harian)
6. **Apa yang perlu saya ubah untuk memperbaiki keuangan?** (Rekomendasi Rupia AI)

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript Strict Mode, Tailwind CSS, Lucide Icons, Framer Motion, Recharts.
- **Backend & Database:** Next.js Route Handlers, Zod Validation, Prisma ORM, PostgreSQL (dengan dukungan schema lokal SQLite zero-config untuk dev/test instan).
- **Autentikasi:** Secure Session Token (JWT dengan algoritma HS256 via `jose`), password hashing menggunakan `bcryptjs`, HttpOnly cookies.
- **PWA & Offline:** Web App Manifest (`manifest.json`), Service Worker (`sw.js`), IndexedDB offline draft queue dengan *idempotency keys* untuk mencegah transaksi ganda saat sinkronisasi.
- **Live Receipt Camera & OCR:** `navigator.mediaDevices.getUserMedia` dengan dukungan kamera belakang (`facingMode: "environment"`), framing guideline, torch/flash toggle, kompresi kanvas, fallback upload galeri, dan OCR parser nota Indonesia (Indomaret, Alfamart, resto/kafe) lengkap dengan detektor selisih hitung nota.
- **Rupia AI Assistant:** Integrasi Google Gemini LLM API dengan authorized server-side financial tools (100% data riil) serta *Deterministic Financial Advisor fallback* jika API key belum diisi.
- **Testing:** Vitest (100% unit tests passed across 7 test suites), Playwright (E2E mobile test suite).

---

## 📋 Fitur yang Telah Diimplementasikan

### 1. Multi-Wallet Ledger & Atomic Transfers
- Dukungan akun Bank (Mandiri), E-Wallet (GoPay), dan Uang Tunai (Cash).
- Representasi moneter integer presisi Rupiah (IDR) tanpa distorsi floating-point.
- Transfer antar dompet atomik (`prisma.$transaction`) dengan pencatatan biaya admin terpisah tanpa menggelembungkan total pengeluaran konsumtif.
- Rekonsiliasi saldo aktual vs tercatat dengan opsi auto-adjustment.
- Pembatalan transaksi aman (*void*) dengan pengembalian saldo dompet dan audit log.

### 2. Available-To-Spend (ATS) Engine
- Formula deterministik:  
  $$\text{ATS} = \max(0, \text{Saldo Spendable} - \text{Kewajiban Tagihan} - \text{Cadangan Tabungan} - \text{Buffer 5\%})$$
- Menghitung batas aman belanja harian (*Daily Safe Spending Limit*).
- Menampilkan asumsi transparansi perhitungan kepada pengguna.

### 3. Pindai Nota Belanja (Dedicated Live Receipt Camera)
- Tampilan kamera layar penuh dengan panduan bingkai nota.
- Tombol sentuh shutter, pemutar foto 90°, pembatal/foto ulang.
- Tesseract.js OCR mengekstrak nama toko, tanggal, item pembelian, pajak (PPN/PB1), diskon, dan total bayar.
- **Deteksi Selisih Nota:** Jika total nota tercetak berbeda dengan penjumlahan item + pajak - diskon, sistem memunculkan peringatan kuning untuk diperiksa manual sebelum disimpan.
- Fallback upload foto galeri jika izin kamera ditolak pengguna.

### 4. Input Cepat & Natural Language Processing
- Keypad sentuh satu tangan dengan format Rupiah langsung.
- Penafsir teks bahasa alami:  
  *Contoh input:* `"Kopi 22rb GoPay"` $\rightarrow$ terurai menjadi Rp 22.000, Pengeluaran, GoPay, Makanan & Minuman.

### 5. Anggaran & Alokasi Pos Kategori
- Alokasi persentase (aturan 50/30/20) dan batas nominal IDR.
- Status indikator otomatis:
  - $\le 80\%$: Aman (Hijau)
  - $80\% - 99\%$: Waspada (Kuning)
  - $\ge 100\%$: Batas Tercapai / Overbudget (Merah)

### 6. Rupia AI Financial Assistant
- Percakapan interaktif Bahasa Indonesia dioptimalkan untuk mobile.
- Tombol saran pertanyaan cepat ("Kenapa uangku cepat habis?", "Simulasi kurangi kopi 10rb sehari", dll).
- Eksekusi alat baca data server yang terotorisasi tanpa mengubah saldo secara sepihak.

### 7. Daily Money Check-In (Pukul 20:30 Asia/Jakarta)
- Alur 4 pertanyaan cepat harian: pemasukan, pengeluaran, transaksi tercecer, kesesuaian saldo dompet.
- Pembuatan ringkasan finansial dan notifikasi in-app.

### 8. PWA & Mode Offline (IndexedDB)
- PWA dapat di-*install* langsung ke layar utama smartphone.
- Saat offline, transaksi tersimpan otomatis di IndexedDB lokal dengan status `SAVED_LOCALLY`.
- Saat koneksi online kembali, tombol sinkronisasi otomatis mengirim draft ke server menggunakan *idempotency key*.

### 9. Analitik, Target Finansial, & Impor CSV
- Grafik tren pengeluaran harian dan distribusi per kategori via Recharts.
- Target finansial (Dana Darurat, Laptop, dll) dengan rekomendasi setoran bulanan.
- Impor file CSV rekening koran dengan deteksi hash duplikat otomatis.
- Ekspor data riwayat transaksi dalam format CSV atau JSON.

---

## 🚀 Panduan Menjalankan Aplikasi (Setup Instructions)

### Prasyarat
- Node.js v18+ atau v20+ (teruji pada Node.js v26)
- npm

### 1. Kloning & Instal Dependensi
```bash
git clone <repo-url>
cd AplikasiKeuanganRupia
npm install
```



### 3. Sinkronisasi Database & Seed Akun Demo
Jalankan sinkronisasi schema database:
```bash
node scripts/db-sync.mjs
```
Isi data awal demo untuk evaluasi instan:
```bash
npm run db:seed
```
*Kredensial akun demo:*
- **Email:** `demo@rupia.id`
- **Password:** `rupia123`

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di smartphone atau laptop pada:  
`http://localhost:3000`

---

## 🧪 Menjalankan Pengujian (Testing)

### Unit Tests (Vitest)
Menjalankan seluruh 7 test suite (19 pengujian matematika, ledger, ATS, transfer fee, void reversal, NLP parser, receipt discrepancy):
```bash
npm test
```

### End-to-End Tests (Playwright)
```bash
npx playwright test
```

---

## 🌐 Panduan Deployment Produksi

### Deployment di Vercel / Cloud:
1. Hubungkan repository GitHub ke Vercel.
2. Siapkan managed PostgreSQL (misal: Supabase, Neon, Railway, atau Vercel Postgres).
3. Set environment variable `DATABASE_URL` ke connection string PostgreSQL Anda.
4. Set environment variable `JWT_SECRET` dengan string acak 32 karakter yang aman.
5. Jalankan `npx prisma db push --schema=prisma/schema.prisma` untuk push schema ke PostgreSQL.
6. Build command: `npm run build`.

---

## 🔒 Keamanan & Privasi

- Password di-hash menggunakan `bcryptjs` 10 salt rounds.
- Session dikelola via cookie bertanda `HttpOnly` dan `SameSite=Lax`.
- Setiap endpoint API memverifikasi kepemilikan data (`userId`) di tingkat server.
- Tidak pernah meminta PIN, kata sandi perbankan, atau OTP pengguna.
- Respon API keuangan dilindungi dan tidak di-cache secara publik oleh Service Worker.

