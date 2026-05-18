export const SHEET_TABS = {
  WORKOUTS: 'workouts',
  SETS: 'sets',
  EXERCISE_LIBRARY: 'exercise_library',
  STREAK: 'streak',
  VOLUME_WEEKLY: 'volume_weekly',
  ACHIEVEMENTS: 'achievements',
  SETTINGS: 'settings',
} as const;

export const HEADERS = {
  workouts: [
    'timestamp_iso', 'session_id', 'day_of_week', 'workout_type',
    'total_duration_min', 'total_sets', 'total_reps', 'avg_form_score',
    'rir_avg', 'notes',
  ],
  sets: [
    'timestamp_iso', 'session_id', 'exercise_id', 'exercise_name',
    'muscle_groups', 'set_number', 'target_reps', 'actual_reps',
    'rir', 'tempo', 'form_score', 'cv_verified', 'duration_sec',
  ],
  streak: [
    'date', 'completed', 'streak_length', 'streak_freezes_used',
    'xp_earned', 'level_at_end',
  ],
  volume_weekly: [
    'iso_week', 'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quads', 'hamstrings', 'glutes', 'core',
  ],
  achievements: [
    'timestamp_iso', 'badge_id', 'badge_name', 'category', 'xp_awarded',
  ],
} as const;
