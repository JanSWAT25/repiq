// lib/pose/stateMachines/squat.ts
import { avgAngle, landmarksVisible, type Point2D } from '../angles';
import { KP } from '../moveNet';

export function makeSquatTracker(opts = { downAngle: 100, upAngle: 160, holdMs: 120 }) {
  let state: 'up' | 'down' = 'up';
  let reps = 0;
  let lastTransition = 0;

  function update(lm: Point2D[], timestampMs: number) {
    const required = [KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
                      KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE];
    if (!landmarksVisible(lm, required, 0.3)) {
      return { event: 'error' as const, formIssue: 'Full body must be visible' };
    }
    const knee = avgAngle(lm,
      KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
      KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE
    );
    const elapsed = timestampMs - lastTransition;
    if (state === 'up' && knee < opts.downAngle && elapsed > opts.holdMs) {
      state = 'down'; lastTransition = timestampMs;
      return { event: 'descended' as const, kneeAngle: knee };
    }
    if (state === 'down' && knee > opts.upAngle && elapsed > opts.holdMs) {
      reps++; state = 'up'; lastTransition = timestampMs;
      return { event: 'rep' as const, count: reps, kneeAngle: knee };
    }
    return { event: 'tracking' as const, kneeAngle: knee };
  }

  return { update, getReps: () => reps, reset: () => { state = 'up'; reps = 0; lastTransition = 0; } };
}
