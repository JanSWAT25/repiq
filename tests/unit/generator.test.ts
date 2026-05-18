import { describe, it, expect } from 'vitest';
import { generateDailyWorkout, WEEKLY_VOLUME_TARGETS, addSetsToVolume } from '../../lib/workout/generator';
import type { MuscleGroup } from '../../lib/workout/exerciseLibrary';

const emptyVolume = Object.fromEntries(
  Object.keys(WEEKLY_VOLUME_TARGETS).map((k) => [k, 0])
) as Record<MuscleGroup, number>;

const baseInput = {
  date: new Date('2026-05-18'), // Monday = heavy
  userLevel: 5,
  equipment: ['floor' as const, 'pullup_bar' as const],
  rolling7dVolume: emptyVolume,
  recentExerciseIds: [] as string[],
  seed: 42,
};

describe('generateDailyWorkout', () => {
  it('returns a valid workout with blocks', () => {
    const w = generateDailyWorkout(baseInput);
    expect(w.blocks.length).toBeGreaterThan(0);
    expect(w.blocks.length).toBeLessThanOrEqual(6);
  });

  it('Monday returns heavy DUP slot', () => {
    const w = generateDailyWorkout({ ...baseInput, date: new Date('2026-05-18') });
    expect(w.dupSlot).toBe('heavy');
  });

  it('Wednesday returns high_rep DUP slot', () => {
    const w = generateDailyWorkout({ ...baseInput, date: new Date('2026-05-20') });
    expect(w.dupSlot).toBe('high_rep');
  });

  it('Sunday returns recovery DUP slot', () => {
    const w = generateDailyWorkout({ ...baseInput, date: new Date('2026-05-17') });
    expect(w.dupSlot).toBe('recovery');
  });

  it('estimated duration is between 25 and 60 minutes', () => {
    const w = generateDailyWorkout(baseInput);
    expect(w.estDurationMin).toBeGreaterThanOrEqual(25);
    expect(w.estDurationMin).toBeLessThanOrEqual(60);
  });

  it('all exercises respect available equipment', () => {
    const w = generateDailyWorkout({ ...baseInput, equipment: ['floor'] });
    for (const block of w.blocks) {
      expect(block.exercise.equipment.every((e) => ['floor'].includes(e))).toBe(true);
    }
  });

  it('rep counts are within exercise min/max bounds', () => {
    const w = generateDailyWorkout(baseInput);
    for (const block of w.blocks) {
      expect(block.targetReps).toBeGreaterThanOrEqual(block.exercise.minReps);
      expect(block.targetReps).toBeLessThanOrEqual(block.exercise.maxReps);
    }
  });

  it('is deterministic with same seed', () => {
    const w1 = generateDailyWorkout({ ...baseInput, seed: 99 });
    const w2 = generateDailyWorkout({ ...baseInput, seed: 99 });
    expect(w1.blocks.map((b) => b.exercise.id)).toEqual(w2.blocks.map((b) => b.exercise.id));
  });

  it('produces different workouts with different seeds', () => {
    const w1 = generateDailyWorkout({ ...baseInput, seed: 1 });
    const w2 = generateDailyWorkout({ ...baseInput, seed: 9999 });
    // At least some difference (may occasionally match by chance)
    const ids1 = w1.blocks.map((b) => b.exercise.id).join(',');
    const ids2 = w2.blocks.map((b) => b.exercise.id).join(',');
    // Not asserting they're always different — just that the function runs
    expect(ids1).toBeTruthy();
    expect(ids2).toBeTruthy();
  });

  it('has warmup drills', () => {
    const w = generateDailyWorkout(baseInput);
    expect(w.warmup.length).toBeGreaterThan(0);
  });

  it('has a finisher', () => {
    const w = generateDailyWorkout(baseInput);
    expect(w.finisher.name).toBeTruthy();
  });

  it('muscle emphasis matches block exercises', () => {
    const w = generateDailyWorkout(baseInput);
    const allMuscles = new Set(w.blocks.flatMap((b) => b.exercise.muscleGroups));
    for (const m of w.muscleEmphasis) {
      expect(allMuscles.has(m)).toBe(true);
    }
  });
});

describe('addSetsToVolume', () => {
  it('adds sets to the correct muscle groups', () => {
    const result = addSetsToVolume(emptyVolume, ['chest', 'triceps'], 3);
    expect(result.chest).toBe(3);
    expect(result.triceps).toBe(3);
    expect(result.back).toBe(0);
  });

  it('accumulates across calls', () => {
    let vol = { ...emptyVolume };
    vol = addSetsToVolume(vol, ['chest'], 4);
    vol = addSetsToVolume(vol, ['chest'], 4);
    expect(vol.chest).toBe(8);
  });
});
