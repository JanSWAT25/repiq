// lib/pose/stateMachines/plank.ts
import { angle3pt, landmarksVisible, type Point2D } from '../angles';
import { LM } from '../poseLandmarker';

export interface PlankTracker {
  update: (lm: Point2D[], timestampMs: number) => PlankEvent;
  getHoldSeconds: () => number;
  reset: () => void;
}

export interface PlankEvent {
  event: 'tracking' | 'holding' | 'broken' | 'error';
  holdSeconds?: number;
  bodyAngle?: number;
  formIssue?: string;
}

export function makePlankTracker(opts = {
  minBodyAngle: 160,
  maxBodyAngle: 185,
}): PlankTracker {
  let holdStart: number | null = null;
  let totalHoldMs = 0;
  let broken = false;

  function update(lm: Point2D[], timestampMs: number): PlankEvent {
    const required = [LM.L_SHOULDER, LM.L_HIP, LM.L_ANKLE];
    if (!landmarksVisible(lm, required, 0.4)) {
      holdStart = null;
      return { event: 'error', formIssue: 'Full body must be visible' };
    }

    const bodyAngle = angle3pt(
      lm[LM.L_SHOULDER], lm[LM.L_HIP], lm[LM.L_ANKLE]
    );

    const inPosition =
      bodyAngle >= opts.minBodyAngle && bodyAngle <= opts.maxBodyAngle;

    if (inPosition) {
      if (!holdStart) holdStart = timestampMs;
      const currentHold = (timestampMs - holdStart) / 1000;
      return {
        event: 'holding',
        holdSeconds: Math.round(currentHold),
        bodyAngle,
      };
    } else {
      if (holdStart) {
        totalHoldMs += timestampMs - holdStart;
        holdStart = null;
        broken = true;
      }
      return {
        event: 'broken',
        bodyAngle,
        formIssue: bodyAngle < opts.minBodyAngle ? 'Hips too low' : 'Hips too high',
      };
    }
  }

  function getHoldSeconds(): number {
    return Math.round(totalHoldMs / 1000);
  }

  function reset() {
    holdStart = null;
    totalHoldMs = 0;
    broken = false;
  }

  return { update, getHoldSeconds, reset };
}
