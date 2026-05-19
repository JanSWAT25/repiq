import Dexie, { type Table } from 'dexie';

export interface PendingSet {
  id?: number;
  user_name?: string;
  timestamp_iso: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_groups: string;
  set_number: number;
  target_reps: number;
  actual_reps: number;
  rir: number | null;
  tempo: string;
  form_score: number | null;
  cv_verified: boolean;
  duration_sec: number;
  workout_type?: string;
  day_of_week?: string;
  streak_length?: number;
  xp_earned?: number;
}

export interface PendingWorkout {
  id?: number;
  user_name?: string;
  timestamp_iso: string;
  session_id: string;
  day_of_week: string;
  workout_type: string;
  total_duration_min: number;
  total_sets: number;
  total_reps: number;
  avg_form_score: number | null;
  rir_avg: number | null;
  notes?: string;
  synced: boolean;
}

export interface PendingStreak {
  id?: number;
  user_name?: string;
  date: string;
  completed: boolean;
  streak_length: number;
  streak_freezes_used: number;
  xp_earned: number;
  level_at_end: number;
  synced: boolean;
}

export interface PendingAchievement {
  id?: number;
  user_name?: string;
  timestamp_iso: string;
  badge_id: string;
  badge_name: string;
  category: string;
  xp_awarded: number;
  synced: boolean;
}

export interface CompletedSet {
  id?: number;
  session_id: string;
  date: string; // YYYY-MM-DD
  exercise_id: string;
  muscle_groups: string; // comma-separated
  actual_reps: number;
  sets: number;
}

class RepIQDatabase extends Dexie {
  pendingSets!: Table<PendingSet>;
  pendingWorkouts!: Table<PendingWorkout>;
  pendingStreaks!: Table<PendingStreak>;
  pendingAchievements!: Table<PendingAchievement>;
  completedSets!: Table<CompletedSet>;

  constructor() {
    super('RepIQDatabase');
    this.version(2).stores({
      pendingSets: '++id, session_id, timestamp_iso',
      pendingWorkouts: '++id, session_id, synced',
      pendingStreaks: '++id, date, synced',
      pendingAchievements: '++id, badge_id, synced',
      completedSets: '++id, session_id, date, exercise_id',
    });
  }
}

export const db = new RepIQDatabase();
