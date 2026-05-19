'use client';

import { useState, useEffect } from 'react';
import { getCameraPosition } from '@/lib/workout/exerciseMedia';
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
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [svgError, setSvgError] = useState(false);
  const cameraPos = getCameraPosition(exercise.id);
  const svgUrl = `/api/exercise-demo?id=${exercise.id}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Exercise Demo - AI Generated SVG */}
      <div className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden aspect-video">
        {!svgError ? (
          <>
            {!svgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
                <p className="text-xs text-neutral-600">Generating demo...</p>
              </div>
            )}
            <img
              src={svgUrl}
              alt={exercise.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${svgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setSvgLoaded(true)}
              onError={() => { setSvgError(true); setSvgLoaded(true); }}
            />
          </>
        ) : (
          <FallbackAnimation exercise={exercise} />
        )}
        <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1">
          <p className="text-xs text-red-400 font-semibold">AI Demo</p>
        </div>
      </div>

      {/* Exercise details */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
        <h3 className="text-lg font-bold mb-2">{exercise.name}</h3>
        <p className="text-sm text-neutral-400 mb-3">{exercise.description}</p>

        {/* Set prescription grid */}
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

        {/* Camera position */}
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

// Fallback animated SVG if API fails
function FallbackAnimation({ exercise }: { exercise: Exercise }) {
  const cat = exercise.category;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 300 200" className="w-full h-full">
        <style>{`
          @keyframes pushup { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
          @keyframes squat { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.65) translateY(20px)} }
          @keyframes pullup { 0%,100%{transform:translateY(20px)} 50%{transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
          .anim-push { animation: pushup 2s ease-in-out infinite; }
          .anim-squat { animation: squat 2s ease-in-out infinite; transform-origin: bottom; }
          .anim-pull { animation: pullup 2s ease-in-out infinite; }
          .anim-pulse { animation: pulse 2s ease-in-out infinite; }
        `}</style>
        <rect width="300" height="200" fill="#0a0a0a"/>
        <line x1="20" y1="175" x2="280" y2="175" stroke="#1a1a1a" stroke-width="2"/>
        <g className={
          cat.includes('push') || cat === 'dip' ? 'anim-push' :
          cat.includes('squat') || cat.includes('hinge') ? 'anim-squat' :
          cat.includes('pull') ? 'anim-pull' : 'anim-pulse'
        } transform="translate(110, 40)">
          <circle cx="40" cy="15" r="14" fill="none" stroke="#ef4444" strokeWidth="2.5"/>
          <line x1="40" y1="29" x2="40" y2="75" stroke="#ef4444" strokeWidth="2.5"/>
          <line x1="40" y1="45" x2="15" y2="65" stroke="#ef4444" strokeWidth="2.5"/>
          <line x1="40" y1="45" x2="65" y2="65" stroke="#ef4444" strokeWidth="2.5"/>
          <line x1="40" y1="75" x2="25" y2="110" stroke="#ef4444" strokeWidth="2.5"/>
          <line x1="40" y1="75" x2="55" y2="110" stroke="#ef4444" strokeWidth="2.5"/>
          <circle cx="25" cy="113" r="4" fill="#ef4444"/>
          <circle cx="55" cy="113" r="4" fill="#ef4444"/>
        </g>
        <text x="150" y="193" textAnchor="middle" fill="#333" fontSize="9" fontFamily="sans-serif">
          {exercise.name}
        </text>
      </svg>
    </div>
  );
}

// Form cues
function FormCues({ exerciseId }: { exerciseId: string }) {
  const cues: Record<string, string[]> = {
    push_standard: ['Keep body in a straight line', 'Chest touches the floor', 'Elbows at 45° from torso', 'Full lockout at top'],
    push_incline: ['Same form as standard push-up', 'Hands elevated reduces difficulty', 'Great for learning the movement'],
    push_diamond: ['Hands form a diamond shape', 'Heavy tricep emphasis', 'Keep elbows close to body'],
    push_decline: ['Feet elevated, upper chest focus', 'Keep core tight', 'Control the descent'],
    push_archer: ['One arm takes most load', 'Other arm extends laterally', 'Alternate sides each rep'],
    pull_strict: ['Dead hang start position', 'Pull chin over the bar', 'Full arm extension at bottom', 'No kipping or swinging'],
    pull_chin: ['Supinated (palms facing you) grip', 'Greater bicep involvement', 'Full range of motion'],
    row_australian: ['Body horizontal under bar', 'Pull chest to bar', 'Squeeze shoulder blades'],
    squat_bodyweight: ['Feet shoulder-width apart', 'Knees track over toes', 'Hip crease below parallel', 'Chest up throughout'],
    squat_bulgarian: ['Rear foot elevated on bench', 'Front foot far forward enough', 'Keep torso upright', 'Drive through front heel'],
    hinge_glute_bridge: ['Feet flat on floor', 'Drive hips to full extension', 'Squeeze glutes at top', '2-second hold'],
    hinge_hip_thrust: ['Shoulders on bench edge', 'Drive hips up explosively', 'Full hip extension at top'],
    core_plank: ['Straight line head to heels', 'Hips level — no sagging', 'Breathe steadily', 'Engage core and glutes'],
    dip_parallel: ['Full depth — shoulders below elbows', 'Chest forward for chest focus', 'Full lockout at top'],
    cond_burpee: ['Squat down, jump feet back', 'Perform push-up', 'Jump feet forward', 'Explosive jump with arms up'],
    cond_mountain_climber: ['Plank position throughout', 'Drive knees to chest alternately', 'Keep hips level and stable'],
    cond_lunge: ['Step back into lunge', 'Front knee at 90°', 'Keep torso upright', 'Drive through front heel to return'],
  };

  const exerciseCues = cues[exerciseId];
  if (!exerciseCues) return null;

  return (
    <div>
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Form Cues</p>
      <ul className="space-y-1.5">
        {exerciseCues.map((cue, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
            <span className="text-green-400 mt-0.5 shrink-0">✓</span>
            <span>{cue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
