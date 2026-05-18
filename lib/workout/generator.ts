import {
  EXERCISE_LIBRARY,
  type Exercise,
  type MuscleGroup,
  type Category,
  type Equipment,
} from './exerciseLibrary';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DupSlot =
  | 'heavy' | 'moderate' | 'high_rep'
  | 'skill' | 'conditioning' | 'recovery';

export interface WorkoutBlock {
  exercise: Exercise;
  sets: number;
  targetReps: number;
  rir: number;
  restSec: number;
  tempo: string;
  isPrimary: boolean;
}

export interface Drill {
  name: string;
  durationSec: number;
  description: string;
}

export interface Workout {
  date: string;
  dupSlot: DupSlot;
  warmup: Drill[];
  blocks: WorkoutBlock[];
  finisher: Drill;
  estDurationMin: number;
  noveltyChallenge?: string;
  muscleEmphasis: MuscleGroup[];
}

// ─── Weekly volume targets ─────────────────────────────────────────────────────

export const WEEKLY_VOLUME_TARGETS: Record<MuscleGroup, number> = {
  chest: 12, back: 14, shoulders: 10, biceps: 10, triceps: 12,
  quads: 14, hamstrings: 10, glutes: 12, core: 8,
};

// ─── DUP slot configs ─────────────────────────────────────────────────────────

interface DupConfig {
  repRange: [number, number];
  rir: number;
  restSec: number;
  setsCompound: number;
  setsAccessory: number;
  tempo: string;
  label: string;
  preferTiers: number[];
}

const DUP_CONFIGS: Record<DupSlot, DupConfig> = {
  heavy: {
    repRange: [5, 8], rir: 2, restSec: 180,
    setsCompound: 4, setsAccessory: 3,
    tempo: '4-1-1-0', label: 'Heavy / Strength',
    preferTiers: [5, 6, 7],
  },
  moderate: {
    repRange: [10, 12], rir: 2, restSec: 120,
    setsCompound: 4, setsAccessory: 3,
    tempo: '3-1-1-0', label: 'Moderate / Hypertrophy',
    preferTiers: [3, 4, 5],
  },
  high_rep: {
    repRange: [15, 25], rir: 1, restSec: 60,
    setsCompound: 3, setsAccessory: 3,
    tempo: '2-0-1-0', label: 'High Rep / Pump',
    preferTiers: [2, 3, 4],
  },
  skill: {
    repRange: [3, 6], rir: 1, restSec: 150,
    setsCompound: 4, setsAccessory: 3,
    tempo: '3-2-1-0', label: 'Skill / Unilateral',
    preferTiers: [5, 6, 7],
  },
  conditioning: {
    repRange: [10, 20], rir: 0, restSec: 45,
    setsCompound: 3, setsAccessory: 2,
    tempo: 'fast', label: 'Conditioning',
    preferTiers: [2, 3, 4],
  },
  recovery: {
    repRange: [15, 20], rir: 3, restSec: 60,
    setsCompound: 2, setsAccessory: 2,
    tempo: '2-1-1-0', label: 'Active Recovery',
    preferTiers: [1, 2, 3],
  },
};

// Day of week → DUP slot
function getDupSlot(date: Date): DupSlot {
  const day = date.getDay(); // 0=Sun
  const slots: DupSlot[] = [
    'recovery',     // Sun
    'heavy',        // Mon
    'moderate',     // Tue
    'high_rep',     // Wed
    'skill',        // Thu
    'heavy',        // Fri
    'conditioning', // Sat
  ];
  return slots[day];
}

// ─── Movement pattern → muscle groups ─────────────────────────────────────────

const PATTERN_MUSCLES: Record<Category, MuscleGroup[]> = {
  push_horizontal: ['chest', 'triceps', 'shoulders'],
  push_vertical:   ['shoulders', 'triceps'],
  pull_horizontal: ['back', 'biceps'],
  pull_vertical:   ['back', 'biceps'],
  squat:           ['quads', 'glutes', 'hamstrings'],
  hinge:           ['glutes', 'hamstrings'],
  core_anti_ext:   ['core'],
  core_compression:['core'],
  dip:             ['triceps', 'chest'],
  conditioning:    ['quads', 'core'],
};

// ─── Daily block templates ─────────────────────────────────────────────────────

type BlockTemplate = Category[];

