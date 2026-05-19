// lib/pose/stateMachines/pushup.ts
import { angle3pt, avgAngle, landmarksVisible, type Point2D } from '../angles';
import { KP } from '../moveNet';

export interface TrackerEvent {
  event: 'tracking' | 'descended' | 'rep' | 'error';
  count?: number;
  elbowAngle?: number;
  bodyLine?: number;
  formIssue?: string;
}

export interface PushupStats {
  reps: number;
  avgDepth: number;
  bodyLineViolations: number;
  eccentricTimes: number[];
}

export function makePushupTracker(opts = {
  downAngle: 90,
  upAngle: 160,
  holdMs: 120,
  bodyLineMin: 150,
}) {
  let state: 'up' | 'down' = 'up';
  let reps = 0;
  let lastTransition = 0;
  const depthAchieved: number[] = [];
  const eccentricTimes: number[] = [];
  let bodyLineViolations = 0;
  let descentStart = 0;

  function update(lm: Point2D[], timestampMs: number): TrackerEvent {
    const required = [KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST,
                      KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW, KP.RIGHT_WRIST];
    if (!landmarksVisible(lm, required, 0.3)) {
      return { event: 'error', formIssue: 'Move into frame — full body needed' };
    }

    const elbow = avgAngle(lm,
      KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST,
      KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW, KP.RIGHT_WRIST
    );

    const bodyLine = angle3pt(lm[KP.LEFT_SHOULDER], lm[KP.LEFT_HIP], lm[KP.LEFT_KNEE]);
    const hasBodyIssue = bodyLine < opts.bodyLineMin;
    if (hasBodyIssue) bodyLineViolations++;

    const elapsed = timestampMs - lastTransition;

    if (state === 'up' && elbow < opts.downAngle && elapsed > opts.holdMs) {
      state = 'down';
      lastTransition = timestampMs;
      descentStart = timestampMs;
      depthAchieved.push(elbow);
      return { event: 'descended', elbowAngle: elbow, bodyLine,
               formIssue: hasBodyIssue ? 'Keep body straight' : undefined };
    }

    if (state === 'down' && elbow > opts.upAngle && elapsed > opts.holdMs) {
      reps++;
      eccentricTimes.push(timestampMs - descentStart);
      state = 'up';
      lastTransition = timestampMs;
      return { event: 'rep', count: reps, elbowAngle: elbow, bodyLine,
               formIssue: hasBodyIssue ? 'Keep hips level' : undefined };
    }

    return { event: 'tracking', elbowAngle: elbow, bodyLine,
             formIssue: hasBodyIssue ? 'Keep body straight' : undefined };
  }

  function getStats(): PushupStats {
    return {
      reps,
      avgDepth: depthAchieved.length
        ? depthAchieved.reduce((a, b) => a + b, 0) / depthAchieved.length : 0,
      bodyLineViolations,
      eccentricTimes,
    };
  }

  function reset() {
    state = 'up'; reps = 0; lastTransition = 0;
    depthAchieved.length = 0; eccentricTimes.length = 0; bodyLineViolations = 0;
  }

  return { update, getStats, reset };
}
