'use client';

interface FormScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function FormScoreBadge({ score, size = 'md' }: FormScoreBadgeProps) {
  if (score === null) return null;

  const color =
    score >= 85 ? 'text-green-400 border-green-800' :
    score >= 70 ? 'text-yellow-400 border-yellow-800' :
    score >= 50 ? 'text-orange-400 border-orange-800' :
    'text-red-400 border-red-800';

  const label =
    score >= 85 ? 'Excellent' :
    score >= 70 ? 'Good' :
    score >= 50 ? 'Fair' :
    'Needs work';

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-full ${color} ${sizes[size]}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}
