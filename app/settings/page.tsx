'use client';

import Link from 'next/link';
import { useSettingsStore, type Equipment, type Difficulty } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; emoji: string }[] = [
  { id: 'floor', label: 'Floor only', emoji: '🏠' },
  { id: 'pullup_bar', label: 'Pull-up bar', emoji: '🔩' },
  { id: 'dip_bars', label: 'Dip bars', emoji: '🤸' },
  { id: 'rings', label: 'Gymnastic rings', emoji: '⭕' },
  { id: 'wall', label: 'Wall', emoji: '🧱' },
  { id: 'vest', label: 'Weight vest', emoji: '🦺' },
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; description: string }[] = [
  { id: 'easy', label: 'Easy', description: 'Lower tiers, more reps' },
  { id: 'normal', label: 'Normal', description: 'Balanced progression' },
  { id: 'hard', label: 'Hard', description: 'Higher tiers, lower reps' },
];

export default function SettingsPage() {
  const {
    equipment, toggleEquipment,
    difficulty, setDifficulty,
    habitStack, setHabitStack,
    cvEnabled, setCvEnabled,
  } = useSettingsStore();

  const { userName, setUserName, freezesAvailable } = useUserStore();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      {/* Profile */}
      <section className="px-4 mb-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Profile</p>
          <label className="block text-sm text-neutral-400 mb-1">Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
            placeholder="Your name"
          />
          <p className="text-xs text-neutral-600 mt-2">
            🧊 Streak freezes available: <span className="text-white font-bold">{freezesAvailable}</span>
          </p>
        </div>
      </section>

      {/* Equipment */}
      <section className="px-4 mb-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Equipment</p>
          <div className="space-y-2">
            {EQUIPMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleEquipment(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  equipment.includes(opt.id)
                    ? 'bg-red-900/20 border-red-800/60 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="ml-auto">
                  {equipment.includes(opt.id) ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty */}
      <section className="px-4 mb-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Difficulty</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDifficulty(opt.id)}
                className={`px-3 py-3 rounded-xl border text-center transition-colors ${
                  difficulty === opt.id
                    ? 'bg-red-900/20 border-red-800/60 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <p className="text-sm font-bold">{opt.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Habit stack */}
      <section className="px-4 mb-4">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Habit Stack</p>
          <p className="text-xs text-neutral-500 mb-3">Tie your workout to an existing habit for better consistency.</p>
          <label className="block text-sm text-neutral-400 mb-1">I will work out after I...</label>
          <input
            type="text"
            value={habitStack}
            onChange={(e) => setHabitStack(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
            placeholder="e.g. brush my teeth, make coffee..."
          />
        </div>
      </section>

      {/* CV Toggle */}
      <section className="px-4 mb-6">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">CV Form Tracking</p>
              <p className="text-xs text-neutral-500">Use camera for rep counting (Beta)</p>
            </div>
            <button
              onClick={() => setCvEnabled(!cvEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${cvEnabled ? 'bg-red-500' : 'bg-neutral-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cvEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
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
