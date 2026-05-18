'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkoutStore } from '@/store/workoutStore';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { generateDailyWorkout, WEEKLY_VOLUME_TARGETS, type Workout } from '@/lib/workout/generator';
import { db } from '@/lib/db/dexie';
import { flushPendingToSheets } from '@/lib/db/sync';
import { requestWakeLock, releaseWakeLock } from '@/lib/wakeLock';
import { generateSessionId, formatDuration, getTodayDateString, getDayOfWeek } from '@/lib/utils';
import type { MuscleGroup } from '@/lib/workout/exerciseLibrary';
import type { SetLog } from '@/store/workoutStore';

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <p className="text-neutral-400 text-sm uppercase tracking-widest">Rest</p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="#ef4444" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
          {remaining}
        </span>
      </div>
      <button
        onClick={onDone}
        className="text-sm text-neutral-400 underline"
      >
        Skip rest
      </button>
    </div>
  );
}

// ─── Rep Counter ──────────────────────────────────────────────────────────────

function RepCounter({
  target,
  onComplete,
}: {
  target: number;
  onComplete: (reps: number, rir: number) => void;
}) {
  const [reps, setReps] = useState(target);
  const [rir, setRir] = useState(2);
  const setStart = useRef(Date.now());

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="text-neutral-400 text-sm">Target: {target} reps</p>

      {/* Rep counter */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setReps((r) => Math.max(0, r - 1))}
          className="w-14 h-14 bg-neutral-800 rounded-full text-2xl font-bold active:bg-neutral-700"
        >−</button>
        <span className="text-6xl font-bold w-24 text-center tabular-nums">{reps}</span>
        <button
          onClick={() => setReps((r) => r + 1)}
          className="w-14 h-14 bg-neutral-800 rounded-full text-2xl font-bold active:bg-neutral-700"
        >+</button>
      </div>

      {/* RIR selector */}
      <div>
        <p className="text-xs text-neutral-500 text-center mb-2">Reps in Reserve (RIR)</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((r) => (
            <button
              key={r}
              onClick={() => setRir(r)}
              className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                rir === r ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Log set button */}
      <button
        onClick={() => {
          const durationSec = Math.round((Date.now() - setStart.current) / 1000);
          onComplete(reps, rir);
        }}
        className="w-full max-w-xs bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        Log Set ✓
      </button>
    </div>
  );
}

// ─── Main Workout Page ────────────────────────────────────────────────────────

import { Suspense } from 'react';

