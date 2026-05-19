export type BadgeCategory = 'consistency' | 'volume' | 'skill' | 'exploration';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  xpAwarded: number;
  secret?: boolean;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // Consistency
  { id: 'first_workout', name: 'First Rep', description: 'Complete your first workout.', emoji: '🌱', category: 'consistency', xpAwarded: 50 },
  { id: 'streak_3', name: 'Hat Trick', description: '3-day streak.', emoji: '🎩', category: 'consistency', xpAwarded: 75 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak.', emoji: '⚔️', category: 'consistency', xpAwarded: 150 },
  { id: 'streak_14', name: 'Fortnight Fighter', description: '14-day streak.', emoji: '🌙', category: 'consistency', xpAwarded: 250 },
  { id: 'streak_30', name: 'Iron Month', description: '30-day streak.', emoji: '🔩', category: 'consistency', xpAwarded: 500 },
  { id: 'streak_66', name: 'Habit Locked', description: '66-day streak — automaticity achieved.', emoji: '🧠', category: 'consistency', xpAwarded: 1000 },
  { id: 'streak_100', name: 'Centurion', description: '100-day streak.', emoji: '💯', category: 'consistency', xpAwarded: 2000 },
  { id: 'streak_365', name: 'Legend', description: '365-day streak. One full year.', emoji: '🏆', category: 'consistency', xpAwarded: 10000 },

  // Volume
  { id: 'reps_100', name: 'Century', description: 'Log 100 total reps.', emoji: '💪', category: 'volume', xpAwarded: 100 },
  { id: 'reps_1000', name: 'Kilo Rep', description: 'Log 1,000 total reps.', emoji: '🔥', category: 'volume', xpAwarded: 300 },
  { id: 'reps_10000', name: 'Ten Thousand', description: 'Log 10,000 total reps.', emoji: '⚡', category: 'volume', xpAwarded: 1000 },
  { id: 'sets_50', name: 'Set Grinder', description: 'Complete 50 total sets.', emoji: '⚙️', category: 'volume', xpAwarded: 150 },
  { id: 'sets_500', name: 'Volume King', description: 'Complete 500 total sets.', emoji: '👑', category: 'volume', xpAwarded: 500 },
  { id: 'iron_week', name: 'Iron Week', description: 'Hit all weekly volume targets in one week.', emoji: '🏋️', category: 'volume', xpAwarded: 750 },

  // Skill
  { id: 'first_pullup', name: 'Pull Power', description: 'Complete a strict pull-up set.', emoji: '🦾', category: 'skill', xpAwarded: 200 },
  { id: 'first_pistol', name: 'Pistol Pioneer', description: 'Complete a pistol squat set.', emoji: '🦵', category: 'skill', xpAwarded: 300 },
  { id: 'first_archer_pushup', name: 'Archer', description: 'Complete an archer push-up set.', emoji: '🏹', category: 'skill', xpAwarded: 250 },
  { id: 'first_hspu', name: 'Upside Down', description: 'Complete a wall handstand push-up set.', emoji: '🙃', category: 'skill', xpAwarded: 400 },
  { id: 'first_dragon_flag', name: 'Dragon', description: 'Complete a dragon flag negative set.', emoji: '🐉', category: 'skill', xpAwarded: 500 },
  { id: 'level_5', name: 'Level Up', description: 'Reach Level 5.', emoji: '⭐', category: 'skill', xpAwarded: 100 },
  { id: 'level_10', name: 'Double Digits', description: 'Reach Level 10.', emoji: '🌟', category: 'skill', xpAwarded: 250 },
  { id: 'level_25', name: 'Veteran', description: 'Reach Level 25.', emoji: '💫', category: 'skill', xpAwarded: 1000 },

  // Exploration
  { id: 'exercises_5', name: 'Explorer', description: 'Try 5 different exercises.', emoji: '🗺️', category: 'exploration', xpAwarded: 75 },
  { id: 'exercises_10', name: 'Variety Pack', description: 'Try 10 different exercises.', emoji: '🎲', category: 'exploration', xpAwarded: 150 },
  { id: 'exercises_25', name: 'Movement Master', description: 'Try 25 different exercises.', emoji: '🎯', category: 'exploration', xpAwarded: 400 },
  { id: 'all_patterns', name: 'Full Spectrum', description: 'Complete every movement pattern in one week.', emoji: '🌈', category: 'exploration', xpAwarded: 500 },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a workout before 7am.', emoji: '🌅', category: 'exploration', xpAwarded: 100, secret: true },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a workout after 10pm.', emoji: '🦉', category: 'exploration', xpAwarded: 100, secret: true },
];

export interface BadgeCheckInput {
  totalReps: number;
  totalSets: number;
  streak: number;
  level: number;
  uniqueExerciseIds: string[];
  completedExerciseIds: string[]; // from current session
  completedAt: Date;
  existingBadgeIds: string[];
}

export function checkNewBadges(input: BadgeCheckInput): BadgeDef[] {
  const earned: BadgeDef[] = [];
  const has = (id: string) => input.existingBadgeIds.includes(id);

  const check = (id: string) => {
    if (has(id)) return false;
    const def = BADGE_DEFINITIONS.find((b) => b.id === id);
    if (!def) return false;
    earned.push(def);
    return true;
  };

  // First workout
  if (input.totalSets >= 1) check('first_workout');

  // Streak milestones
  if (input.streak >= 3) check('streak_3');
  if (input.streak >= 7) check('streak_7');
  if (input.streak >= 14) check('streak_14');
  if (input.streak >= 30) check('streak_30');
  if (input.streak >= 66) check('streak_66');
  if (input.streak >= 100) check('streak_100');
  if (input.streak >= 365) check('streak_365');

  // Volume — reps
  if (input.totalReps >= 100) check('reps_100');
  if (input.totalReps >= 1000) check('reps_1000');
  if (input.totalReps >= 10000) check('reps_10000');

  // Volume — sets
  if (input.totalSets >= 50) check('sets_50');
  if (input.totalSets >= 500) check('sets_500');

  // Level
  if (input.level >= 5) check('level_5');
  if (input.level >= 10) check('level_10');
  if (input.level >= 25) check('level_25');

  // Exploration
  if (input.uniqueExerciseIds.length >= 5) check('exercises_5');
  if (input.uniqueExerciseIds.length >= 10) check('exercises_10');
  if (input.uniqueExerciseIds.length >= 25) check('exercises_25');

  // Skill badges — check if session included specific exercises
  if (input.completedExerciseIds.includes('pull_strict') || input.completedExerciseIds.includes('pull_chin')) check('first_pullup');
  if (input.completedExerciseIds.includes('squat_pistol')) check('first_pistol');
  if (input.completedExerciseIds.includes('push_archer')) check('first_archer_pushup');
  if (input.completedExerciseIds.includes('push_wall_hspu')) check('first_hspu');
  if (input.completedExerciseIds.includes('core_dragon_flag_neg')) check('first_dragon_flag');

  // Time-based
  const hour = input.completedAt.getHours();
  if (hour < 7) check('early_bird');
  if (hour >= 22) check('night_owl');

  return earned;
}
