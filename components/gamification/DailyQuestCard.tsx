'use client';

import { getDailyQuest } from '@/lib/gamification/quests';

interface DailyQuestCardProps {
  completed?: boolean;
}

export function DailyQuestCard({ completed = false }: DailyQuestCardProps) {
  const quest = getDailyQuest(new Date());

  return (
    <div className={`border rounded-xl px-4 py-3 ${
      completed
        ? 'bg-green-900/20 border-green-800/40'
        : 'bg-[#141414] border-[#262626]'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
          Daily Quest
        </p>
        <span className="text-xs font-bold text-yellow-400">+{quest.xpReward} XP</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl">{quest.emoji}</span>
        <div>
          <p className={`text-sm font-semibold ${completed ? 'line-through text-neutral-500' : ''}`}>
            {quest.title}
          </p>
          <p className="text-xs text-neutral-500">{quest.description}</p>
        </div>
        {completed && <span className="ml-auto text-green-400 text-lg">✓</span>}
      </div>
    </div>
  );
}
