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
  workout_type: z.string().optional(),
  day_of_week: z.string().optional(),
  streak_length: z.number().optional(),
  xp_earned: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.sets || body.sets.length === 0) {
      return NextResponse.json({ ok: true, wrote: 0 });
    }
    const parsed = z.array(SetSchema).safeParse(body.sets);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid sets', details: parsed.error }, { status: 400 });
    }
    const values = parsed.data.map((s) => [
      s.user_name ?? 'Athlete', s.timestamp_iso, s.session_id,
      s.exercise_id, s.exercise_name, s.muscle_groups,
      s.set_number, s.target_reps, s.actual_reps,
      s.rir ?? '', s.tempo, s.form_score ?? '', s.cv_verified, s.duration_sec,
      s.workout_type ?? '', s.day_of_week ?? '', s.streak_length ?? '', s.xp_earned ?? '',
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'sets!A:R',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return NextResponse.json({ ok: true, wrote: values.length });
  } catch (err: any) {
    console.error('Sheets append error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
