// lib/pose/stateMachines/glutebridge.ts
import { angle3pt, landmarksVisible, type Point2D } from '../angles';
import { KP } from '../moveNet';

export function makeGluteBridgeTracker(opts = { upAngle: 170, downAngle: 140, holdMs: 100 }) {
  let state: 'down' | 'up' = 'down';
  let reps = 0;
  let lastTransition = 0;

  function update(lm: Point2D[], timestampMs: number) {
    const required = [KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE];
    if (!landmarksVisible(lm, required, 0.3)) {
      return { event: 'error' as const, formIssue: 'Move into frame' };
    }
    const hipAngle = angle3pt(lm[KP.LEFT_SHOULDER], lm[KP.LEFT_HIP], lm[KP.LEFT_KNEE]);
    const elapsed = timestampMs - lastTransition;
    if (state === 'down' && hipAngle > opts.upAngle && elapsed > opts.holdMs) {
      state = 'up'; lastTransition = timestampMs;
      return { event: 'extended' as const, hipAngle };
    }
    if (state === 'up' && hipAngle < opts.downAngle && elapsed > opts.holdMs) {
      reps++; state = 'down'; lastTransition = timestampMs;
      return { event: 'rep' as const, count: reps, hipAngle };
    }
    return { event: 'tracking' as const, hipAngle };
  }

  return { update, getReps: () => reps, reset: () => { state = 'down'; reps = 0; lastTransition = 0; } };
}
