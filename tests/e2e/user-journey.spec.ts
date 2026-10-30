import { test, expect } from '@playwright/test';

test.describe('RUPIA V2 - Mobile User Journey', () => {
  test('User can log in with demo account and see mobile home screen', async ({ page }) => {
    // Navigate to Login
    await page.goto('/login');

    // Quick Demo Button
    await page.click('text=Gunakan Akun Demo (1-Tap)');
    await page.click('button:has-text("Masuk ke Rupia")');

    // Expect redirection to /beranda
    await expect(page).toHaveURL(/.*beranda/);

    // Verify Mobile Hero & ATS
    await expect(page.locator('text=Aman Dibelanjakan (ATS)')).toBeVisible();
    await expect(page.locator('text=Dompet & Rekening')).toBeVisible();
  });

  test('User can open Quick Add sheet, type amount, and switch tabs', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Gunakan Akun Demo (1-Tap)');
    await page.click('button:has-text("Masuk ke Rupia")');
    await expect(page).toHaveURL(/.*beranda/);

    // Click elevated Catat button
    await page.click('button[aria-label="Catat Transaksi Cepat"]');

    // Verify bottom sheet appeared
    await expect(page.locator('text=Nominal Transaksi')).toBeVisible();

    // Tap numeric keypad "2", "5", "000"
    await page.click('button:has-text("2")');
    await page.click('button:has-text("5")');
    await page.click('button:has-text("000")');

    // Expect formatted display Rp 25.000
    await expect(page.locator('text=Rp 25.000')).toBeVisible();

    // Toggle Transfer Tab
    await page.click('button:has-text("Transfer")');
    await expect(page.locator('text=Dompet Asal')).toBeVisible();
    await expect(page.locator('text=Dompet Tujuan')).toBeVisible();
  });

  test('User can ask Rupia AI a question and receive deterministic advice', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Gunakan Akun Demo (1-Tap)');
    await page.click('button:has-text("Masuk ke Rupia")');

    // Navigate to AI Assistant
    await page.goto('/ai');

    // Click quick suggestion pill
    await page.click('text=Kenapa uangku cepat habis?');

    // Expect assistant bubble with advice
    await expect(page.locator('text=Berdasarkan data transaksi bulan ini')).toBeVisible({ timeout: 10000 });
  });

  test('User can open and complete Daily Check-In', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Gunakan Akun Demo (1-Tap)');
    await page.click('button:has-text("Masuk ke Rupia")');

    // Click Check-In pill if visible
    const checkInBtn = page.locator('button:has-text("Check-In")');
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
      await expect(page.locator('text=Check-In Keuangan Harian')).toBeVisible();
      await page.click('button:has-text("Selesaikan Check-In Hari Ini")');
    }
  });
});