const BLOCK_TEMPLATES: BlockTemplate[] = [
  ['push_horizontal', 'pull_vertical', 'squat', 'core_anti_ext'],
  ['push_vertical', 'pull_horizontal', 'hinge', 'core_compression'],
  ['push_horizontal', 'pull_horizontal', 'squat', 'hinge'],
  ['dip', 'pull_vertical', 'squat', 'core_anti_ext'],
  ['push_horizontal', 'pull_vertical', 'hinge', 'conditioning'],
  ['push_vertical', 'pull_horizontal', 'squat', 'core_compression'],
  ['push_horizontal', 'dip', 'pull_vertical', 'squat'],
];

// ─── Seeded random (for deterministic tests) ──────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickWeighted<T>(
  items: T[],
  weights: number[],
  rand: () => number
): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Warmup generator ─────────────────────────────────────────────────────────

function generateWarmup(patterns: Category[]): Drill[] {
  const drills: Drill[] = [
    { name: 'Joint Circles', durationSec: 60, description: 'Wrists, elbows, shoulders, hips, knees, ankles — 10 circles each direction.' },
    { name: 'World\'s Greatest Stretch', durationSec: 60, description: '5 reps per side — hip flexor, thoracic rotation, hamstring.' },
  ];
  if (patterns.includes('push_horizontal') || patterns.includes('dip')) {
    drills.push({ name: 'Scapular Push-ups', durationSec: 30, description: '10 reps — protract/retract scapula in plank.' });
  }
  if (patterns.includes('pull_vertical') || patterns.includes('pull_horizontal')) {
    drills.push({ name: 'Dead Hang', durationSec: 30, description: 'Hang from bar 30 seconds, relax shoulders.' });
  }
  if (patterns.includes('squat') || patterns.includes('hinge')) {
    drills.push({ name: 'Bodyweight Squat', durationSec: 30, description: '10 slow reps, focus on depth and tracking.' });
  }
  return drills;
}

// ─── Finisher generator ───────────────────────────────────────────────────────

function generateFinisher(userLevel: number, dupSlot: DupSlot): Drill {
  if (dupSlot === 'recovery') {
    return { name: 'Static Stretching', durationSec: 300, description: '5 min: hip flexors, hamstrings, chest, lats. Hold 30s each.' };
  }
  if (dupSlot === 'conditioning') {
    return { name: 'Tabata Burpees', durationSec: 240, description: '8 rounds: 20s max burpees, 10s rest.' };
  }
  if (userLevel >= 15) {
    return { name: 'Max Rep Finisher', durationSec: 120, description: 'One all-out set of push-ups to failure. Log your count.' };
  }
  return { name: 'Core Plank Hold', durationSec: 60, description: 'One 60-second plank hold. Focus on breathing.' };
}

// ─── Novelty injection ────────────────────────────────────────────────────────

function isNoveltyDay(date: Date): boolean {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % 7 === 0;
}

function generateNoveltyChallenge(userLevel: number): string {
  const challenges = [
    'EMOM 10 min: 5 push-ups + 5 squats every minute',
    'AMRAP 8 min: 3 pull-ups, 6 push-ups, 9 squats',
    'Pyramid: 1-2-3-4-5-4-3-2-1 reps of push-ups',
    '100 rep challenge: push-ups in as few sets as possible',
    'Tabata push-ups: 8 rounds 20s on / 10s off',
    '5 rounds: 10 squats + 10 push-ups + 10 glute bridges',
  ];
  return challenges[userLevel % challenges.length];
}

// ─── Tier selection based on user level ───────────────────────────────────────

