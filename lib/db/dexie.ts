import Dexie, { type Table } from 'dexie';

export interface PendingSet {
  id?: number;
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
}

export interface PendingWorkout {
  id?: number;
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

export interface CompletedSession {
  id?: number;
  session_id: string;
  date: string; // YYYY-MM-DD
  workout_type: string;
  sets: PendingSet[];
  completed_at: string;
}

class RepIQDatabase extends Dexie {
  pendingSets!: Table<PendingSet>;
  pendingWorkouts!: Table<PendingWorkout>;
  completedSessions!: Table<CompletedSession>;

  constructor() {
    super('RepIQDatabase');
    this.version(1).stores({
      pendingSets: '++id, session_id, timestamp_iso',
      pendingWorkouts: '++id, session_id, synced',
      completedSessions: '++id, session_id, date',
    });
  }
}

export const db = new RepIQDatabase();
