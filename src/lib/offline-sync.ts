/**
 * Rupia V2 - Offline Drafts and IndexedDB Synchronization
 */

export interface OfflineDraft {
  id: string; // client-generated UUID
  idempotencyKey: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  walletId: string;
  walletName?: string;
  categoryId?: string;
  categoryName?: string;
  description: string;
  merchant?: string;
  notes?: string;
  date: string;
  createdAt: number;
  syncStatus: 'SAVED_LOCALLY' | 'SYNCING' | 'SYNC_FAILED';
  errorMessage?: string;
}

const DB_NAME = 'rupia_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_drafts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineDraft(draft: Omit<OfflineDraft, 'id' | 'idempotencyKey' | 'createdAt' | 'syncStatus'>): Promise<OfflineDraft> {
  const db = await openDatabase();
  const id = crypto.randomUUID();
  const fullDraft: OfflineDraft = {
    ...draft,
    id,
    idempotencyKey: `offline_${id}`,
    createdAt: Date.now(),
    syncStatus: 'SAVED_LOCALLY',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(fullDraft);

    req.onsuccess = () => resolve(fullDraft);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineDrafts(): Promise<OfflineDraft[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteOfflineDraft(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncPendingDrafts(onProgress?: (synced: number, total: number) => void): Promise<{ success: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const drafts = await getOfflineDrafts();
  if (drafts.length === 0) return { success: 0, failed: 0 };

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: draft.walletId,
          categoryId: draft.categoryId,
          type: draft.type,
          amount: draft.amount,
          date: draft.date,
          description: draft.description,
          merchant: draft.merchant,
          notes: draft.notes,
          idempotencyKey: draft.idempotencyKey,
        }),
      });

      if (res.ok) {
        await deleteOfflineDraft(draft.id);
        successCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }

    if (onProgress) {
      onProgress(i + 1, drafts.length);
    }
  }

  return { success: successCount, failed: failedCount };
}

