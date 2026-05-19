'use client';

import { useEffect, useState } from 'react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-[#141414] border border-[#262626] rounded-3xl p-8 mx-6 text-center transition-all duration-300 ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated stars */}
        <div className="text-5xl mb-2 animate-bounce">⭐</div>
        <div className="flex justify-center gap-2 mb-4">
          {['✨', '🌟', '✨'].map((s, i) => (
            <span key={i} className="text-2xl" style={{ animationDelay: `${i * 100}ms` }}>
              {s}
            </span>
          ))}
        </div>

        <h2 className="text-3xl font-bold mb-1">Level Up!</h2>
        <p className="text-neutral-400 mb-4">You reached</p>
        <div className="text-6xl font-black text-red-400 mb-6">
          {level}
        </div>

        <div className="bg-neutral-800 rounded-2xl px-4 py-3 mb-6">
          <p className="text-sm text-neutral-300">
            {level >= 25 ? '🏆 Veteran athlete status' :
             level >= 15 ? '💪 Advanced programmer unlocked' :
             level >= 10 ? '⚡ Intermediate skills available' :
             level >= 5  ? '🌱 Beginner tier complete' :
             '🎯 Keep building momentum'}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Let's Go! 🔥
        </button>
      </div>
    </div>
  );
}
