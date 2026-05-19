// lib/pose/stateMachines/pushup.ts
import { angle3pt, avgAngle, landmarksVisible, type Point2D } from '../angles';
import { LM } from '../poseLandmarker';

export interface TrackerEvent {
  event: 'tracking' | 'descended' | 'rep' | 'error';
  count?: number;
  elbowAngle?: number;
  bodyLine?: number;
  formIssue?: string;
}

export interface PushupTracker {
  update: (lm: Point2D[], timestampMs: number) => TrackerEvent;
  getStats: () => PushupStats;
  reset: () => void;
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
  bodyLineMin: 150, // hip angle — below = piking/sagging
}): PushupTracker {
  let state: 'up' | 'down' = 'up';
  let reps = 0;
  let lastTransition = 0;
  const depthAchieved: number[] = [];
  const eccentricTimes: number[] = [];
  let bodyLineViolations = 0;
  let descentStart = 0;

  function update(lm: Point2D[], timestampMs: number): TrackerEvent {
    const required = [LM.L_SHOULDER, LM.L_ELBOW, LM.L_WRIST,
                      LM.R_SHOULDER, LM.R_ELBOW, LM.R_WRIST,
                      LM.L_HIP, LM.L_KNEE];
    if (!landmarksVisible(lm, required, 0.4)) {
      return { event: 'error', formIssue: 'Move into frame' };
    }

    const elbow = avgAngle(lm,
      LM.L_SHOULDER, LM.L_ELBOW, LM.L_WRIST,
      LM.R_SHOULDER, LM.R_ELBOW, LM.R_WRIST
    );

    // Body line: shoulder-hip-knee should be straight
    const bodyLine = angle3pt(lm[LM.L_SHOULDER], lm[LM.L_HIP], lm[LM.L_KNEE]);
    const hasBodyIssue = bodyLine < opts.bodyLineMin;
    if (hasBodyIssue) bodyLineViolations++;

    const now = timestampMs;
    const elapsed = now - lastTransition;

    if (state === 'up' && elbow < opts.downAngle && elapsed > opts.holdMs) {
      state = 'down';
      lastTransition = now;
      descentStart = now;
      depthAchieved.push(elbow);
      return {
        event: 'descended',
        elbowAngle: elbow,
        bodyLine,
        formIssue: hasBodyIssue ? 'Keep body straight' : undefined,
      };
    }

    if (state === 'down' && elbow > opts.upAngle && elapsed > opts.holdMs) {
      reps++;
      const eccentricTime = now - descentStart;
      eccentricTimes.push(eccentricTime);
      state = 'up';
      lastTransition = now;
      return {
        event: 'rep',
        count: reps,
        elbowAngle: elbow,
        bodyLine,
        formIssue: hasBodyIssue ? 'Keep hips level' : undefined,
      };
    }

    return {
      event: 'tracking',
      elbowAngle: elbow,
      bodyLine,
      formIssue: hasBodyIssue ? 'Keep body straight' : undefined,
    };
  }

  function getStats(): PushupStats {
    return {
      reps,
      avgDepth: depthAchieved.length
        ? depthAchieved.reduce((a, b) => a + b, 0) / depthAchieved.length
        : 0,
      bodyLineViolations,
      eccentricTimes,
    };
  }

  function reset() {
    state = 'up';
    reps = 0;
    lastTransition = 0;
    depthAchieved.length = 0;
    eccentricTimes.length = 0;
    bodyLineViolations = 0;
  }

  return { update, getStats, reset };
}
