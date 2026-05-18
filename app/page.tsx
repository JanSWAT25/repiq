'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 safe-top">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RepIQ</h1>
          <p className="text-sm text-neutral-400">Daily Calisthenics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold">0</span>
        </div>
      </header>

      {/* XP Bar */}
      <div className="px-4 mb-6">
        <div className="flex justify-between text-xs text-neutral-400 mb-1">
          <span>Level 1</span>
          <span>0 / 100 XP</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: '0%' }} />
        </div>
      </div>

      {/* Today's workout card */}
      <section className="px-4 mb-6">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">
              Today · Moderate
            </span>
            <span className="text-xs text-neutral-400">~35 min</span>
          </div>
          <h2 className="text-xl font-bold mb-1">Push + Legs</h2>
          <p className="text-sm text-neutral-400 mb-4">
            4 exercises · 14 sets · 10–12 reps
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {['Push-up', 'Squat', 'Dip', 'Glute Bridge'].map((ex) => (
              <span
                key={ex}
                className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full"
              >
                {ex}
              </span>
            ))}
          </div>
          <Link
            href="/workout"
            className="block w-full text-center bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Start Workout
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section className="px-4 grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Streak', value: '0', unit: 'days' },
          { label: 'This week', value: '0', unit: 'sets' },
          { label: 'Total XP', value: '0', unit: 'xp' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center"
          >
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-neutral-400">{stat.unit}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Bottom nav */}
      <nav className="mt-auto border-t border-[#262626] flex safe-bottom">
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
