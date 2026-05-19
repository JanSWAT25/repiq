import type { Exercise } from '../workout/exerciseLibrary';

// XP per set formula:
// baseXP[tier] × reps × effort multiplier × form bonus
export const BASE_XP_PER_TIER: Record<number, number> = {
  1: 3, 2: 5, 3: 8, 4: 12, 5: 18, 6: 25, 7: 35,
};

export function calcSetXP(params: {
  exercise: Exercise;
  reps: number;
  rir: number;
  formScore?: number | null;
}): number {
  const base = BASE_XP_PER_TIER[params.exercise.tier] ?? 5;
  const effortMult = 1 + 0.1 * Math.max(0, 3 - params.rir);
  const formBonus = params.formScore != null ? 1 + 0.005 * params.formScore : 1;
  return Math.round(base * params.reps * effortMult * formBonus);
}

export function levelThreshold(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  while (totalXP >= levelThreshold(level + 1)) level++;
  return level;
}

export function getXPProgress(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0–1
} {
  const level = getLevelFromXP(totalXP);
  const currentLevelXP = level > 1 ? levelThreshold(level) : 0;
  const nextLevelXP = levelThreshold(level + 1);
  const progress = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return { level, currentLevelXP, nextLevelXP, progress: Math.min(1, Math.max(0, progress)) };
}

// Variable reward roll (15% chance)
export type VariableReward =
  | { type: 'double_xp'; label: '2× XP Tomorrow'; emoji: '⚡' }
  | { type: 'streak_freeze'; label: 'Streak Freeze'; emoji: '🧊' }
  | { type: 'bonus_xp'; amount: number; label: string; emoji: '💎' };

export function rollVariableReward(): VariableReward | null {
  if (Math.random() > 0.15) return null;
  const roll = Math.random();
  if (roll < 0.4) return { type: 'double_xp', label: '2× XP Tomorrow', emoji: '⚡' };
  if (roll < 0.7) return { type: 'streak_freeze', label: 'Streak Freeze', emoji: '🧊' };
  const amount = Math.floor(Math.random() * 200) + 100;
  return { type: 'bonus_xp', amount, label: `Bonus ${amount} XP`, emoji: '💎' };
}
