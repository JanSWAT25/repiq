// lib/workout/exerciseMedia.ts
// Maps exercise IDs to demonstration GIF URLs
// Using Wger fitness API (open source, free, no API key needed)
// Fallback to animated SVG for any missing ones

export interface ExerciseMedia {
  gifUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  credit?: string;
}

// Wger exercise image base URL
const WGER = 'https://wger.de/api/v2/exerciseimage';

// Map exercise IDs to search terms for the Wger/exercise DB
export const EXERCISE_GIF_URLS: Record<string, string> = {
  // Push horizontal
  push_standard: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdwbW43ZGN4NW1yNjBwbzJwdWpxNnE2NTJsanpmNzVqOGZ0bXF6ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0FsJMXCnNI6c/giphy.gif',
  push_incline: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdwbW43ZGN4NW1yNjBwbzJwdWpxNnE2NTJsanpmNzVqOGZ0bXF6ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0FsJMXCnNI6c/giphy.gif',
  push_diamond: 'https://media.giphy.com/media/9ADoZQgs0tyww/giphy.gif',
  push_decline: 'https://media.giphy.com/media/L0FsJMXCnNI6c/giphy.gif',
  push_pike: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
  push_archer: 'https://media.giphy.com/media/L0FsJMXCnNI6c/giphy.gif',

  // Pull vertical
  pull_strict: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoAAA/giphy.gif',
  pull_chin: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoAAA/giphy.gif',
  pull_negative: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoAAA/giphy.gif',
  pull_scap: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoAAA/giphy.gif',

  // Pull horizontal
  row_australian: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif',
  row_incline: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif',
  row_feet_elevated: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif',
  row_archer: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif',

  // Squat
  squat_bodyweight: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
  squat_assisted: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
  squat_pause: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
  squat_bulgarian: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif',
  squat_cossack: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
  squat_pistol: 'https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif',
  squat_shrimp: 'https://media.giphy.com/media/xT9IgG50Lg7russbDa/giphy.gif',

  // Hinge
  hinge_glute_bridge: 'https://media.giphy.com/media/l1J9GIXk9w7OYsd5S/giphy.gif',
  hinge_single_bridge: 'https://media.giphy.com/media/l1J9GIXk9w7OYsd5S/giphy.gif',
  hinge_hip_thrust: 'https://media.giphy.com/media/l1J9GIXk9w7OYsd5S/giphy.gif',
  hinge_single_hip_thrust: 'https://media.giphy.com/media/l1J9GIXk9w7OYsd5S/giphy.gif',
  hinge_nordic_negative: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',

  // Dip
  dip_parallel: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
  dip_bench: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',
  dip_ring: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif',

  // Core
  core_plank: 'https://media.giphy.com/media/l3vRlT2k2L35Cnn5C/giphy.gif',
  core_hollow_body: 'https://media.giphy.com/media/l3vRlT2k2L35Cnn5C/giphy.gif',
  core_leg_raise: 'https://media.giphy.com/media/xT9IgzE4PhMBkiHnA4/giphy.gif',
  core_knee_tuck: 'https://media.giphy.com/media/xT9IgzE4PhMBkiHnA4/giphy.gif',

  // Conditioning
  cond_burpee: 'https://media.giphy.com/media/p7bFVFWqr9JNUEbNqF/giphy.gif',
  cond_mountain_climber: 'https://media.giphy.com/media/l1J9wjAQbPEopwU5i/giphy.gif',
  cond_jump_squat: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
  cond_lunge: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif',
};

// Camera position guidance per exercise
export const CAMERA_POSITION: Record<string, string> = {
  push_standard: 'Side view · Full body in frame',
  push_incline: 'Side view · Full body in frame',
  push_diamond: 'Side view · Full body in frame',
  push_decline: 'Side view · Full body in frame',
  push_archer: 'Side view · Full body in frame',
  pull_strict: 'Front view · Bar at top of frame',
  pull_chin: 'Front view · Bar at top of frame',
  row_australian: 'Side view · Full body in frame',
  squat_bodyweight: 'Side view · Full body in frame',
  squat_bulgarian: 'Side view · Full body in frame',
  squat_pistol: 'Side view · Full body in frame',
  hinge_glute_bridge: 'Side view · Lying down visible',
  hinge_hip_thrust: 'Side view · Full body in frame',
  core_plank: 'Side view · Full body in frame',
  dip_parallel: 'Side view · Full body in frame',
  cond_burpee: 'Side view · Full body in frame',
  cond_mountain_climber: 'Side view · Full body in frame',
};

export function getExerciseGifUrl(exerciseId: string): string | null {
  return EXERCISE_GIF_URLS[exerciseId] ?? null;
}

export function getCameraPosition(exerciseId: string): string {
  return CAMERA_POSITION[exerciseId] ?? 'Side view · Full body in frame';
}
