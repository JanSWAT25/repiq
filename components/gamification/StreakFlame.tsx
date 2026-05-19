'use client';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakFlame({ streak, size = 'md' }: StreakFlameProps) {
  const sizeClasses = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' };
  const numClasses = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

  const color =
    streak >= 30 ? 'text-orange-400' :
    streak >= 7  ? 'text-red-400' :
    streak >= 3  ? 'text-yellow-400' :
    'text-neutral-400';

  return (
    <div className="flex items-center gap-1">
      <span className={sizeClasses[size]}>🔥</span>
      <span className={`font-bold tabular-nums ${numClasses[size]} ${color}`}>
        {streak}
      </span>
    </div>
  );
}
