// lib/pose/stateMachines/squat.ts
import { avgAngle, landmarksVisible, type Point2D } from '../angles';
import { LM } from '../poseLandmarker';

export interface SquatTracker {
  update: (lm: Point2D[], timestampMs: number) => SquatEvent;
  getReps: () => number;
  reset: () => void;
}

export interface SquatEvent {
  event: 'tracking' | 'descended' | 'rep' | 'error';
  count?: number;
  kneeAngle?: number;
  formIssue?: string;
}

export function makeSquatTracker(opts = {
  downAngle: 100,
  upAngle: 160,
  holdMs: 120,
}): SquatTracker {
  let state: 'up' | 'down' = 'up';
  let reps = 0;
  let lastTransition = 0;

  function update(lm: Point2D[], timestampMs: number): SquatEvent {
    const required = [LM.L_HIP, LM.L_KNEE, LM.L_ANKLE,
                      LM.R_HIP, LM.R_KNEE, LM.R_ANKLE];
    if (!landmarksVisible(lm, required, 0.4)) {
      return { event: 'error', formIssue: 'Full body must be visible' };
    }

    const knee = avgAngle(lm,
      LM.L_HIP, LM.L_KNEE, LM.L_ANKLE,
      LM.R_HIP, LM.R_KNEE, LM.R_ANKLE
    );

    const elapsed = timestampMs - lastTransition;

    if (state === 'up' && knee < opts.downAngle && elapsed > opts.holdMs) {
      state = 'down';
      lastTransition = timestampMs;
      return { event: 'descended', kneeAngle: knee };
    }

    if (state === 'down' && knee > opts.upAngle && elapsed > opts.holdMs) {
      reps++;
      state = 'up';
      lastTransition = timestampMs;
      return { event: 'rep', count: reps, kneeAngle: knee };
    }

    return { event: 'tracking', kneeAngle: knee };
  }

  return {
    update,
    getReps: () => reps,
    reset: () => { state = 'up'; reps = 0; lastTransition = 0; },
  };
}
