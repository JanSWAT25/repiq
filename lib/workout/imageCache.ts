import type { Exercise } from './exerciseLibrary';

export function getWorkoutImageCacheKey(args: {
  exercise: Pick<Exercise, 'id'>;
  targetReps: number;
  rir: number;
  tempo: string;
  restSec: number;
}) {
  return `repiq-workout-image-v1:${args.exercise.id}:${args.targetReps}:${args.rir}:${args.tempo}:${args.restSec}`;
}

function toCacheRequest(cacheKey: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://repiq.local';
  return new Request(`${origin}/__repiq_workout_image_cache/${encodeURIComponent(cacheKey)}`);
}

export async function getCachedWorkoutImage(cacheKey: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  const cache = await caches.open('repiq-workout-images');
  const hit = await cache.match(toCacheRequest(cacheKey));
  if (!hit) return null;
  const data = await hit.json().catch(() => null);
  return data?.imageUrl ?? null;
}

export async function setCachedWorkoutImage(cacheKey: string, imageUrl: string) {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  const cache = await caches.open('repiq-workout-images');
  await cache.put(
    toCacheRequest(cacheKey),
    new Response(JSON.stringify({ imageUrl, savedAt: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
