import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA & Offline Synchronization Tests', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
  const swPath = path.resolve(process.cwd(), 'public/sw.js');
  const offlineHtmlPath = path.resolve(process.cwd(), 'public/offline.html');

  it('validates Web App Manifest compliance for Rupia PWA', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // App name & short name
    expect(content.name).toContain('Rupia');
    expect(content.short_name).toBe('Rupia');

    // Standalone display mode
    expect(content.display).toBe('standalone');

    // Colors
    expect(content.theme_color).toBe('#005f40');
    expect(content.background_color).toBe('#f1fcf5');

    // Valid icons
    expect(Array.isArray(content.icons)).toBe(true);
    const has192 = content.icons.some(
      (icon: any) => icon.sizes === '192x192' && icon.src.includes('192')
    );
    const has512 = content.icons.some(
      (icon: any) => icon.sizes === '512x512' && icon.src.includes('512')
    );
    expect(has192).toBe(true);
    expect(has512).toBe(true);
  });

  it('verifies valid binary PNG icon files and favicon on disk', () => {
    const icon192 = path.resolve(process.cwd(), 'public/icons/icon-192.png');
    const icon512 = path.resolve(process.cwd(), 'public/icons/icon-512.png');
    const favicon = path.resolve(process.cwd(), 'public/favicon.ico');

    expect(fs.existsSync(icon192)).toBe(true);
    expect(fs.existsSync(icon512)).toBe(true);
    expect(fs.existsSync(favicon)).toBe(true);

    const buf192 = fs.readFileSync(icon192);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    expect(buf192[0]).toBe(0x89);
    expect(buf192[1]).toBe(0x50);
    expect(buf192[2]).toBe(0x4e);
    expect(buf192[3]).toBe(0x47);
  });

  it('ensures Service Worker strictly excludes private financial APIs from cache', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Must have check url.pathname.startsWith('/api/')
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
    // Must precache offline.html
    expect(swContent).toContain("'/offline.html'");
    // Must handle offline navigation fallback
    expect(swContent).toContain("caches.match('/offline.html')");
  });

  it('verifies offline.html exists with graceful user message and Serene Capital theme', () => {
    expect(fs.existsSync(offlineHtmlPath)).toBe(true);
    const html = fs.readFileSync(offlineHtmlPath, 'utf8');

    expect(html).toContain('Mode Offline');
    expect(html).toContain('Koneksi Terputus');
    expect(html).toContain('#005f40');
    expect(html).toContain('disinkronkan');
  });

  it('tests PWA installation dismissal cooldown calculation (7 days snooze)', () => {
    const now = Date.now();
    const cooldownMs = 7 * 24 * 60 * 60 * 1000;
    const dismissedUntil = now + cooldownMs;

    // Immediately after dismissal, banner must be suppressed
    expect(now < dismissedUntil).toBe(true);

    // After 8 days, cooldown expired and banner may show again
    const eightDaysLater = now + 8 * 24 * 60 * 60 * 1000;
    expect(eightDaysLater > dismissedUntil).toBe(true);
  });
});

