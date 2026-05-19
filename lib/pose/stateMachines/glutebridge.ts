// lib/pose/stateMachines/glutebridge.ts
import { angle3pt, landmarksVisible, type Point2D } from '../angles';
import { LM } from '../poseLandmarker';

export interface GluteBridgeTracker {
  update: (lm: Point2D[], timestampMs: number) => GluteBridgeEvent;
  getReps: () => number;
  reset: () => void;
}

export interface GluteBridgeEvent {
  event: 'tracking' | 'extended' | 'rep' | 'error';
  count?: number;
  hipAngle?: number;
  formIssue?: string;
}

export function makeGluteBridgeTracker(opts = {
  upAngle: 170,
  downAngle: 140,
  holdMs: 100,
}): GluteBridgeTracker {
  let state: 'down' | 'up' = 'down';
  let reps = 0;
  let lastTransition = 0;

  function update(lm: Point2D[], timestampMs: number): GluteBridgeEvent {
    const required = [LM.L_SHOULDER, LM.L_HIP, LM.L_KNEE];
    if (!landmarksVisible(lm, required, 0.4)) {
      return { event: 'error', formIssue: 'Move into frame' };
    }

    const hipAngle = angle3pt(
      lm[LM.L_SHOULDER], lm[LM.L_HIP], lm[LM.L_KNEE]
    );
    const elapsed = timestampMs - lastTransition;

    if (state === 'down' && hipAngle > opts.upAngle && elapsed > opts.holdMs) {
      state = 'up';
      lastTransition = timestampMs;
      return { event: 'extended', hipAngle };
    }

    if (state === 'up' && hipAngle < opts.downAngle && elapsed > opts.holdMs) {
      reps++;
      state = 'down';
      lastTransition = timestampMs;
      return { event: 'rep', count: reps, hipAngle };
    }

    return { event: 'tracking', hipAngle };
  }

  return {
    update,
    getReps: () => reps,
    reset: () => { state = 'down'; reps = 0; lastTransition = 0; },
  };
}
