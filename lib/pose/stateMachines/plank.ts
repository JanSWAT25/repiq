// lib/pose/stateMachines/plank.ts
import { angle3pt, landmarksVisible, type Point2D } from '../angles';
import { KP } from '../moveNet';

export function makePlankTracker(opts = { minBodyAngle: 160, maxBodyAngle: 185 }) {
  let holdStart: number | null = null;
  let totalHoldMs = 0;

  function update(lm: Point2D[], timestampMs: number) {
    const required = [KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE];
    if (!landmarksVisible(lm, required, 0.3)) {
      holdStart = null;
      return { event: 'error' as const, formIssue: 'Full body must be visible' };
    }
    const bodyAngle = angle3pt(lm[KP.LEFT_SHOULDER], lm[KP.LEFT_HIP], lm[KP.LEFT_ANKLE]);
    const inPosition = bodyAngle >= opts.minBodyAngle && bodyAngle <= opts.maxBodyAngle;
    if (inPosition) {
      if (!holdStart) holdStart = timestampMs;
      return { event: 'holding' as const, holdSeconds: Math.round((timestampMs - holdStart) / 1000), bodyAngle };
    } else {
      if (holdStart) { totalHoldMs += timestampMs - holdStart; holdStart = null; }
      return { event: 'broken' as const, bodyAngle,
               formIssue: bodyAngle < opts.minBodyAngle ? 'Hips too low' : 'Hips too high' };
    }
  }

  return {
    update,
    getHoldSeconds: () => Math.round(totalHoldMs / 1000),
    reset: () => { holdStart = null; totalHoldMs = 0; },
  };
}