function getTierForLevel(userLevel: number): number {
  if (userLevel <= 5) return 1;
  if (userLevel <= 10) return 2;
  if (userLevel <= 18) return 3;
  if (userLevel <= 28) return 4;
  if (userLevel <= 38) return 5;
  if (userLevel <= 45) return 6;
  return 7;
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateDailyWorkout(input: {
  date: Date;
  userLevel: number;
  equipment: Equipment[];
  rolling7dVolume: Record<MuscleGroup, number>;
  recentExerciseIds: string[];
  seed?: number;
}): Workout {
  const rand = seededRandom(
    input.seed ?? (input.date.getFullYear() * 10000 + (input.date.getMonth() + 1) * 100 + input.date.getDate())
  );

  const dupSlot = getDupSlot(input.date);
  const dupConfig = DUP_CONFIGS[dupSlot];
  const baseTier = getTierForLevel(input.userLevel);

  // 1. Pick block template based on day
  const templateIndex = input.date.getDay();
  const patterns = BLOCK_TEMPLATES[templateIndex % BLOCK_TEMPLATES.length];

  // 2. Calculate muscle deficits to bias selection
  const muscleDeficits: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  for (const [muscle, target] of Object.entries(WEEKLY_VOLUME_TARGETS)) {
    const current = input.rolling7dVolume[muscle as MuscleGroup] ?? 0;
    muscleDeficits[muscle as MuscleGroup] = Math.max(0, target - current);
  }

  // 3. Select exercises for each pattern
  const blocks: WorkoutBlock[] = [];

  for (let i = 0; i < patterns.length; i++) {
    const category = patterns[i];
    const isPrimary = i < 2;

    // Filter available exercises
    let candidates = EXERCISE_LIBRARY.filter((ex) => {
      // Must match category
      if (ex.category !== category) return false;
      // Must have required equipment
      if (!ex.equipment.every((req) => input.equipment.includes(req))) return false;
      // Tier within ±1 of base tier, prefer DUP preferred tiers
      const tierMin = Math.max(1, baseTier - 1);
      const tierMax = Math.min(7, baseTier + 1);
      if (ex.tier < tierMin || ex.tier > tierMax) return false;
      return true;
    });

    // Fallback: relax tier constraint if no candidates
    if (candidates.length === 0) {
      candidates = EXERCISE_LIBRARY.filter(
        (ex) => ex.category === category &&
          ex.equipment.every((req) => input.equipment.includes(req))
      );
    }

    if (candidates.length === 0) continue;

    // Weight candidates: prefer not-recently-used, prefer higher deficit muscles
    const weights = candidates.map((ex) => {
      let w = 1.0;
      // Penalize recently used
      if (input.recentExerciseIds.includes(ex.id)) w *= 0.2;
      // Bonus for muscle deficit
      const muscles = PATTERN_MUSCLES[ex.category] ?? [];
      const deficitBonus = muscles.reduce(
        (sum, m) => sum + (muscleDeficits[m] ?? 0), 0
      );
      w += deficitBonus * 0.1;
      // Bonus for DUP preferred tiers
      if (dupConfig.preferTiers.includes(ex.tier)) w *= 1.5;
      return w;
    });

    const exercise = pickWeighted(candidates, weights, rand);

    // Determine reps within DUP range, clamped to exercise limits
    const [rMin, rMax] = dupConfig.repRange;
    const targetReps = Math.round(
      Math.min(exercise.maxReps, Math.max(exercise.minReps,
        rMin + Math.floor(rand() * (rMax - rMin + 1))
      ))
    );

    const sets = isPrimary ? dupConfig.setsCompound : dupConfig.setsAccessory;

    blocks.push({
      exercise,
      sets,
      targetReps,
      rir: dupConfig.rir,
      restSec: dupConfig.restSec,
      tempo: dupConfig.tempo !== 'fast' ? dupConfig.tempo : exercise.defaultTempo,
      isPrimary,
    });
  }

  // 4. Warmup + finisher
  const warmup = generateWarmup(patterns);
  const finisher = generateFinisher(input.userLevel, dupSlot);

  // 5. Novelty challenge
  const noveltyChallenge = isNoveltyDay(input.date)
    ? generateNoveltyChallenge(input.userLevel)
    : undefined;

  // 6. Estimate duration
  const setDuration = (block: WorkoutBlock) =>
    block.sets * (block.targetReps * 3 + block.restSec);
  const totalSec =
    warmup.reduce((s, d) => s + d.durationSec, 0) +
    blocks.reduce((s, b) => s + setDuration(b), 0) +
    finisher.durationSec;
  const estDurationMin = Math.round(totalSec / 60);

  // 7. Muscle emphasis for display
  const muscleEmphasis = Array.from(
    new Set(blocks.flatMap((b) => b.exercise.muscleGroups))
  );

  return {
    date: input.date.toISOString().split('T')[0],
    dupSlot,
    warmup,
    blocks,
    finisher,
    estDurationMin: Math.min(60, Math.max(25, estDurationMin)),
    noveltyChallenge,
    muscleEmphasis,
  };
}

// ─── Rolling volume tracker ───────────────────────────────────────────────────

export function addSetsToVolume(
  current: Record<MuscleGroup, number>,
  muscles: MuscleGroup[],
  sets: number
): Record<MuscleGroup, number> {
  const updated = { ...current };
  for (const m of muscles) {
    updated[m] = (updated[m] ?? 0) + sets;
  }
  return updated;
}
