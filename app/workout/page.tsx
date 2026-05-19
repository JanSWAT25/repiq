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
import { checkNewBadges } from '@/lib/gamification/badges';
import { processStreakUpdate } from '@/lib/gamification/streak';
import { FormScoreBadge } from '@/components/pose/FormScoreBadge';
import { ExerciseDemo } from '@/components/workout/ExerciseDemo';
import type { MuscleGroup } from '@/lib/workout/exerciseLibrary';
import type { SetLog } from '@/store/workoutStore';
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
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <p className="text-neutral-400 text-sm uppercase tracking-widest">Rest</p>
      <div className="relative w-28 h-28">
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
  target: number; cvReps: number;
  onComplete: (reps: number, rir: number) => void;
}) {
  const [reps, setReps] = useState(target);
  const [rir, setRir] = useState(2);
  useEffect(() => { if (cvReps > reps) setReps(cvReps); }, [cvReps]);
  return (
    <div className="flex flex-col items-center gap-4 py-4">
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
        className="w-full max-w-xs bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition-colors">
        Log Set ✓
      </button>
    </div>
  );
}

// ─── Main Workout Page ────────────────────────────────────────────────────────
type Phase = 'preview' | 'demo' | 'active' | 'rest' | 'done';

function WorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { equipment, cvEnabled } = useSettingsStore();
  const { level, streak, lastCompletedDate, freezesAvailable,
          addXP, incrementStreak, consumeFreeze, addBadge, badges, userName } = useUserStore();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [phase, setPhase] = useState<Phase>('preview');
  const [blockIdx, setBlockIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<SetLog[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [cvReps, setCvReps] = useState(0);
  const [currentFormScore, setCurrentFormScore] = useState<number | null>(null);
  const [showCV, setShowCV] = useState(false);
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const sessionXP = useRef(0);
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
    sessionStart.current = Date.now();
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    await requestWakeLock();
    setPhase('demo'); // Show demo first
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();
  }, []);

  const handleSetComplete = useCallback(async (reps: number, rir: number) => {
    if (!workout) return;
    const block = workout.blocks[blockIdx];
    const durationSec = Math.round((Date.now() - sessionStart.current) / 1000);
    const xp = Math.round(5 * block.exercise.tier * reps * (1 + 0.1 * (3 - rir)));
    sessionXP.current += xp;
    addXP(xp);

    const setLog: SetLog = {
      setNumber: setIdx + 1, targetReps: block.targetReps, actualReps: reps,
      rir, formScore: currentFormScore, cvVerified: showCV && cvReps > 0,
      durationSec, completedAt: new Date().toISOString(),
    };
    const newSets = [...completedSets, setLog];
    setCompletedSets(newSets);

    await db.pendingSets.add({
      user_name: userName,
      timestamp_iso: new Date().toISOString(),
      session_id: sessionId,
      exercise_id: block.exercise.id,
      exercise_name: block.exercise.name,
      muscle_groups: block.exercise.muscleGroups.join(','),
      set_number: setIdx + 1,
      target_reps: block.targetReps,
      actual_reps: reps,
      rir, tempo: block.tempo,
      form_score: currentFormScore,
      cv_verified: showCV && cvReps > 0,
      duration_sec: durationSec,
      workout_type: workout.dupSlot,
      day_of_week: getDayOfWeek(new Date()),
      streak_length: streak,
      xp_earned: xp,
    });

    await db.completedSets.add({
      session_id: sessionId, date: getTodayDateString(),
      exercise_id: block.exercise.id,
      muscle_groups: block.exercise.muscleGroups.join(','),
      actual_reps: reps, sets: 1,
    });

    setCvReps(0);
    setCurrentFormScore(null);

    if (setIdx < block.sets - 1) {
      setSetIdx((i) => i + 1);
      setPhase('rest');
    } else if (blockIdx < workout.blocks.length - 1) {
      setBlockIdx((i) => i + 1);
      setSetIdx(0);
      setPhase('rest');
    } else {
      await handleWorkoutComplete(newSets);
    }
  }, [workout, blockIdx, setIdx, sessionId, addXP, currentFormScore, showCV, cvReps, completedSets, userName, streak]);

  const handleWorkoutComplete = useCallback(async (allSets: SetLog[]) => {
    if (!workout) return;
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();

    const today = getTodayDateString();
    const streakResult = processStreakUpdate({ currentStreak: streak, lastCompletedDate, freezesAvailable, todayDate: today });
    if (streakResult.isNewDay) { incrementStreak(today); if (streakResult.freezeConsumed) consumeFreeze(); }

    const allCompletedSets = await db.completedSets.toArray();
    const uniqueExercises = Array.from(new Set(allCompletedSets.map(s => s.exercise_id)));
    const earnedBadges = checkNewBadges({
      totalReps: allCompletedSets.reduce((s, c) => s + c.actual_reps, 0),
      totalSets: allCompletedSets.length,
      streak: streakResult.newStreak, level,
      uniqueExerciseIds: uniqueExercises,
      completedExerciseIds: workout.blocks.map(b => b.exercise.id),
      completedAt: new Date(),
      existingBadgeIds: badges.map(b => b.id),
    });
    earnedBadges.forEach(badge => {
      addBadge({ id: badge.id, name: badge.name, category: badge.category, unlockedAt: new Date().toISOString(), xpAwarded: badge.xpAwarded });
      addXP(badge.xpAwarded);
    });
    setNewBadges(earnedBadges);
    await flushPendingToSheets();
    setPhase('done');
  }, [workout, streak, lastCompletedDate, freezesAvailable, incrementStreak, consumeFreeze, level, badges, addBadge, addXP]);

  if (!workout) return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
    </main>
  );

  const currentBlock = workout.blocks[blockIdx];
  const totalSets = workout.blocks.reduce((s, b) => s + b.sets, 0);
  const progress = totalSets > 0 ? (completedSets.length / totalSets) * 100 : 0;

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const totalReps = completedSets.reduce((s, l) => s + l.actualReps, 0);
    const formScores = completedSets.filter(s => s.formScore !== null);
    const avgForm = formScores.length > 0
      ? Math.round(formScores.reduce((s, l) => s + (l.formScore ?? 0), 0) / formScores.length) : null;
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Workout Done!</h1>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[{ label: 'Sets', value: completedSets.length }, { label: 'Reps', value: totalReps }, { label: 'XP', value: `+${sessionXP.current}` }].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-neutral-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        {avgForm !== null && <FormScoreBadge score={avgForm} size="lg" />}
        {newBadges.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-2xl p-4 w-full max-w-sm">
            <p className="text-xs font-bold text-yellow-400 mb-2">🏆 New Badges!</p>
            {newBadges.map(b => <p key={b.id} className="text-sm">{b.emoji} {b.name}</p>)}
          </div>
        )}
        <p className="text-sm text-neutral-400">Synced to Google Sheet ✓</p>
        <button onClick={() => router.push('/')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl">
          Back to Home
        </button>
      </main>
    );
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-neutral-400 mb-4 text-sm">← Back</button>
        <h1 className="text-2xl font-bold mb-1">Today's Workout</h1>
        <p className="text-sm text-neutral-400 mb-4 capitalize">{workout.dupSlot.replace('_', ' ')} · ~{workout.estDurationMin} min</p>

        <div className="mb-4">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Warm-up ({workout.warmup.reduce((s, d) => s + d.durationSec, 0)}s)</h2>
          {workout.warmup.map((d) => (
            <div key={d.name} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <p className="text-sm font-semibold">{d.name} <span className="text-neutral-500">· {d.durationSec}s</span></p>
              <p className="text-xs text-neutral-500 mt-0.5">{d.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Exercises</h2>
          {workout.blocks.map((block, i) => (
            <div key={block.exercise.id} className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-neutral-600 font-bold">{i + 1}</span>
                <p className="text-sm font-semibold">{block.exercise.name}</p>
                {block.exercise.cvSupported && <span className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">CV</span>}
              </div>
              <p className="text-xs text-neutral-500">
                {block.sets} × {block.targetReps} reps · RIR {block.rir} · {block.restSec}s rest
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {block.exercise.muscleGroups.map(m => (
                  <span key={m} className="text-xs text-red-400/70 bg-red-900/20 px-1.5 py-0.5 rounded capitalize">{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleStart}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition-colors mt-auto">
          Start Workout 🔥
        </button>
      </main>
    );
  }

  // ── Demo screen (shown before each new exercise) ───────────────────────────
  if (phase === 'demo') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-10 pb-3">
          <div>
            <p className="text-xs text-neutral-500">
              Exercise {blockIdx + 1}/{workout.blocks.length} · Set {setIdx + 1}/{currentBlock.sets}
            </p>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1 w-48">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Elapsed</p>
            <p className="text-sm font-mono font-bold">{formatDuration(elapsedSec)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <ExerciseDemo
            exercise={currentBlock.exercise}
            targetReps={currentBlock.targetReps}
            rir={currentBlock.rir}
            tempo={currentBlock.tempo}
            restSec={currentBlock.restSec}
            onStartSet={() => setPhase('active')}
          />
        </div>
      </main>
    );
  }

  // ── Rest screen ────────────────────────────────────────────────────────────
  if (phase === 'rest') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center max-w-lg mx-auto px-4">
        <div className="text-center mb-4">
          <p className="text-xs text-neutral-500">Block {blockIdx + 1}/{workout.blocks.length} · Set {setIdx + 1}/{currentBlock.sets}</p>
          <h2 className="text-xl font-bold">Rest</h2>
        </div>
        <RestTimer
          seconds={currentBlock.restSec}
          onDone={() => setPhase('demo')}
        />
        <button onClick={() => setPhase('demo')} className="text-sm text-neutral-400 underline mt-2">
          Skip to next set
        </button>
        {/* Show completed sets */}
        {completedSets.length > 0 && (
          <div className="mt-6 w-full">
            <p className="text-xs text-neutral-600 uppercase tracking-widest mb-2 text-center">Logged</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {completedSets.slice(-6).map((s, i) => (
                <div key={i} className="bg-neutral-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-bold text-green-400">{s.actualReps}</span>
                  <span className="text-neutral-500"> reps</span>
                  {s.formScore && <span className="text-blue-400 ml-1">· {s.formScore}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── Active set screen ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-10 pb-2">
        <div>
          <p className="text-xs text-neutral-500">Block {blockIdx + 1}/{workout.blocks.length} · Set {setIdx + 1}/{currentBlock.sets}</p>
          <h2 className="text-xl font-bold">{currentBlock.exercise.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('demo')} className="text-xs text-neutral-500 underline">
            Demo
          </button>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Elapsed</p>
            <p className="text-sm font-mono font-bold">{formatDuration(elapsedSec)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-2.5 flex justify-between text-sm">
          <span className="text-neutral-400">Target</span>
          <span className="font-bold">{currentBlock.targetReps} reps · RIR {currentBlock.rir} · {currentBlock.tempo}</span>
        </div>
      </div>

      {cvEnabled && currentBlock.exercise.cvSupported && (
        <div className="px-4 mb-3">
          <button onClick={() => setShowCV((v) => !v)}
            className={`w-full py-2 rounded-xl text-sm font-semibold border transition-colors ${showCV ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
            {showCV ? '📷 CV Active — tap to disable' : '📷 Enable CV Rep Counting'}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center px-4">
        {showCV && cvEnabled && currentBlock.exercise.cvSupported && (
          <div className="mb-4">
            <PoseCamera
              exerciseId={currentBlock.exercise.id}
              tempo={currentBlock.tempo}
              targetReps={currentBlock.targetReps}
              onRepCounted={(r) => setCvReps(r)}
              onFormScore={(s) => setCurrentFormScore(s)}
              onError={() => setShowCV(false)}
            />
            {currentFormScore !== null && (
              <div className="flex justify-center mt-2">
                <FormScoreBadge score={currentFormScore} />
              </div>
            )}
          </div>
        )}
        <RepCounter target={currentBlock.targetReps} cvReps={cvReps} onComplete={handleSetComplete} />
      </div>

      {completedSets.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {completedSets.slice(-6).map((s, i) => (
              <div key={i} className="bg-neutral-800 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-bold text-green-400">{s.actualReps}</span>
                <span className="text-neutral-500"> reps</span>
                {s.formScore && <span className="text-blue-400 ml-1">· {s.formScore}</span>}
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
