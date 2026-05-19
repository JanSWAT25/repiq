// lib/pose/exerciseTrackers.ts
// Maps exercise IDs to their state machine factories

import { makePushupTracker } from './stateMachines/pushup';
import { makeSquatTracker } from './stateMachines/squat';
import { makePlankTracker } from './stateMachines/plank';
import { makeGluteBridgeTracker } from './stateMachines/glutebridge';

export type TrackerType = 'pushup' | 'squat' | 'plank' | 'glutebridge' | null;

// Map exercise IDs to tracker types
const EXERCISE_TRACKER_MAP: Record<string, TrackerType> = {
  // Push horizontal
  push_incline: 'pushup',
  push_kneeling: 'pushup',
  push_standard: 'pushup',
  push_diamond: 'pushup',
  push_wide: 'pushup',
  push_decline: 'pushup',
  push_archer: 'pushup',

  // Squat
  squat_assisted: 'squat',
  squat_bodyweight: 'squat',
  squat_pause: 'squat',
  squat_bulgarian: 'squat',

  // Core anti-extension
  core_plank: 'plank',
  core_long_lever_plank: 'plank',

  // Hinge
  hinge_glute_bridge: 'glutebridge',
  hinge_single_bridge: 'glutebridge',
  hinge_hip_thrust: 'glutebridge',
};

export function getTrackerTypeForExercise(exerciseId: string): TrackerType {
  return EXERCISE_TRACKER_MAP[exerciseId] ?? null;
}

export function createTrackerForExercise(exerciseId: string) {
  const type = getTrackerTypeForExercise(exerciseId);
  switch (type) {
    case 'pushup': return { type, tracker: makePushupTracker() };
    case 'squat': return { type, tracker: makeSquatTracker() };
    case 'plank': return { type, tracker: makePlankTracker() };
    case 'glutebridge': return { type, tracker: makeGluteBridgeTracker() };
    default: return null;
  }
}
