'use client';

import { useState, useEffect, useRef } from 'react';
import { getExerciseSVG } from '@/lib/workout/exerciseSVGs';
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
  const [svgContent, setSvgContent] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const cameraPos = getCameraPosition(exercise.id);

  // Load built-in SVG on mount
  useEffect(() => {
    setSvgContent(getExerciseSVG(exercise.id));
  }, [exercise.id]);

  // Optionally load AI-enhanced version
  async function loadAIDemo() {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/exercise-demo?id=${exercise.id}`);
      const svg = await res.text();
      if (svg.includes('<svg')) {
        setSvgContent(svg);
        setUseAI(true);
      }
    } catch {}
    setAiLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Exercise Demo */}
      <div className="relative bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl overflow-hidden"
           style={{ aspectRatio: '16/10' }}>
        {svgContent ? (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
          </div>
        )}
        {/* Label */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <div className="bg-black/70 rounded-lg px-2 py-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs text-neutral-300 font-medium">
              {useAI ? 'AI Enhanced' : 'Animation'}
            </p>
          </div>
        </div>
      </div>

      {/* Exercise info card */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold">{exercise.name}</h3>
          <span className="text-xs text-neutral-600 bg-neutral-800 px-2 py-1 rounded-full">
            Tier {exercise.tier}
          </span>
        </div>
        <p className="text-sm text-neutral-400 mb-4">{exercise.description}</p>

        {/* Set prescription */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Reps', value: targetReps, color: 'text-white' },
            { label: 'RIR', value: rir, color: 'text-yellow-400' },
            { label: 'Tempo', value: tempo, color: 'text-blue-400' },
            { label: 'Rest', value: `${restSec}s`, color: 'text-green-400' },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-800/80 rounded-xl p-2.5 text-center">
              <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Muscle groups */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {exercise.muscleGroups.map((m) => (
            <span key={m}
              className="text-xs bg-red-950/50 text-red-400 border border-red-900/40 px-2.5 py-1 rounded-full capitalize font-medium">
              {m}
            </span>
          ))}
        </div>

        {/* Camera position */}
        {exercise.cvSupported && (
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl px-3 py-2.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">📷</span>
              <div>
                <p className="text-xs font-bold text-blue-400">Camera Position</p>
                <p className="text-xs text-blue-300/80">{cameraPos} · 6–10 ft away</p>
              </div>
            </div>
          </div>
        )}

        {/* Form cues */}
        <FormCues exerciseId={exercise.id} />
      </div>

      {/* Start button */}
      <button
        onClick={onStartSet}
        className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-red-900/30"
      >
        Start Set 🔥
      </button>
    </div>
  );
}

function FormCues({ exerciseId }: { exerciseId: string }) {
  const cues: Record<string, { cue: string; type: 'do' | 'dont' }[]> = {
    push_standard: [
      { cue: 'Keep body in a perfectly straight line', type: 'do' },
      { cue: 'Chest touches (or near) the floor', type: 'do' },
      { cue: 'Elbows at 45° from your torso', type: 'do' },
      { cue: "Don't let hips sag or pike", type: 'dont' },
    ],
    push_incline: [
      { cue: 'Same straight-line form as standard', type: 'do' },
      { cue: 'Hands elevated on bench or step', type: 'do' },
      { cue: 'Great for learning push-up mechanics', type: 'do' },
    ],
    push_diamond: [
      { cue: 'Hands form a diamond/triangle shape', type: 'do' },
      { cue: 'Keep elbows close to body', type: 'do' },
      { cue: 'Heavy tricep and inner chest focus', type: 'do' },
    ],
    push_decline: [
      { cue: 'Feet elevated on bench', type: 'do' },
      { cue: 'Targets upper chest and shoulders', type: 'do' },
      { cue: 'Control the descent — 3 seconds down', type: 'do' },
    ],
    push_archer: [
      { cue: 'One arm bends, other extends laterally', type: 'do' },
      { cue: 'Shift bodyweight over bending arm', type: 'do' },
      { cue: "Don't rush — control both directions", type: 'dont' },
    ],
    pull_strict: [
      { cue: 'Start from a full dead hang', type: 'do' },
      { cue: 'Pull until chin clears the bar', type: 'do' },
      { cue: 'Full arm extension at the bottom', type: 'do' },
      { cue: 'No kipping or swinging momentum', type: 'dont' },
    ],
    pull_chin: [
      { cue: 'Palms facing toward you (supinated)', type: 'do' },
      { cue: 'Greater bicep involvement than pull-up', type: 'do' },
      { cue: 'Full range of motion — dead hang to chin over', type: 'do' },
    ],
    row_australian: [
      { cue: 'Body as horizontal as possible', type: 'do' },
      { cue: 'Pull chest to bar — not just chin', type: 'do' },
      { cue: 'Squeeze shoulder blades at top', type: 'do' },
      { cue: "Don't let hips drop", type: 'dont' },
    ],
    squat_bodyweight: [
      { cue: 'Feet shoulder-width, toes slightly out', type: 'do' },
      { cue: 'Knees track over toes throughout', type: 'do' },
      { cue: 'Hip crease below parallel (full depth)', type: 'do' },
      { cue: "Don't let heels rise off the floor", type: 'dont' },
    ],
    squat_bulgarian: [
      { cue: 'Rear foot elevated on bench', type: 'do' },
      { cue: 'Front foot far enough forward', type: 'do' },
      { cue: 'Drive through front heel to stand', type: 'do' },
      { cue: "Don't let front knee cave inward", type: 'dont' },
    ],
    hinge_glute_bridge: [
      { cue: 'Feet flat on floor, hip-width apart', type: 'do' },
      { cue: 'Drive hips up to full extension', type: 'do' },
      { cue: 'Squeeze glutes hard at top — 2s hold', type: 'do' },
      { cue: "Don't hyperextend the lower back", type: 'dont' },
    ],
    hinge_hip_thrust: [
      { cue: 'Upper back on bench edge', type: 'do' },
      { cue: 'Drive hips up explosively', type: 'do' },
      { cue: 'Full hip extension — body parallel to floor', type: 'do' },
    ],
    core_plank: [
      { cue: 'Straight line from head to heels', type: 'do' },
      { cue: 'Hips level — not sagging or piking', type: 'do' },
      { cue: 'Breathe steadily throughout', type: 'do' },
      { cue: "Don't hold your breath", type: 'dont' },
    ],
    dip_parallel: [
      { cue: 'Lower until shoulders below elbows', type: 'do' },
      { cue: 'Lean forward slightly for chest focus', type: 'do' },
      { cue: 'Full lockout at the top', type: 'do' },
      { cue: "Don't flare elbows out wide", type: 'dont' },
    ],
    cond_burpee: [
      { cue: 'Squat, jump feet back to plank', type: 'do' },
      { cue: 'Perform a full push-up', type: 'do' },
      { cue: 'Jump feet forward, then explosive jump', type: 'do' },
    ],
    cond_mountain_climber: [
      { cue: 'Stay in solid plank position', type: 'do' },
      { cue: 'Drive knees to chest alternately', type: 'do' },
      { cue: 'Keep hips level and stable', type: 'do' },
      { cue: "Don't let hips bounce up and down", type: 'dont' },
    ],
    cond_lunge: [
      { cue: 'Step back into lunge', type: 'do' },
      { cue: 'Front knee at 90° over ankle', type: 'do' },
      { cue: 'Keep torso upright, core engaged', type: 'do' },
      { cue: "Don't let front knee go past toes", type: 'dont' },
    ],
  };

  const exerciseCues = cues[exerciseId];
  if (!exerciseCues) return null;

  return (
    <div>
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Form Cues</p>
      <ul className="space-y-2">
        {exerciseCues.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 shrink-0 font-bold ${item.type === 'do' ? 'text-green-400' : 'text-red-400'}`}>
              {item.type === 'do' ? '✓' : '✗'}
            </span>
            <span className={item.type === 'do' ? 'text-neutral-300' : 'text-neutral-400'}>
              {item.cue}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
