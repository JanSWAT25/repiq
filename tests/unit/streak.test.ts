import { describe, it, expect } from 'vitest';
import { processStreakUpdate, isStreakMilestone, STREAK_MILESTONES } from '../../lib/gamification/streak';

describe('processStreakUpdate', () => {
  it('starts streak at 1 for first workout', () => {
    const r = processStreakUpdate({ currentStreak: 0, lastCompletedDate: null, freezesAvailable: 0, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(1);
    expect(r.isNewDay).toBe(true);
  });

  it('increments on consecutive day', () => {
    const r = processStreakUpdate({ currentStreak: 5, lastCompletedDate: '2026-05-18', freezesAvailable: 0, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(6);
    expect(r.streakBroken).toBe(false);
  });

  it('does not increment if already completed today', () => {
    const r = processStreakUpdate({ currentStreak: 5, lastCompletedDate: '2026-05-19', freezesAvailable: 0, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(5);
    expect(r.isNewDay).toBe(false);
  });

  it('uses freeze when one day missed', () => {
    const r = processStreakUpdate({ currentStreak: 10, lastCompletedDate: '2026-05-17', freezesAvailable: 1, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(11);
    expect(r.freezeConsumed).toBe(true);
    expect(r.streakBroken).toBe(false);
  });

  it('breaks streak when one day missed and no freeze', () => {
    const r = processStreakUpdate({ currentStreak: 10, lastCompletedDate: '2026-05-17', freezesAvailable: 0, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(1);
    expect(r.streakBroken).toBe(true);
  });

  it('breaks streak after 2+ missed days even with freeze', () => {
    const r = processStreakUpdate({ currentStreak: 10, lastCompletedDate: '2026-05-15', freezesAvailable: 2, todayDate: '2026-05-19' });
    expect(r.newStreak).toBe(1);
    expect(r.streakBroken).toBe(true);
  });
});

describe('isStreakMilestone', () => {
  it('identifies milestone days', () => {
    for (const m of STREAK_MILESTONES) {
      expect(isStreakMilestone(m)).toBe(true);
    }
  });

  it('non-milestones return false', () => {
    expect(isStreakMilestone(4)).toBe(false);
    expect(isStreakMilestone(50)).toBe(false);
  });
});
