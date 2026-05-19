// Streak logic — all dates in UTC YYYY-MM-DD format

export function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(da - db) / 86400000);
}

export interface StreakUpdateResult {
  newStreak: number;
  freezeConsumed: boolean;
  streakBroken: boolean;
  isNewDay: boolean;
}

export function processStreakUpdate(params: {
  currentStreak: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
  todayDate?: string;
}): StreakUpdateResult {
  const today = params.todayDate ?? getTodayUTC();
  const last = params.lastCompletedDate;

  // Already completed today
  if (last === today) {
    return { newStreak: params.currentStreak, freezeConsumed: false, streakBroken: false, isNewDay: false };
  }

  // First ever workout
  if (!last) {
    return { newStreak: 1, freezeConsumed: false, streakBroken: false, isNewDay: true };
  }

  const days = daysBetween(last, today);

  // Consecutive day
  if (days === 1) {
    return { newStreak: params.currentStreak + 1, freezeConsumed: false, streakBroken: false, isNewDay: true };
  }

  // Missed exactly 1 day — try to use a freeze
  if (days === 2 && params.freezesAvailable > 0) {
    return { newStreak: params.currentStreak + 1, freezeConsumed: true, streakBroken: false, isNewDay: true };
  }

  // Streak broken
  return { newStreak: 1, freezeConsumed: false, streakBroken: true, isNewDay: true };
}

// Milestone streak days that earn celebration
export const STREAK_MILESTONES = [3, 7, 14, 30, 66, 100, 365];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export function getStreakMessage(streak: number): string {
  if (streak >= 365) return '🏆 One full year. Legendary.';
  if (streak >= 100) return '💯 100 days. Unstoppable.';
  if (streak >= 66) return '🧠 66 days — habit locked in.';
  if (streak >= 30) return '🔥 30 day streak. On fire.';
  if (streak >= 14) return '⚡ 2 weeks strong.';
  if (streak >= 7) return '🌟 One full week!';
  if (streak >= 3) return '👊 3 days in a row!';
  return '💪 Keep it up!';
}
