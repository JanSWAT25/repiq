'use client';

import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { WEEKLY_VOLUME_TARGETS } from '@/lib/workout/generator';
import type { MuscleGroup } from '@/lib/workout/exerciseLibrary';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads',
  hamstrings: 'Hamstrings', glutes: 'Glutes', core: 'Core',
};

function VolumeBar({ muscle, current, target }: { muscle: MuscleGroup; current: number; target: number }) {
  const pct = Math.min(1, current / target);
  const color = pct >= 1 ? 'bg-yellow-400' : pct >= 0.6 ? 'bg-green-500' : pct >= 0.3 ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-400 w-20 shrink-0">{MUSCLE_LABELS[muscle]}</span>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-xs text-neutral-500 w-12 text-right tabular-nums">{current}/{target}</span>
    </div>
  );
}

export default function StatsPage() {
  const { badges, totalXP, level } = useUserStore();
  const unlockedIds = badges.map((b) => b.id);

  // Placeholder weekly volume — will be real data in Sprint 4
  const weeklyVolume = Object.fromEntries(
    Object.keys(WEEKLY_VOLUME_TARGETS).map((k) => [k, 0])
  ) as Record<MuscleGroup, number>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-sm text-neutral-500">Level {level} · {totalXP.toLocaleString()} total XP</p>
      </header>

      {/* Weekly volume */}
      <section className="px-4 mb-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
            Weekly Volume
          </p>
          <div className="space-y-3">
            {(Object.keys(WEEKLY_VOLUME_TARGETS) as MuscleGroup[]).map((m) => (
              <VolumeBar
                key={m}
                muscle={m}
                current={weeklyVolume[m]}
                target={WEEKLY_VOLUME_TARGETS[m]}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Behind</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> On track</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Goal met</span>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="px-4 mb-6">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
            Badges · {unlockedIds.length} earned
          </p>
          <BadgeShelf unlockedBadgeIds={unlockedIds} />
        </div>
      </section>

      {/* Bottom nav */}
      <nav className="mt-auto border-t border-[#262626] flex">
        {[
          { href: '/', label: 'Home', emoji: '🏠' },
          { href: '/history', label: 'History', emoji: '📅' },
          { href: '/stats', label: 'Stats', emoji: '📊' },
          { href: '/settings', label: 'Settings', emoji: '⚙️' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center py-3 text-neutral-400 hover:text-white transition-colors">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
