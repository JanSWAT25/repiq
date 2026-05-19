'use client';

import { useState } from 'react';
import { getExerciseGifUrl, getCameraPosition } from '@/lib/workout/exerciseMedia';
import type { Exercise } from '@/lib/workout/exerciseLibrary';

interface ExerciseDemoProps {
  exercise: Exercise;
  targetReps: number;
  rir: number;
  tempo: string;
  restSec: number;
  onStartSet: () => void;
}

export function ExerciseDemo({
  exercise, targetReps, rir, tempo, restSec, onStartSet
}: ExerciseDemoProps) {
  const [gifError, setGifError] = useState(false);
  const gifUrl = getExerciseGifUrl(exercise.id);
  const cameraPos = getCameraPosition(exercise.id);

  return (
    <div className="flex flex-col gap-4">
      {/* Exercise GIF */}
      <div className="relative bg-neutral-900 rounded-2xl overflow-hidden aspect-video">
        {gifUrl && !gifError ? (
          <>
            <img
              src={gifUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
              onError={() => setGifError(true)}
            />
            <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1">
              <p className="text-xs text-neutral-300">Demo</p>
            </div>
          </>
        ) : (
          // Fallback animated SVG
          <ExerciseSVGFallback exercise={exercise} />
        )}
      </div>

      {/* Exercise details */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
        <h3 className="text-lg font-bold mb-3">{exercise.name}</h3>
        <p className="text-sm text-neutral-400 mb-3">{exercise.description}</p>

        {/* Set prescription */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Reps', value: targetReps },
            { label: 'RIR', value: rir },
            { label: 'Tempo', value: tempo },
            { label: 'Rest', value: `${restSec}s` },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-800 rounded-lg p-2 text-center">
              <div className="text-sm font-bold">{item.value}</div>
              <div className="text-xs text-neutral-500">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Muscle groups */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {exercise.muscleGroups.map((m) => (
            <span key={m} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded-full capitalize">
              {m}
            </span>
          ))}
        </div>

        {/* Camera position guidance */}
        {exercise.cvSupported && (
          <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs font-bold text-blue-400 mb-0.5">📷 Camera Position</p>
            <p className="text-xs text-blue-200">{cameraPos} · 6–10 ft away</p>
          </div>
        )}

        {/* Form cues */}
        <FormCues exerciseId={exercise.id} />
      </div>

      <button
        onClick={onStartSet}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        Start Set 🔥
      </button>
    </div>
  );
}

// Form cues per exercise
function FormCues({ exerciseId }: { exerciseId: string }) {
  const cues: Record<string, string[]> = {
    push_standard: ['Keep body in a straight line', 'Chest touches (or near) the floor', 'Elbows at 45° from torso', 'Full lockout at top'],
    push_incline: ['Same form as standard push-up', 'Hands elevated reduces difficulty', 'Great for learning the movement'],
    push_diamond: ['Hands form a diamond shape', 'Heavy tricep emphasis', 'Keep elbows close to body'],
    pull_strict: ['Dead hang start', 'Pull chin over bar', 'Full arm extension at bottom', 'No kipping'],
    squat_bodyweight: ['Feet shoulder-width apart', 'Knees track over toes', 'Hip crease below parallel', 'Chest up throughout'],
    squat_bulgarian: ['Rear foot elevated on bench', 'Front foot far enough forward', 'Keep torso upright', 'Drive through front heel'],
    hinge_glute_bridge: ['Feet flat on floor', 'Drive hips to full extension', 'Squeeze glutes at top', '2-second hold at top'],
    core_plank: ['Straight line from head to heels', 'Hips level — not sagging or piking', 'Breathe steadily', 'Engage core and glutes'],
    dip_parallel: ['Full depression at bottom', 'Chest slightly forward', 'Full lockout at top', 'Control the descent'],
    cond_burpee: ['Squat down, jump feet back', 'Perform a push-up', 'Jump feet forward', 'Explosive jump at top'],
  };

  const exerciseCues = cues[exerciseId];
  if (!exerciseCues) return null;

  return (
    <div>
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Form Cues</p>
      <ul className="space-y-1">
        {exerciseCues.map((cue, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>{cue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Animated SVG fallback for exercises without GIFs
function ExerciseSVGFallback({ exercise }: { exercise: Exercise }) {
  const category = exercise.category;

  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
      <svg viewBox="0 0 200 150" className="w-full h-full max-w-xs">
        <style>{`
          @keyframes pushup {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(20px); }
          }
          @keyframes squat {
            0%, 100% { transform: scaleY(1) translateY(0); }
            50% { transform: scaleY(0.7) translateY(15px); }
          }
          @keyframes pullup {
            0%, 100% { transform: translateY(20px); }
            50% { transform: translateY(0); }
          }
          @keyframes plank {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .figure { animation-duration: 2s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
          .pushup-anim { animation-name: pushup; }
          .squat-anim { animation-name: squat; }
          .pullup-anim { animation-name: pullup; }
          .plank-anim { animation-name: plank; }
        `}</style>

        {/* Background */}
        <rect width="200" height="150" fill="#0a0a0a" />

        {/* Floor line */}
        <line x1="20" y1="120" x2="180" y2="120" stroke="#262626" strokeWidth="2" />

        {/* Exercise name */}
        <text x="100" y="140" textAnchor="middle" fill="#666" fontSize="9" fontFamily="sans-serif">
          {exercise.name}
        </text>

        {/* Animated stick figure based on category */}
        <g className={`figure ${
          category.includes('push') ? 'pushup-anim' :
          category.includes('squat') ? 'squat-anim' :
          category.includes('pull') ? 'pullup-anim' :
          'plank-anim'
        }`}>
          {category.includes('push') || category === 'dip' ? (
            // Push-up figure
            <g transform="translate(70, 60)">
              <circle cx="30" cy="15" r="10" fill="none" stroke="#ef4444" strokeWidth="2" /> {/* head */}
              <line x1="30" y1="25" x2="30" y2="50" stroke="#ef4444" strokeWidth="2" /> {/* body */}
              <line x1="30" y1="35" x2="10" y2="50" stroke="#ef4444" strokeWidth="2" /> {/* L arm */}
              <line x1="30" y1="35" x2="50" y2="50" stroke="#ef4444" strokeWidth="2" /> {/* R arm */}
              <line x1="10" y1="50" x2="10" y2="55" stroke="#ef4444" strokeWidth="2" /> {/* L hand */}
              <line x1="50" y1="50" x2="50" y2="55" stroke="#ef4444" strokeWidth="2" /> {/* R hand */}
              <line x1="30" y1="50" x2="15" y2="60" stroke="#ef4444" strokeWidth="2" /> {/* L leg */}
              <line x1="30" y1="50" x2="45" y2="60" stroke="#ef4444" strokeWidth="2" /> {/* R leg */}
            </g>
          ) : category.includes('squat') || category.includes('hinge') ? (
            // Squat figure
            <g transform="translate(80, 30)">
              <circle cx="20" cy="10" r="10" fill="none" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="20" x2="20" y2="50" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="30" x2="5" y2="40" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="30" x2="35" y2="40" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="50" x2="10" y2="75" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="50" x2="30" y2="75" stroke="#ef4444" strokeWidth="2" />
              <line x1="10" y1="75" x2="5" y2="85" stroke="#ef4444" strokeWidth="2" />
              <line x1="30" y1="75" x2="35" y2="85" stroke="#ef4444" strokeWidth="2" />
            </g>
          ) : category.includes('pull') ? (
            // Pull-up figure
            <g transform="translate(80, 10)">
              <line x1="0" y1="5" x2="40" y2="5" stroke="#666" strokeWidth="3" /> {/* bar */}
              <circle cx="20" cy="20" r="10" fill="none" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="30" x2="20" y2="60" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="38" x2="5" y2="25" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="38" x2="35" y2="25" stroke="#ef4444" strokeWidth="2" />
              <line x1="5" y1="25" x2="5" y2="10" stroke="#ef4444" strokeWidth="2" />
              <line x1="35" y1="25" x2="35" y2="10" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="60" x2="12" y2="80" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="60" x2="28" y2="80" stroke="#ef4444" strokeWidth="2" />
            </g>
          ) : (
            // Plank/core figure
            <g transform="translate(30, 70)">
              <circle cx="130" cy="20" r="10" fill="none" stroke="#ef4444" strokeWidth="2" />
              <line x1="120" y1="25" x2="20" y2="35" stroke="#ef4444" strokeWidth="2" />
              <line x1="120" y1="25" x2="105" y2="45" stroke="#ef4444" strokeWidth="2" />
              <line x1="20" y1="35" x2="20" y2="45" stroke="#ef4444" strokeWidth="2" />
              <line x1="105" y1="45" x2="80" y2="35" stroke="#ef4444" strokeWidth="2" />
              <line x1="80" y1="35" x2="50" y2="35" stroke="#ef4444" strokeWidth="2" />
              <line x1="50" y1="35" x2="50" y2="45" stroke="#ef4444" strokeWidth="2" />
            </g>
          )}
        </g>

        {/* Red accent dots */}
        <circle cx="20" cy="10" r="3" fill="#ef4444" opacity="0.5" />
        <circle cx="180" cy="10" r="3" fill="#ef4444" opacity="0.5" />
      </svg>
    </div>
  );
}
