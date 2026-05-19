'use client';

import { getXPProgress } from '@/lib/gamification/xp';

interface XPBarProps {
  totalXP: number;
  showLabel?: boolean;
}

export function XPBar({ totalXP, showLabel = true }: XPBarProps) {
  const { level, nextLevelXP, currentLevelXP, progress } = getXPProgress(totalXP);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
          <span className="font-semibold text-white">Level {level}</span>
          <span>{xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
        </div>
      )}
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
