'use client';

import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { getStreakMessage } from '@/lib/gamification/streak';

function StreakCalendar({ streak, lastDate }: { streak: number; lastDate: string | null }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const completedSet = new Set<string>();
  if (lastDate && streak > 0) {
    for (let i = 0; i < streak && i < 30; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() - i);
      completedSet.add(d.toISOString().split('T')[0]);
    }
  }

  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map((day) => (
        <div
          key={day}
          className={`aspect-square rounded-sm ${
            completedSet.has(day) ? 'bg-red-500' : 'bg-neutral-800'
          }`}
          title={day}
        />
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const { streak, lastCompletedDate, longestStreak, totalXP, level } = useUserStore();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-neutral-500">Your consistency over time</p>
      </header>

      {/* Streak card */}
      <section className="px-4 mb-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Current Streak</p>
              <div className="flex items-center gap-2">
                <span className="text-4xl">🔥</span>
                <span className="text-5xl font-black">{streak}</span>
                <span className="text-neutral-400">days</span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">{getStreakMessage(streak)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 mb-1">Best</p>
              <p className="text-2xl font-bold">{longestStreak}</p>
            </div>
          </div>

          {/* 30-day calendar */}
          <p className="text-xs text-neutral-600 mb-2">Last 30 days</p>
          <StreakCalendar streak={streak} lastDate={lastCompletedDate} />
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Total XP', value: totalXP.toLocaleString(), emoji: '⭐' },
          { label: 'Current Level', value: level.toString(), emoji: '🏆' },
          { label: 'Longest Streak', value: `${longestStreak}d`, emoji: '🔥' },
          { label: 'Last Workout', value: lastCompletedDate ?? '—', emoji: '📅' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{s.emoji}</span>
              <span className="text-xs text-neutral-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Empty state */}
      <section className="px-4 mb-6">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-neutral-400">
            {streak === 0
              ? 'Complete your first workout to start tracking history.'
              : 'Detailed session history coming in a future update.'}
          </p>
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
