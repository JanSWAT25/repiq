'use client';

import { db } from './dexie';

export async function flushPendingToSheets(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  try {
    const pendingSets = await db.pendingSets.toArray();
    if (!pendingSets.length) return;
    const res = await fetch('/api/sheets/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sets: pendingSets }),
    });
    if (res.ok) {
      await db.pendingSets.bulkDelete(pendingSets.map((p) => p.id!));
      console.log('[sync] Flushed to Sheets');
    }
  } catch (e) {
    console.warn('[sync] Flush failed, will retry:', e);
  }
}

export function initBackgroundSync(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', flushPendingToSheets);
  setInterval(flushPendingToSheets, 30_000);
  if (navigator.onLine) flushPendingToSheets();
}
