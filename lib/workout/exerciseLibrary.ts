export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'core';

export type Category =
  | 'push_horizontal' | 'push_vertical' | 'pull_horizontal'
  | 'pull_vertical' | 'squat' | 'hinge' | 'core_anti_ext'
  | 'core_compression' | 'dip' | 'conditioning';

export type Equipment =
  | 'floor' | 'pullup_bar' | 'rings' | 'dip_bars' | 'vest' | 'wall';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroups: MuscleGroup[];
  tier: number;           // 1 (easiest) – 7 (hardest)
  equipment: Equipment[];
  unilateral: boolean;
  cvSupported: boolean;
  // CV metadata
  landmarkIds?: number[];
  upAngle?: number;
  downAngle?: number;
  // Programming
  minReps: number;
  maxReps: number;
  defaultTempo: string;
  description: string;
}

export const EXERCISE_LIBRARY: Exercise[] = [
  // ─── PUSH HORIZONTAL ──────────────────────────────────────────────
  {
    id: 'push_incline',
    name: 'Incline Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 1, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 8, maxReps: 20, defaultTempo: '2-1-1-0',
    description: 'Hands elevated on a surface, easier variant of push-up.',
  },
  {
    id: 'push_kneeling',
    name: 'Kneeling Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 8, maxReps: 20, defaultTempo: '2-1-1-0',
    description: 'Push-up performed from the knees.',
  },
  {
    id: 'push_standard',
    name: 'Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 5, maxReps: 20, defaultTempo: '3-1-1-0',
    description: 'Standard push-up, full body plank position.',
  },
  {
    id: 'push_diamond',
    name: 'Diamond Push-up',
    category: 'push_horizontal',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    tier: 4, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 5, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Hands form a diamond shape, heavy tricep emphasis.',
  },
  {
    id: 'push_wide',
    name: 'Wide Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 5, maxReps: 20, defaultTempo: '3-1-1-0',
    description: 'Wider hand placement for more chest stretch.',
  },
  {
    id: 'push_decline',
    name: 'Decline Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 4, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 5, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Feet elevated, shifts load to upper chest and shoulders.',
  },
  {
    id: 'push_archer',
    name: 'Archer Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 5, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 4, maxReps: 10, defaultTempo: '3-2-1-0',
    description: 'One arm takes most load while the other extends laterally.',
  },
  {
    id: 'push_typewriter',
    name: 'Typewriter Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    tier: 6, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 3, maxReps: 8, defaultTempo: '3-2-1-0',
    description: 'Travel side to side at the bottom position.',
  },
  {
    id: 'push_onearm_assisted',
    name: 'One-Arm Push-up (Assisted)',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    tier: 6, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 3, maxReps: 8, defaultTempo: '3-2-1-0',
    description: 'One-arm push-up with assist from fingers of other hand.',
  },
  {
    id: 'push_onearm',
    name: 'One-Arm Push-up',
    category: 'push_horizontal',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    tier: 7, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 1, maxReps: 6, defaultTempo: '3-2-1-0',
    description: 'Full one-arm push-up, elite level.',
  },

  // ─── PUSH VERTICAL ────────────────────────────────────────────────
  {
    id: 'push_pike',
    name: 'Pike Push-up',
    category: 'push_vertical',
    muscleGroups: ['shoulders', 'triceps'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Hips high in inverted-V, targets shoulders.',
  },
  {
    id: 'push_elevated_pike',
    name: 'Elevated Pike Push-up',
    category: 'push_vertical',
    muscleGroups: ['shoulders', 'triceps'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Feet elevated on chair/box, steeper angle.',
  },
  {
    id: 'push_wall_hspu',
    name: 'Wall Handstand Push-up',
    category: 'push_vertical',
    muscleGroups: ['shoulders', 'triceps'],
    tier: 5, equipment: ['wall'], unilateral: false, cvSupported: false,
    minReps: 3, maxReps: 10, defaultTempo: '3-1-1-0',
    description: 'Handstand against wall, full shoulder press.',
  },

  // ─── DIP ──────────────────────────────────────────────────────────
  {
    id: 'dip_bench',
    name: 'Bench Dip',
    category: 'dip',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 8, maxReps: 20, defaultTempo: '3-1-1-0',
    description: 'Hands on bench behind you, feet on floor.',
  },
  {
    id: 'dip_parallel',
    name: 'Parallel Bar Dip',
    category: 'dip',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    tier: 4, equipment: ['dip_bars'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16], upAngle: 160, downAngle: 90,
    minReps: 5, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Full parallel bar dip, bodyweight.',
  },
  {
    id: 'dip_ring',
    name: 'Ring Dip',
    category: 'dip',
    muscleGroups: ['triceps', 'chest', 'shoulders', 'core'],
    tier: 6, equipment: ['rings'], unilateral: false, cvSupported: false,
    minReps: 3, maxReps: 10, defaultTempo: '3-2-1-0',
    description: 'Dip on gymnastic rings, highly unstable.',
  },

  // ─── PULL HORIZONTAL ──────────────────────────────────────────────
  {
    id: 'row_incline',
    name: 'Incline Australian Row',
    category: 'pull_horizontal',
    muscleGroups: ['back', 'biceps'],
    tier: 1, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 8, maxReps: 20, defaultTempo: '3-1-1-0',
    description: 'Body inclined at 45°+, easier horizontal pull.',
  },
  {
    id: 'row_australian',
    name: 'Australian Row',
    category: 'pull_horizontal',
    muscleGroups: ['back', 'biceps'],
    tier: 2, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 6, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Body horizontal under bar, full row.',
  },
  {
    id: 'row_feet_elevated',
    name: 'Feet-Elevated Row',
    category: 'pull_horizontal',
    muscleGroups: ['back', 'biceps'],
    tier: 3, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Feet on elevated surface, harder horizontal pull.',
  },
  {
    id: 'row_archer',
    name: 'Archer Row',
    category: 'pull_horizontal',
    muscleGroups: ['back', 'biceps'],
    tier: 5, equipment: ['pullup_bar'], unilateral: true, cvSupported: false,
    minReps: 4, maxReps: 10, defaultTempo: '3-2-1-0',
    description: 'One arm pulls while the other extends.',
  },

  // ─── PULL VERTICAL ────────────────────────────────────────────────
  {
    id: 'pull_scap',
    name: 'Scapular Pull',
    category: 'pull_vertical',
    muscleGroups: ['back', 'shoulders'],
    tier: 1, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 8, maxReps: 20, defaultTempo: '2-1-1-0',
    description: 'Dead hang, retract/depress scapula only.',
  },
  {
    id: 'pull_negative',
    name: 'Negative Pull-up',
    category: 'pull_vertical',
    muscleGroups: ['back', 'biceps'],
    tier: 2, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 3, maxReps: 8, defaultTempo: '5-1-1-0',
    description: 'Jump to top, lower slowly over 5 seconds.',
  },
  {
    id: 'pull_band_assisted',
    name: 'Band-Assisted Pull-up',
    category: 'pull_vertical',
    muscleGroups: ['back', 'biceps'],
    tier: 3, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Resistance band reduces effective bodyweight.',
  },
  {
    id: 'pull_strict',
    name: 'Pull-up',
    category: 'pull_vertical',
    muscleGroups: ['back', 'biceps'],
    tier: 4, equipment: ['pullup_bar'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16, 0], upAngle: 90, downAngle: 150,
    minReps: 3, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Strict pull-up, chin clears the bar.',
  },
  {
    id: 'pull_chin',
    name: 'Chin-up',
    category: 'pull_vertical',
    muscleGroups: ['biceps', 'back'],
    tier: 4, equipment: ['pullup_bar'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 13, 15, 12, 14, 16, 0], upAngle: 90, downAngle: 150,
    minReps: 3, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Supinated grip, greater bicep involvement.',
  },
  {
    id: 'pull_archer_pullup',
    name: 'Archer Pull-up',
    category: 'pull_vertical',
    muscleGroups: ['back', 'biceps'],
    tier: 6, equipment: ['pullup_bar'], unilateral: true, cvSupported: false,
    minReps: 2, maxReps: 6, defaultTempo: '3-2-1-0',
    description: 'One arm pulls while the other extends along the bar.',
  },

  // ─── SQUAT ────────────────────────────────────────────────────────
  {
    id: 'squat_assisted',
    name: 'Assisted Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes'],
    tier: 1, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [23, 25, 27, 24, 26, 28], upAngle: 160, downAngle: 90,
    minReps: 10, maxReps: 25, defaultTempo: '3-1-1-0',
    description: 'Hold a support while squatting for balance.',
  },
  {
    id: 'squat_bodyweight',
    name: 'Bodyweight Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [23, 25, 27, 24, 26, 28], upAngle: 160, downAngle: 90,
    minReps: 10, maxReps: 25, defaultTempo: '3-1-1-0',
    description: 'Standard bodyweight squat to parallel.',
  },
  {
    id: 'squat_pause',
    name: 'Pause Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [23, 25, 27, 24, 26, 28], upAngle: 160, downAngle: 90,
    minReps: 6, maxReps: 15, defaultTempo: '3-3-1-0',
    description: '3-second pause at the bottom position.',
  },
  {
    id: 'squat_cossack',
    name: 'Cossack Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    tier: 4, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 5, maxReps: 12, defaultTempo: '3-1-1-0',
    description: 'Deep lateral squat alternating sides.',
  },
  {
    id: 'squat_bulgarian',
    name: 'Bulgarian Split Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    tier: 4, equipment: ['floor'], unilateral: true, cvSupported: true,
    landmarkIds: [23, 25, 27], upAngle: 160, downAngle: 100,
    minReps: 6, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Rear foot elevated split squat.',
  },
  {
    id: 'squat_shrimp',
    name: 'Shrimp Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes'],
    tier: 6, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 2, maxReps: 8, defaultTempo: '3-2-1-0',
    description: 'Single-leg squat with rear leg held behind.',
  },
  {
    id: 'squat_pistol',
    name: 'Pistol Squat',
    category: 'squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    tier: 7, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 1, maxReps: 6, defaultTempo: '3-2-1-0',
    description: 'Full single-leg squat, other leg extended forward.',
  },

  // ─── HINGE ────────────────────────────────────────────────────────
  {
    id: 'hinge_glute_bridge',
    name: 'Glute Bridge',
    category: 'hinge',
    muscleGroups: ['glutes', 'hamstrings'],
    tier: 1, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 23, 25, 12, 24, 26], upAngle: 170, downAngle: 140,
    minReps: 10, maxReps: 25, defaultTempo: '2-2-1-0',
    description: 'Lying bridge, drive hips to full extension.',
  },
  {
    id: 'hinge_single_bridge',
    name: 'Single-Leg Glute Bridge',
    category: 'hinge',
    muscleGroups: ['glutes', 'hamstrings'],
    tier: 2, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 8, maxReps: 20, defaultTempo: '2-2-1-0',
    description: 'One leg raised, isolates each glute.',
  },
  {
    id: 'hinge_hip_thrust',
    name: 'Hip Thrust',
    category: 'hinge',
    muscleGroups: ['glutes', 'hamstrings'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 8, maxReps: 20, defaultTempo: '2-2-1-0',
    description: 'Shoulders on bench/surface, full hip extension.',
  },
  {
    id: 'hinge_single_hip_thrust',
    name: 'Single-Leg Hip Thrust',
    category: 'hinge',
    muscleGroups: ['glutes', 'hamstrings'],
    tier: 4, equipment: ['floor'], unilateral: true, cvSupported: false,
    minReps: 6, maxReps: 15, defaultTempo: '2-2-1-0',
    description: 'Single-leg hip thrust for glute isolation.',
  },
  {
    id: 'hinge_nordic_negative',
    name: 'Nordic Curl Negative',
    category: 'hinge',
    muscleGroups: ['hamstrings', 'glutes'],
    tier: 5, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 2, maxReps: 6, defaultTempo: '5-0-1-0',
    description: 'Knees anchored, lower torso slowly under control.',
  },
  {
    id: 'hinge_nordic',
    name: 'Nordic Curl',
    category: 'hinge',
    muscleGroups: ['hamstrings', 'glutes'],
    tier: 7, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 1, maxReps: 5, defaultTempo: '4-0-1-0',
    description: 'Full eccentric and concentric nordic hamstring curl.',
  },

  // ─── CORE ANTI-EXTENSION ──────────────────────────────────────────
  {
    id: 'core_plank',
    name: 'Plank',
    category: 'core_anti_ext',
    muscleGroups: ['core'],
    tier: 1, equipment: ['floor'], unilateral: false, cvSupported: true,
    landmarkIds: [11, 23, 27], upAngle: 180, downAngle: 170,
    minReps: 20, maxReps: 60, defaultTempo: 'hold',
    description: 'Hold plank position, 20–60 seconds.',
  },
  {
    id: 'core_long_lever_plank',
    name: 'Long-Lever Plank',
    category: 'core_anti_ext',
    muscleGroups: ['core'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 15, maxReps: 45, defaultTempo: 'hold',
    description: 'Arms extended further forward than standard plank.',
  },
  {
    id: 'core_hollow_body',
    name: 'Hollow Body Hold',
    category: 'core_anti_ext',
    muscleGroups: ['core'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 15, maxReps: 45, defaultTempo: 'hold',
    description: 'Supine hollow position, arms and legs extended.',
  },
  {
    id: 'core_ab_wheel',
    name: 'Ab Wheel Rollout',
    category: 'core_anti_ext',
    muscleGroups: ['core', 'shoulders'],
    tier: 5, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 12, defaultTempo: '3-1-2-0',
    description: 'Roll out and back under full spinal control.',
  },
  {
    id: 'core_dragon_flag_neg',
    name: 'Dragon Flag Negative',
    category: 'core_anti_ext',
    muscleGroups: ['core'],
    tier: 6, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 2, maxReps: 5, defaultTempo: '5-0-1-0',
    description: 'Lower body slowly from top, highly advanced.',
  },

  // ─── CORE COMPRESSION ─────────────────────────────────────────────
  {
    id: 'core_knee_tuck',
    name: 'Lying Knee Tuck',
    category: 'core_compression',
    muscleGroups: ['core'],
    tier: 1, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 10, maxReps: 25, defaultTempo: '2-1-1-0',
    description: 'Lying down, draw knees to chest.',
  },
  {
    id: 'core_leg_raise',
    name: 'Hanging Leg Raise',
    category: 'core_compression',
    muscleGroups: ['core'],
    tier: 3, equipment: ['pullup_bar'], unilateral: false, cvSupported: false,
    minReps: 6, maxReps: 15, defaultTempo: '3-1-1-0',
    description: 'Hang from bar, raise straight legs to horizontal.',
  },
  {
    id: 'core_lsit_tuck',
    name: 'L-Sit Tuck Hold',
    category: 'core_compression',
    muscleGroups: ['core', 'triceps'],
    tier: 4, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 10, maxReps: 30, defaultTempo: 'hold',
    description: 'Support on hands, knees tucked toward chest.',
  },
  {
    id: 'core_lsit',
    name: 'L-Sit Hold',
    category: 'core_compression',
    muscleGroups: ['core', 'triceps'],
    tier: 6, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 20, defaultTempo: 'hold',
    description: 'Legs parallel to ground, full L-sit.',
  },

  // ─── CONDITIONING ─────────────────────────────────────────────────
  {
    id: 'cond_mountain_climber',
    name: 'Mountain Climber',
    category: 'conditioning',
    muscleGroups: ['core', 'quads'],
    tier: 2, equipment: ['floor'], unilateral: false, cvSupported: true,
    minReps: 10, maxReps: 30, defaultTempo: 'fast',
    description: 'Alternating knee drives in plank position.',
  },
  {
    id: 'cond_burpee',
    name: 'Burpee',
    category: 'conditioning',
    muscleGroups: ['chest', 'quads', 'core'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 5, maxReps: 15, defaultTempo: 'fast',
    description: 'Full burpee: squat → plank → push-up → jump.',
  },
  {
    id: 'cond_jump_squat',
    name: 'Jump Squat',
    category: 'conditioning',
    muscleGroups: ['quads', 'glutes'],
    tier: 3, equipment: ['floor'], unilateral: false, cvSupported: false,
    minReps: 6, maxReps: 15, defaultTempo: 'fast',
    description: 'Explosive squat with jump at top.',
  },
  {
    id: 'cond_lunge',
    name: 'Reverse Lunge',
    category: 'conditioning',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    tier: 2, equipment: ['floor'], unilateral: true, cvSupported: true,
    landmarkIds: [23, 25, 27], upAngle: 160, downAngle: 100,
    minReps: 8, maxReps: 20, defaultTempo: '2-1-1-0',
    description: 'Step back into lunge, return to standing.',
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}

export function getExercisesByCategory(category: Category): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.category === category);
}

export function getExercisesByEquipment(equipment: Equipment[]): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) =>
    e.equipment.every((req) => equipment.includes(req))
  );
}
