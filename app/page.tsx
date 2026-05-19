'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useSettingsStore } from '@/store/settingsStore';
import { generateDailyWorkout, type Workout, WEEKLY_VOLUME_TARGETS } from '@/lib/workout/generator';
import type { MuscleGroup } from '@/lib/workout/exerciseLibrary';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads',
  hamstrings: 'Hamstrings', glutes: 'Glutes', core: 'Core',
};

const DUP_COLORS: Record<string, string> = {
  heavy: 'text-orange-400',
  moderate: 'text-blue-400',
  high_rep: 'text-green-400',
  skill: 'text-purple-400',
  conditioning: 'text-yellow-400',
  recovery: 'text-teal-400',
};

const DUP_LABELS: Record<string, string> = {
  heavy: 'Heavy Day',
  moderate: 'Hypertrophy',
  high_rep: 'High Rep',
  skill: 'Skill Day',
  conditioning: 'Conditioning',
  recovery: 'Recovery',
};

export default function HomePage() {
  const { level, totalXP, streak, getXPForNextLevel } = useUserStore();
  const { equipment } = useSettingsStore();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [today, setToday] = useState('');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const now = new Date();
    setToday(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    const emptyVolume = Object.fromEntries(
      Object.keys(WEEKLY_VOLUME_TARGETS).map((k) => [k, 0])
    ) as Record<MuscleGroup, number>;

    const w = generateDailyWorkout({
      date: now,
      userLevel: level,
      equipment,
      rolling7dVolume: emptyVolume,
      recentExerciseIds: [],
    });
    setWorkout(w);
  }, [level, equipment]);

  const xpForNext = getXPForNextLevel();
  const xpProgress = xpForNext > 0 ? (totalXP / xpForNext) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RepIQ</h1>
          <p className="text-xs text-neutral-500">{today}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-full">
          <span className="text-xl">🔥</span>
          <span className="text-lg font-bold">{mounted ? streak : 0}</span>
        </div>
      </header>

      {/* XP Bar */}
      <div className="px-4 mb-5">
        <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
        <span className="font-semibold">Level {mounted ? level : 1}</span>
        <span>{mounted ? `${totalXP.toLocaleString()} / ${xpForNext.toLocaleString()} XP` : '...'}</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
            style={{ width: mounted ? `${Math.min(100, xpProgress)}%` : '0%' }}
          />
        </div>
      </div>

      {/* Today's workout card */}
      {workout ? (
        <section className="px-4 mb-5">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${DUP_COLORS[workout.dupSlot] ?? 'text-red-400'}`}>
                Today · {DUP_LABELS[workout.dupSlot]}
              </span>
              <span className="text-xs text-neutral-500">~{workout.estDurationMin} min</span>
            </div>

            {/* Workout name */}
            <h2 className="text-xl font-bold mb-0.5">
              {workout.blocks.slice(0, 2).map((b) => b.exercise.name).join(' + ')}
            </h2>
            <p className="text-sm text-neutral-400 mb-3">
              {workout.blocks.length} exercises ·{' '}
              {workout.blocks.reduce((s, b) => s + b.sets, 0)} sets ·{' '}
              {workout.blocks[0]?.targetReps}–{workout.blocks[workout.blocks.length - 1]?.targetReps} reps
            </p>

            {/* Exercise chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {workout.blocks.map((block) => (
                <span
                  key={block.exercise.id}
                  className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full"
                >
                  {block.exercise.name}
                </span>
              ))}
            </div>

            {/* Muscle emphasis */}
            <div className="flex flex-wrap gap-1 mb-4">
              {workout.muscleEmphasis.slice(0, 5).map((m) => (
                <span key={m} className="text-xs text-red-400 border border-red-900 px-2 py-0.5 rounded-full">
                  {MUSCLE_LABELS[m]}
                </span>
              ))}
            </div>

            {/* Novelty challenge */}
            {workout.noveltyChallenge && (
              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-yellow-400 mb-0.5">⚡ Daily Challenge</p>
                <p className="text-xs text-yellow-200">{workout.noveltyChallenge}</p>
              </div>
            )}

            <Link
              href={`/workout?date=${workout.date}`}
              className="block w-full text-center bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
            >
              Start Workout
            </Link>
          </div>
        </section>
      ) : (
        <section className="px-4 mb-5">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 animate-pulse">
            <div className="h-4 bg-neutral-800 rounded w-1/3 mb-3" />
            <div className="h-6 bg-neutral-800 rounded w-2/3 mb-2" />
            <div className="h-4 bg-neutral-800 rounded w-1/2 mb-4" />
            <div className="h-12 bg-neutral-800 rounded-xl" />
          </div>
        </section>
      )}

      {/* Stats row */}
      <section className="px-4 grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Streak', value: streak.toString(), unit: 'days', emoji: '🔥' },
          { label: 'This week', value: '0', unit: 'sets', emoji: '💪' },
          { label: 'Total XP', value: totalXP.toLocaleString(), unit: 'xp', emoji: '⭐' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
            <div className="text-lg mb-0.5">{stat.emoji}</div>
            <div className="text-lg font-bold leading-none">{stat.value}</div>
            <div className="text-xs text-neutral-400">{stat.unit}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Workout preview blocks */}
      {workout && (
        <section className="px-4 mb-6">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Today's Plan</h3>
          <div className="space-y-2">
            {workout.blocks.map((block, i) => (
              <div key={block.exercise.id} className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-neutral-600 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{block.exercise.name}</p>
                  <p className="text-xs text-neutral-500">
                    {block.sets} × {block.targetReps} reps · RIR {block.rir} · {block.restSec}s rest
                  </p>
                </div>
                <span className="text-xs text-neutral-600 font-mono">{block.tempo}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom nav */}
      <nav className="mt-auto border-t border-[#262626] flex">
        {[
          { href: '/', label: 'Home', emoji: '🏠' },
          { href: '/history', label: 'History', emoji: '📅' },
          { href: '/stats', label: 'Stats', emoji: '📊' },
          { href: '/settings', label: 'Settings', emoji: '⚙️' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center py-3 text-neutral-400 hover:text-white transition-colors"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
