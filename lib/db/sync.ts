'use client';

import { db } from './dexie';

export async function flushPendingToSheets(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;

  try {
    const [pendingSets, pendingWorkouts, pendingStreaks, pendingAchievements] =
      await Promise.all([
        db.pendingSets.toArray(),
        db.pendingWorkouts.where('synced').equals(0).toArray(),
        db.pendingStreaks.where('synced').equals(0).toArray(),
        db.pendingAchievements.where('synced').equals(0).toArray(),
      ]);

    if (!pendingSets.length && !pendingWorkouts.length &&
        !pendingStreaks.length && !pendingAchievements.length) return;

    const payload: any = {};
    if (pendingSets.length) payload.sets = pendingSets;
    if (pendingWorkouts.length) payload.workout = pendingWorkouts[0]; // one at a time
    if (pendingStreaks.length) payload.streak = pendingStreaks[0];
    if (pendingAchievements.length) payload.achievements = pendingAchievements;

    const res = await fetch('/api/sheets/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // Clear synced items
      if (pendingSets.length) {
        await db.pendingSets.bulkDelete(pendingSets.map((p) => p.id!));
      }
      if (pendingWorkouts.length) {
        await db.pendingWorkouts.update(pendingWorkouts[0].id!, { synced: true });
      }
      if (pendingStreaks.length) {
        await db.pendingStreaks.update(pendingStreaks[0].id!, { synced: true });
      }
      if (pendingAchievements.length) {
        await db.pendingAchievements.bulkDelete(
          pendingAchievements.map((a) => a.id!)
        );
      }
      console.log('[sync] Flushed to Sheets successfully');
    } else {
      const err = await res.text();
      console.warn('[sync] Sheets write failed:', err);
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
