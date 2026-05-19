'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { generateDailyWorkout, WEEKLY_VOLUME_TARGETS, type Workout } from '@/lib/workout/generator';
import { db } from '@/lib/db/dexie';
import { flushPendingToSheets } from '@/lib/db/sync';
import { requestWakeLock, releaseWakeLock } from '@/lib/wakeLock';
import { generateSessionId, formatDuration, getTodayDateString, getDayOfWeek } from '@/lib/utils';
import { FormScoreBadge } from '@/components/pose/FormScoreBadge';
import type { MuscleGroup } from '@/lib/workout/exerciseLibrary';
import type { SetLog } from '@/store/workoutStore';

// Lazy load PoseCamera to avoid SSR issues
import dynamic from 'next/dynamic';
const PoseCamera = dynamic(
  () => import('@/components/pose/PoseCamera').then((m) => ({ default: m.PoseCamera })),
  { ssr: false }
);

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
          <circle cx="60" cy="60" r="54" fill="none" stroke="#ef4444" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{remaining}</span>
      </div>
      <button onClick={onDone} className="text-sm text-neutral-400 underline">Skip rest</button>
    </div>
  );
}

// ─── Rep Counter ──────────────────────────────────────────────────────────────
function RepCounter({ target, cvReps, onComplete }: {
  target: number;
  cvReps: number;
  onComplete: (reps: number, rir: number) => void;
}) {
  const [reps, setReps] = useState(Math.max(target, cvReps));
  const [rir, setRir] = useState(2);

  // Sync CV reps into manual counter
  useEffect(() => {
    if (cvReps > reps) setReps(cvReps);
  }, [cvReps]);

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <p className="text-neutral-400 text-sm">Target: {target} reps</p>
      <div className="flex items-center gap-6">
        <button onClick={() => setReps((r) => Math.max(0, r - 1))}
          className="w-14 h-14 bg-neutral-800 rounded-full text-2xl font-bold active:bg-neutral-700">−</button>
        <span className="text-6xl font-bold w-24 text-center tabular-nums">{reps}</span>
        <button onClick={() => setReps((r) => r + 1)}
          className="w-14 h-14 bg-neutral-800 rounded-full text-2xl font-bold active:bg-neutral-700">+</button>
      </div>
      <div>
        <p className="text-xs text-neutral-500 text-center mb-2">Reps in Reserve (RIR)</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((r) => (
            <button key={r} onClick={() => setRir(r)}
              className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${rir === r ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => onComplete(reps, rir)}
        className="w-full max-w-xs bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition-colors">
        Log Set ✓
      </button>
    </div>
  );
}

// ─── Main Workout Page ────────────────────────────────────────────────────────
function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { equipment, cvEnabled } = useSettingsStore();
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
  const [cvReps, setCvReps] = useState(0);
  const [currentFormScore, setCurrentFormScore] = useState<number | null>(null);
  const [showCV, setShowCV] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    const emptyVolume = Object.fromEntries(
      Object.keys(WEEKLY_VOLUME_TARGETS).map((k) => [k, 0])
    ) as Record<MuscleGroup, number>;
    setWorkout(generateDailyWorkout({ date, userLevel: level, equipment, rolling7dVolume: emptyVolume, recentExerciseIds: [] }));
  }, [level, equipment, searchParams]);

  const handleStart = useCallback(async () => {
    setSessionStarted(true);
    sessionStart.current = Date.now();
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    await requestWakeLock();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();
  }, []);

  const handleSetComplete = useCallback(async (reps: number, rir: number) => {
    if (!workout) return;
    const block = workout.blocks[blockIdx];
    const durationSec = Math.round((Date.now() - sessionStart.current) / 1000);
    const setLog: SetLog = {
      setNumber: setIdx + 1, targetReps: block.targetReps, actualReps: reps,
      rir, formScore: currentFormScore, cvVerified: showCV && cvReps > 0,
      durationSec, completedAt: new Date().toISOString(),
    };
    setCompletedSets((prev) => [...prev, setLog]);
    await db.pendingSets.add({
      timestamp_iso: new Date().toISOString(), session_id: sessionId,
      exercise_id: block.exercise.id, exercise_name: block.exercise.name,
      muscle_groups: block.exercise.muscleGroups.join(','),
      set_number: setIdx + 1, target_reps: block.targetReps, actual_reps: reps,
      rir, tempo: block.tempo, form_score: currentFormScore,
      cv_verified: showCV && cvReps > 0, duration_sec: durationSec,
    });
    const xp = Math.round(5 * block.exercise.tier * reps * (1 + 0.1 * (3 - rir)));
    addXP(xp);
    setCvReps(0);
    setCurrentFormScore(null);

    if (setIdx < block.sets - 1) {
      setSetIdx((i) => i + 1); setIsResting(true);
    } else if (blockIdx < workout.blocks.length - 1) {
      setBlockIdx((i) => i + 1); setSetIdx(0); setIsResting(true);
    } else {
      await handleWorkoutComplete(reps, [...completedSets, setLog]);
    }
  }, [workout, blockIdx, setIdx, sessionId, addXP, currentFormScore, showCV, cvReps, completedSets]);

  const handleWorkoutComplete = useCallback(async (lastReps: number, allSets: SetLog[]) => {
    if (!workout) return;
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();
    const totalDuration = Math.round((Date.now() - sessionStart.current) / 1000 / 60);
    await db.pendingWorkouts.add({
      timestamp_iso: new Date().toISOString(), session_id: sessionId,
      day_of_week: getDayOfWeek(new Date()), workout_type: workout.dupSlot,
      total_duration_min: totalDuration,
      total_sets: allSets.length,
      total_reps: allSets.reduce((s, l) => s + l.actualReps, 0),
      avg_form_score: allSets.filter(s => s.formScore).length > 0
        ? Math.round(allSets.filter(s => s.formScore).reduce((s, l) => s + (l.formScore ?? 0), 0) / allSets.filter(s => s.formScore).length)
        : null,
      rir_avg: 2, notes: '', synced: false,
    });
    incrementStreak(getTodayDateString());
    await flushPendingToSheets();
    setSessionDone(true);
  }, [workout, sessionId, incrementStreak]);

  if (!workout) return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
    </main>
  );

  if (sessionDone) {
    const allSets = completedSets;
    const totalReps = allSets.reduce((s, l) => s + l.actualReps, 0);
    const cvSets = allSets.filter(s => s.cvVerified).length;
    const avgForm = allSets.filter(s => s.formScore).length > 0
      ? Math.round(allSets.filter(s => s.formScore).reduce((s, l) => s + (l.formScore ?? 0), 0) / allSets.filter(s => s.formScore).length)
      : null;
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Workout Done!</h1>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { label: 'Sets', value: allSets.length },
            { label: 'Reps', value: totalReps },
            { label: 'CV Sets', value: cvSets },
          ].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-neutral-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        {avgForm !== null && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-neutral-500">Avg Form Score</p>
            <FormScoreBadge score={avgForm} size="lg" />
          </div>
        )}
        <p className="text-sm text-neutral-400">Data synced to your Google Sheet ✓</p>
        <button onClick={() => router.push('/')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
          Back to Home
        </button>
      </main>
    );
  }

  if (!sessionStarted) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-neutral-400 mb-6 text-sm">← Back</button>
        <h1 className="text-2xl font-bold mb-1">Today's Workout</h1>
        <p className="text-sm text-neutral-400 mb-6 capitalize">{workout.dupSlot.replace('_', ' ')} · ~{workout.estDurationMin} min</p>
        <div className="mb-4">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Warm-up</h2>
          {workout.warmup.map((d) => (
            <div key={d.name} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <p className="text-sm font-semibold">{d.name} <span className="text-neutral-500">· {d.durationSec}s</span></p>
              <p className="text-xs text-neutral-500 mt-0.5">{d.description}</p>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Exercises</h2>
          {workout.blocks.map((block, i) => (
            <div key={block.exercise.id} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-neutral-600 font-bold">{i + 1}</span>
                <p className="text-sm font-semibold">{block.exercise.name}</p>
                {block.exercise.cvSupported && <span className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">CV</span>}
              </div>
              <p className="text-xs text-neutral-500">{block.sets} × {block.targetReps} reps · RIR {block.rir} · {block.restSec}s rest</p>
            </div>
          ))}
        </div>
        <div className="mb-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Finisher</h2>
          <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3">
            <p className="text-sm font-semibold">{workout.finisher.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{workout.finisher.description}</p>
          </div>
        </div>
        <button onClick={handleStart}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition-colors mt-auto">
          Start Workout 🔥
        </button>
      </main>
    );
  }

  const currentBlock = workout.blocks[blockIdx];
  const totalSets = workout.blocks.reduce((s, b) => s + b.sets, 0);
  const progress = totalSets > 0 ? (completedSets.length / totalSets) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <div>
          <p className="text-xs text-neutral-500">Block {blockIdx + 1}/{workout.blocks.length} · Set {setIdx + 1}/{currentBlock.sets}</p>
          <h2 className="text-xl font-bold">{currentBlock.exercise.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Elapsed</p>
          <p className="text-lg font-mono font-bold">{formatDuration(elapsedSec)}</p>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-2.5 flex justify-between text-sm">
          <span className="text-neutral-400">Target</span>
          <span className="font-bold">{currentBlock.targetReps} reps · RIR {currentBlock.rir} · {currentBlock.tempo}</span>
        </div>
      </div>

      {/* CV Toggle */}
      {cvEnabled && currentBlock.exercise.cvSupported && (
        <div className="px-4 mb-3">
          <button
            onClick={() => setShowCV((v) => !v)}
            className={`w-full py-2 rounded-xl text-sm font-semibold border transition-colors ${showCV ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}
          >
            {showCV ? '📷 CV Active — tap to disable' : '📷 Enable CV Rep Counting'}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center px-4">
        {isResting ? (
          <RestTimer seconds={currentBlock.restSec} onDone={() => setIsResting(false)} />
        ) : (
          <>
            {showCV && cvEnabled && currentBlock.exercise.cvSupported && (
              <div className="mb-4">
                <PoseCamera
                  exerciseId={currentBlock.exercise.id}
                  tempo={currentBlock.tempo}
                  targetReps={currentBlock.targetReps}
                  onRepCounted={(r) => setCvReps(r)}
                  onFormScore={(s) => setCurrentFormScore(s)}
                  onError={(msg) => { setShowCV(false); }}
                />
                {currentFormScore !== null && (
                  <div className="flex justify-center mt-2">
                    <FormScoreBadge score={currentFormScore} />
                  </div>
                )}
              </div>
            )}
            <RepCounter
              target={currentBlock.targetReps}
              cvReps={cvReps}
              onComplete={handleSetComplete}
            />
          </>
        )}
      </div>

      {completedSets.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-xs text-neutral-600 uppercase tracking-widest mb-2">Logged</p>
          <div className="flex flex-wrap gap-2">
            {completedSets.slice(-6).map((s, i) => (
              <div key={i} className="bg-neutral-800 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-bold text-green-400">{s.actualReps}</span>
                <span className="text-neutral-500"> reps</span>
                {s.formScore && <span className="text-blue-400 ml-1">·{s.formScore}</span>}
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
