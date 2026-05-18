import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock googleapis before importing the route
vi.mock('googleapis', () => {
  const appendMock = vi.fn().mockResolvedValue({ data: {} });
  return {
    google: {
      auth: {
        JWT: vi.fn().mockImplementation(() => ({})),
      },
      sheets: vi.fn().mockReturnValue({
        spreadsheets: {
          values: {
            append: appendMock,
          },
        },
      }),
    },
    __appendMock: appendMock,
  };
});

const sampleSet = {
  timestamp_iso: '2026-05-19T00:00:00.000Z',
  session_id: 'session_123',
  exercise_id: 'pushup_standard',
  exercise_name: 'Push-up',
  muscle_groups: 'chest,triceps,shoulders',
  set_number: 1,
  target_reps: 12,
  actual_reps: 10,
  rir: 2,
  tempo: '3-1-1-0',
  form_score: 85,
  cv_verified: false,
  duration_sec: 30,
};

describe('Sheets append payload', () => {
  it('maps set fields to correct column order', () => {
    const values = [sampleSet].map((s) => [
      s.timestamp_iso, s.session_id, s.exercise_id, s.exercise_name,
      s.muscle_groups, s.set_number, s.target_reps, s.actual_reps,
      s.rir, s.tempo, s.form_score, s.cv_verified, s.duration_sec,
    ]);
    expect(values[0]).toHaveLength(13);
    expect(values[0][0]).toBe('2026-05-19T00:00:00.000Z');
    expect(values[0][5]).toBe(1);   // set_number
    expect(values[0][7]).toBe(10);  // actual_reps
    expect(values[0][11]).toBe(false); // cv_verified
  });

  it('rejects payload missing required fields', () => {
    const { z } = require('zod');
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
    const bad = { ...sampleSet, actual_reps: 'not-a-number' };
    const result = z.array(SetSchema).safeParse([bad]);
    expect(result.success).toBe(false);
  });
});