function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { equipment } = useSettingsStore();
  const { level, addXP, incrementStreak } = useUserStore();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [blockIdx, setBlockIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState<SetLog[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef(Date.now());

  // Generate workout
  useEffect(() => {
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();
    const emptyVolume = Object.fromEntries(
      Object.keys(WEEKLY_VOLUME_TARGETS).map((k) => [k, 0])
    ) as Record<MuscleGroup, number>;

    const w = generateDailyWorkout({
      date,
      userLevel: level,
      equipment,
      rolling7dVolume: emptyVolume,
      recentExerciseIds: [],
    });
    setWorkout(w);
  }, [level, equipment, searchParams]);

  // Start session
  const handleStart = useCallback(async () => {
    setSessionStarted(true);
    sessionStart.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    await requestWakeLock();
  }, []);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, []);

  // Log a completed set
  const handleSetComplete = useCallback(
    async (reps: number, rir: number) => {
      if (!workout) return;
      const block = workout.blocks[blockIdx];
      const setDuration = Math.round((Date.now() - sessionStart.current) / 1000);

      const setLog: SetLog = {
        setNumber: setIdx + 1,
        targetReps: block.targetReps,
        actualReps: reps,
        rir,
        formScore: null,
        cvVerified: false,
        durationSec: setDuration,
        completedAt: new Date().toISOString(),
      };

      setCompletedSets((prev) => [...prev, setLog]);

      // Persist to Dexie
      await db.pendingSets.add({
        timestamp_iso: new Date().toISOString(),
        session_id: sessionId,
        exercise_id: block.exercise.id,
        exercise_name: block.exercise.name,
        muscle_groups: block.exercise.muscleGroups.join(','),
        set_number: setIdx + 1,
        target_reps: block.targetReps,
        actual_reps: reps,
        rir,
        tempo: block.tempo,
        form_score: null,
        cv_verified: false,
        duration_sec: setDuration,
      });

      // XP: base 5 × tier × reps × effort multiplier
      const xp = Math.round(
        5 * block.exercise.tier * reps * (1 + 0.1 * (3 - rir))
      );
      addXP(xp);

      // Advance to next set or next block
      if (setIdx < block.sets - 1) {
        setSetIdx((i) => i + 1);
        setIsResting(true);
      } else if (blockIdx < workout.blocks.length - 1) {
        setBlockIdx((i) => i + 1);
        setSetIdx(0);
        setIsResting(true);
      } else {
        // Workout complete!
        await handleWorkoutComplete(reps);
      }
    },
    [workout, blockIdx, setIdx, sessionId, addXP]
  );

  // Complete the workout
  const handleWorkoutComplete = useCallback(
    async (lastReps: number) => {
      if (!workout) return;
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();

      const totalDuration = Math.round((Date.now() - sessionStart.current) / 1000 / 60);
      const totalSets = completedSets.length + 1;
      const totalReps = completedSets.reduce((s, l) => s + l.actualReps, 0) + lastReps;

      // Write workout summary to Dexie
      await db.pendingWorkouts.add({
        timestamp_iso: new Date().toISOString(),
        session_id: sessionId,
        day_of_week: getDayOfWeek(new Date()),
        workout_type: workout.dupSlot,
        total_duration_min: totalDuration,
        total_sets: totalSets,
        total_reps: totalReps,
        avg_form_score: null,
        rir_avg: 2,
        notes: '',
        synced: false,
      });

      // Update streak
      incrementStreak(getTodayDateString());

      // Flush to Sheets
      await flushPendingToSheets();

      setSessionDone(true);
    },
    [workout, completedSets, sessionId, incrementStreak]
  );

  // ─── Render: not started ───────────────────────────────────────────────────

  if (!workout) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  // ─── Render: done ──────────────────────────────────────────────────────────

  if (sessionDone) {
    const totalReps = completedSets.reduce((s, l) => s + l.actualReps, 0);
    const totalXPEarned = completedSets.reduce(
      (s, l) => s + Math.round(5 * 3 * l.actualReps * (1 + 0.1 * (3 - (l.rir ?? 2)))),
      0
    );
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Workout Done!</h1>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { label: 'Sets', value: completedSets.length },
            { label: 'Reps', value: totalReps },
            { label: 'XP', value: `+${totalXPEarned}` },
          ].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-neutral-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-400">Data synced to your Google Sheet ✓</p>
        <button
          onClick={() => router.push('/')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          Back to Home
        </button>
      </main>
    );
  }

  // ─── Render: pre-start ────────────────────────────────────────────────────

  if (!sessionStarted) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-neutral-400 mb-6 text-sm">← Back</button>
        <h1 className="text-2xl font-bold mb-1">Today's Workout</h1>
        <p className="text-sm text-neutral-400 mb-6 capitalize">{workout.dupSlot.replace('_', ' ')} · ~{workout.estDurationMin} min</p>

        {/* Warmup */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Warm-up</h2>
          {workout.warmup.map((d) => (
            <div key={d.name} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <p className="text-sm font-semibold">{d.name} <span className="text-neutral-500">· {d.durationSec}s</span></p>
              <p className="text-xs text-neutral-500 mt-0.5">{d.description}</p>
            </div>
          ))}
        </div>

        {/* Blocks */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Exercises</h2>
          {workout.blocks.map((block, i) => (
            <div key={block.exercise.id} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-neutral-600 font-bold">{i + 1}</span>
                <p className="text-sm font-semibold">{block.exercise.name}</p>
                {block.isPrimary && (
                  <span className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">Primary</span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                {block.sets} sets × {block.targetReps} reps · RIR {block.rir} · {block.restSec}s rest · {block.tempo}
              </p>
            </div>
          ))}
        </div>

        {/* Finisher */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Finisher</h2>
          <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3">
            <p className="text-sm font-semibold">{workout.finisher.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{workout.finisher.description}</p>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-colors mt-auto"
        >
          Start Workout 🔥
        </button>
      </main>
    );
  }

  // ─── Render: active session ────────────────────────────────────────────────

  const currentBlock = workout.blocks[blockIdx];
  const totalSets = workout.blocks.reduce((s, b) => s + b.sets, 0);
  const doneSets = completedSets.length;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <div>
          <p className="text-xs text-neutral-500">
            Block {blockIdx + 1}/{workout.blocks.length} · Set {setIdx + 1}/{currentBlock.sets}
          </p>
          <h2 className="text-xl font-bold">{currentBlock.exercise.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Elapsed</p>
          <p className="text-lg font-mono font-bold">{formatDuration(elapsedSec)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral-600 mt-1">{doneSets}/{totalSets} sets complete</p>
      </div>

      {/* Exercise info */}
      <div className="px-4 mb-2">
        <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Target</span>
            <span className="font-bold">{currentBlock.targetReps} reps</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-neutral-400">RIR</span>
            <span className="font-bold">{currentBlock.rir}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-neutral-400">Tempo</span>
            <span className="font-mono font-bold">{currentBlock.tempo}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-neutral-400">Rest after</span>
            <span className="font-bold">{currentBlock.restSec}s</span>
          </div>
        </div>
      </div>

      {/* Rest timer or rep counter */}
      <div className="flex-1 flex flex-col justify-center px-4">
        {isResting ? (
          <RestTimer
            seconds={currentBlock.restSec}
            onDone={() => setIsResting(false)}
          />
        ) : (
          <RepCounter
            target={currentBlock.targetReps}
            onComplete={handleSetComplete}
          />
        )}
      </div>

      {/* Completed sets */}
      {completedSets.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs text-neutral-600 uppercase tracking-widest mb-2">Logged</p>
          <div className="flex flex-wrap gap-2">
            {completedSets.slice(-6).map((s, i) => (
              <div key={i} className="bg-neutral-800 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-bold text-green-400">{s.actualReps}</span>
                <span className="text-neutral-500"> reps · RIR {s.rir}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}


export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </main>
    }>
      <WorkoutPageInner />
    </Suspense>
  );
}
