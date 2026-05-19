import { sheets, SPREADSHEET_ID } from '@/lib/sheets/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const SetSchema = z.object({
  user_name: z.string().optional(),
  timestamp_iso: z.string(),
  session_id: z.string(),
  exercise_id: z.string(),
  exercise_name: z.string(),
  muscle_groups: z.string(),
  set_number: z.number(),
  target_reps: z.number(),
  actual_reps: z.number(),
  rir: z.number().nullable(),
  tempo: z.string(),
  form_score: z.number().nullable(),
  cv_verified: z.boolean(),
  duration_sec: z.number(),
});

const WorkoutSchema = z.object({
  user_name: z.string().optional(),
  timestamp_iso: z.string(),
  session_id: z.string(),
  day_of_week: z.string(),
  workout_type: z.string(),
  total_duration_min: z.number(),
  total_sets: z.number(),
  total_reps: z.number(),
  avg_form_score: z.number().nullable(),
  rir_avg: z.number().nullable(),
  notes: z.string().optional(),
});

const StreakSchema = z.object({
  user_name: z.string().optional(),
  date: z.string(),
  completed: z.boolean(),
  streak_length: z.number(),
  streak_freezes_used: z.number(),
  xp_earned: z.number(),
  level_at_end: z.number(),
});

const AchievementSchema = z.object({
  user_name: z.string().optional(),
  timestamp_iso: z.string(),
  badge_id: z.string(),
  badge_name: z.string(),
  category: z.string(),
  xp_awarded: z.number(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requests: Promise<any>[] = [];

    // Write sets
    if (body.sets && body.sets.length > 0) {
      const parsed = z.array(SetSchema).safeParse(body.sets);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid sets', details: parsed.error }, { status: 400 });
      }
      const values = parsed.data.map((s) => [
        s.user_name ?? 'Athlete',
        s.timestamp_iso, s.session_id, s.exercise_id, s.exercise_name,
        s.muscle_groups, s.set_number, s.target_reps, s.actual_reps,
        s.rir, s.tempo, s.form_score, s.cv_verified, s.duration_sec,
      ]);
      requests.push(
        sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'sets!A:N',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        })
      );
    }

    // Write workout summary
    if (body.workout) {
      const parsed = WorkoutSchema.safeParse(body.workout);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid workout', details: parsed.error }, { status: 400 });
      }
      const w = parsed.data;
      requests.push(
        sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'workouts!A:K',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              w.user_name ?? 'Athlete',
              w.timestamp_iso, w.session_id, w.day_of_week, w.workout_type,
              w.total_duration_min, w.total_sets, w.total_reps,
              w.avg_form_score, w.rir_avg, w.notes ?? '',
            ]],
          },
        })
      );
    }

    // Write streak
    if (body.streak) {
      const parsed = StreakSchema.safeParse(body.streak);
      if (parsed.success) {
        const s = parsed.data;
        requests.push(
          sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'streak!A:G',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[
                s.user_name ?? 'Athlete',
                s.date, s.completed, s.streak_length,
                s.streak_freezes_used, s.xp_earned, s.level_at_end,
              ]],
            },
          })
        );
      }
    }

    // Write achievements
    if (body.achievements && body.achievements.length > 0) {
      const parsed = z.array(AchievementSchema).safeParse(body.achievements);
      if (parsed.success && parsed.data.length > 0) {
        const values = parsed.data.map((a) => [
          a.user_name ?? 'Athlete',
          a.timestamp_iso, a.badge_id, a.badge_name, a.category, a.xp_awarded,
        ]);
        requests.push(
          sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'achievements!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          })
        );
      }
    }

    // Execute all writes in parallel
    await Promise.all(requests);
    return NextResponse.json({ ok: true, wrote: requests.length });
  } catch (err: any) {
    console.error('Sheets append error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
