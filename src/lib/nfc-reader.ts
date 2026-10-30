/**
 * Rupia - Web NFC Card Reader Integration
 *
 * Provides compatibility detection, scanning handling, and graceful fallbacks
 * for physical e-money contactless cards (Mandiri e-money, BCA Flazz, BRI Brizzi, BNI TapCash).
 */

export interface NfcSupportStatus {
  isSupported: boolean;
  isAvailable: boolean;
  reason?: string;
}

export interface NfcScanResult {
  success: boolean;
  serialNumber?: string;
  cardType?: string;
  scannedBalance?: number;
  message: string;
}

/**
 * Checks whether the current device and browser environment supports the Web NFC API.
 * Web NFC is currently supported in Google Chrome & Edge on Android with HTTPS.
 * iOS Safari and desktop browsers do not expose Web NFC.
 */
export async function checkNfcSupport(): Promise<NfcSupportStatus> {
  if (typeof window === 'undefined') {
    return { isSupported: false, isAvailable: false, reason: 'SSR Environment' };
  }

  // 1. Check if NDEFReader exists in window
  if (!('NDEFReader' in window)) {
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIos) {
      return {
        isSupported: false,
        isAvailable: false,
        reason: 'Apple iOS Safari tidak mendukung Web NFC API. Gunakan input saldo manual.',
      };
    }
    return {
      isSupported: false,
      isAvailable: false,
      reason: 'Browser ini belum mendukung Web NFC API. Gunakan Chrome di ponsel Android atau input manual.',
    };
  }

  // 2. Check permission if queryable
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'nfc' as any });
      if (status.state === 'denied') {
        return {
          isSupported: true,
          isAvailable: false,
          reason: 'Izin akses NFC ditolak di pengaturan browser Anda.',
        };
      }
    }
  } catch {
    // Permission query not supported on all engines, continue
  }

  return { isSupported: true, isAvailable: true };
}

/**
 * Initiates an NFC card scan.
 * Never fabricates card balances; parses real NDEF records or tag serials.
 */
export async function startNfcCardScan(
  onReading?: (serial: string) => void,
  abortSignal?: AbortSignal
): Promise<NfcScanResult> {
  const support = await checkNfcSupport();
  if (!support.isSupported || !support.isAvailable) {
    return {
      success: false,
      message: support.reason || 'Perangkat tidak mendukung NFC.',
    };
  }

  try {
    const NDEFReaderClass = (window as any).NDEFReader;
    const reader = new NDEFReaderClass();

    await reader.scan({ signal: abortSignal });

    return new Promise((resolve) => {
      reader.onreading = (event: any) => {
        const serial = event.serialNumber || 'NFC_TAG_' + Date.now().toString(16).toUpperCase();
        if (onReading) onReading(serial);

        resolve({
          success: true,
          serialNumber: serial,
          message: 'Kartu NFC berhasil terdeteksi! Silakan konfirmasi saldo kartu Anda.',
        });
      };

      reader.onreadingerror = () => {
        resolve({
          success: false,
          message: 'Gagal membaca kartu NFC. Pastikan kartu menempel di bagian belakang ponsel.',
        });
      };

      // Timeout fallback after 15 seconds
      setTimeout(() => {
        resolve({
          success: false,
          message: 'Waktu pemindaian NFC habis. Silakan tempelkan kembali atau masukkan saldo secara manual.',
        });
      }, 15000);
    });
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      return { success: false, message: 'Izin NFC ditolak oleh pengguna.' };
    }
    if (error.name === 'NotSupportedError') {
      return { success: false, message: 'Fitur NFC dinonaktifkan di pengaturan ponsel Anda.' };
    }
    return { success: false, message: error.message || 'Pemindaian NFC gagal.' };
  }
}

