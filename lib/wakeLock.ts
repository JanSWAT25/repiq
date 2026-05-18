let sentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('wakeLock' in navigator)) return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    // Re-acquire on visibility restore (iOS PWA requirement)
    document.addEventListener('visibilitychange', async () => {
      if (sentinel !== null && document.visibilityState === 'visible') {
        try {
          sentinel = await navigator.wakeLock.request('screen');
        } catch {
          // ignore
        }
      }
    });
    return true;
  } catch (e) {
    console.warn('Wake lock failed:', e);
    return false;
  }
}

export function releaseWakeLock(): void {
  sentinel?.release();
  sentinel = null;
}
