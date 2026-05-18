import { sheets, SPREADSHEET_ID } from '@/lib/sheets/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs'; // CRITICAL: NOT edge

const SetSchema = z.object({
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Write sets
    if (body.sets) {
      const parsed = z.array(SetSchema).safeParse(body.sets);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const values = parsed.data.map((s) => [
        s.timestamp_iso, s.session_id, s.exercise_id, s.exercise_name,
        s.muscle_groups, s.set_number, s.target_reps, s.actual_reps,
        s.rir, s.tempo, s.form_score, s.cv_verified, s.duration_sec,
      ]);
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'sets!A:M',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    }

    // Write workout summary
    if (body.workout) {
      const parsed = WorkoutSchema.safeParse(body.workout);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const w = parsed.data;
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'workouts!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            w.timestamp_iso, w.session_id, w.day_of_week, w.workout_type,
            w.total_duration_min, w.total_sets, w.total_reps,
            w.avg_form_score, w.rir_avg, w.notes ?? '',
          ]],
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sheets append error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
