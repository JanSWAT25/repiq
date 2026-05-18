'use client';

import { db } from './dexie';

export async function flushPendingToSheets(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;

  try {
    // Flush pending sets
    const pendingSets = await db.pendingSets.toArray();
    if (pendingSets.length > 0) {
      const res = await fetch('/api/sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sets: pendingSets }),
      });
      if (res.ok) {
        await db.pendingSets.bulkDelete(pendingSets.map((p) => p.id!));
        console.log(`[sync] Flushed ${pendingSets.length} sets to Sheets`);
      }
    }

    // Flush pending workouts
    const pendingWorkouts = await db.pendingWorkouts
      .where('synced')
      .equals(0)
      .toArray();
    for (const workout of pendingWorkouts) {
      const res = await fetch('/api/sheets/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout }),
      });
      if (res.ok) {
        await db.pendingWorkouts.update(workout.id!, { synced: true });
      }
    }
  } catch (e) {
    // Swallow — will retry on next online event or interval
    console.warn('[sync] Flush failed, will retry:', e);
  }
}

export function initBackgroundSync(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', flushPendingToSheets);
  setInterval(flushPendingToSheets, 30_000);
  // Flush on load if online
  if (navigator.onLine) flushPendingToSheets();
}
