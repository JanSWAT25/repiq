export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  emoji: string;
  checkFn: (session: QuestSession) => boolean;
}

export interface QuestSession {
  totalReps: number;
  totalSets: number;
  avgFormScore: number | null;
  exerciseIds: string[];
  durationMin: number;
  minRir: number;
}

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'q_extra_push',
    title: 'Push Extra',
    description: 'Log at least 30 push-up reps today.',
    xpReward: 50,
    emoji: '💪',
    checkFn: (s) => s.exerciseIds.filter((id) => id.includes('push')).length > 0 && s.totalReps >= 30,
  },
  {
    id: 'q_form_score',
    title: 'Perfect Form',
    description: 'Achieve 80%+ avg form score (CV required).',
    xpReward: 75,
    emoji: '🎯',
    checkFn: (s) => (s.avgFormScore ?? 0) >= 80,
  },
  {
    id: 'q_five_sets',
    title: 'High Volume',
    description: 'Complete at least 5 sets today.',
    xpReward: 40,
    emoji: '📦',
    checkFn: (s) => s.totalSets >= 5,
  },
  {
    id: 'q_rir_zero',
    title: 'Go to Failure',
    description: 'Hit RIR 0 on at least one set.',
    xpReward: 60,
    emoji: '🔥',
    checkFn: (s) => s.minRir === 0,
  },
  {
    id: 'q_long_session',
    title: 'Endurance',
    description: 'Complete a workout lasting 40+ minutes.',
    xpReward: 80,
    emoji: '⏱️',
    checkFn: (s) => s.durationMin >= 40,
  },
  {
    id: 'q_variety',
    title: 'Move Different',
    description: 'Include 4 different exercises in one session.',
    xpReward: 50,
    emoji: '🌈',
    checkFn: (s) => new Set(s.exerciseIds).size >= 4,
  },
  {
    id: 'q_fifty_reps',
    title: 'Rep Machine',
    description: 'Log 50+ total reps in one session.',
    xpReward: 60,
    emoji: '🤖',
    checkFn: (s) => s.totalReps >= 50,
  },
];

export function getDailyQuest(date: Date): Quest {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_QUESTS[dayOfYear % DAILY_QUESTS.length];
}

export function checkQuestComplete(quest: Quest, session: QuestSession): boolean {
  return quest.checkFn(session);
}
