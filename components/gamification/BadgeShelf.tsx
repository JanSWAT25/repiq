'use client';

import { BADGE_DEFINITIONS, type BadgeCategory } from '@/lib/gamification/badges';

interface BadgeShelfProps {
  unlockedBadgeIds: string[];
  filter?: BadgeCategory;
}

export function BadgeShelf({ unlockedBadgeIds, filter }: BadgeShelfProps) {
  const badges = filter
    ? BADGE_DEFINITIONS.filter((b) => b.category === filter)
    : BADGE_DEFINITIONS;

  const unlocked = badges.filter((b) => unlockedBadgeIds.includes(b.id));
  const locked = badges.filter((b) => !unlockedBadgeIds.includes(b.id) && !b.secret);

  return (
    <div className="space-y-4">
      {unlocked.length > 0 && (
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
            Earned ({unlocked.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {unlocked.map((badge) => (
              <div
                key={badge.id}
                className="bg-[#141414] border border-yellow-800/40 rounded-xl p-2 text-center"
                title={badge.description}
              >
                <div className="text-2xl mb-1">{badge.emoji}</div>
                <p className="text-xs text-yellow-300 font-semibold leading-tight line-clamp-2">
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
            Locked ({locked.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="bg-[#0f0f0f] border border-neutral-800 rounded-xl p-2 text-center opacity-40"
                title={badge.description}
              >
                <div className="text-2xl mb-1 grayscale">{badge.emoji}</div>
                <p className="text-xs text-neutral-600 leading-tight line-clamp-2">
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
