'use client';

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

const EXERCISE_STEPS: Record<string, { label: string; cue: string; icon: string }[]> = {
  push_standard: [
    { label: 'High Plank', cue: 'Arms straight, body rigid', icon: '🫱' },
    { label: 'Lower (3s)', cue: 'Elbows at 45° from torso', icon: '⬇️' },
    { label: 'Bottom', cue: 'Chest near the floor', icon: '✋' },
    { label: 'Push Up', cue: 'Drive through palms', icon: '⬆️' },
  ],
  push_typewriter: [
    { label: 'Start Center', cue: 'High plank position', icon: '🫱' },
    { label: 'Shift Left', cue: 'Transfer weight left', icon: '⬅️' },
    { label: 'Lower Left', cue: 'Bend left arm down', icon: '⬇️' },
    { label: 'Shift Right', cue: 'Travel to right side', icon: '➡️' },
    { label: 'Lower Right', cue: 'Bend right arm down', icon: '⬇️' },
  ],
  push_archer: [
    { label: 'Wide Setup', cue: 'Hands wide apart', icon: '↔️' },
    { label: 'Shift Weight', cue: 'Load one side', icon: '↗️' },
    { label: 'Lower', cue: 'Bend working arm', icon: '⬇️' },
    { label: 'Drive Back', cue: 'Return to center', icon: '⬆️' },
  ],
  pull_strict: [
    { label: 'Dead Hang', cue: 'Full arm extension', icon: '🤲' },
    { label: 'Initiate', cue: 'Depress scapula first', icon: '🔽' },
    { label: 'Pull', cue: 'Drive elbows down', icon: '⬆️' },
    { label: 'Top', cue: 'Chin clears the bar', icon: '✅' },
  ],
  pull_chin: [
    { label: 'Dead Hang', cue: 'Palms facing you', icon: '🤲' },
    { label: 'Pull', cue: 'Lead with elbows', icon: '⬆️' },
    { label: 'Top', cue: 'Chin clears bar', icon: '✅' },
    { label: 'Lower', cue: 'Full extension return', icon: '⬇️' },
  ],
  row_australian: [
    { label: 'Setup', cue: 'Hang under bar', icon: '🤲' },
    { label: 'Body Straight', cue: 'Plank from heels', icon: '📏' },
    { label: 'Pull', cue: 'Chest to bar', icon: '⬆️' },
    { label: 'Squeeze', cue: 'Shoulder blades together', icon: '✅' },
  ],
  squat_bodyweight: [
    { label: 'Stand Tall', cue: 'Feet shoulder-width', icon: '🧍' },
    { label: 'Descend', cue: 'Push knees out', icon: '⬇️' },
    { label: 'Bottom', cue: 'Hip crease below knees', icon: '🪑' },
    { label: 'Drive Up', cue: 'Push through heels', icon: '⬆️' },
  ],
  squat_bulgarian: [
    { label: 'Setup', cue: 'Rear foot on bench', icon: '🦵' },
    { label: 'Lower', cue: 'Keep torso upright', icon: '⬇️' },
    { label: 'Bottom', cue: 'Front thigh parallel', icon: '🪑' },
    { label: 'Drive', cue: 'Through front heel', icon: '⬆️' },
  ],
  hinge_glute_bridge: [
    { label: 'Lie Down', cue: 'Feet flat, hip-width', icon: '🛏️' },
    { label: 'Drive Hips', cue: 'Push hips toward ceiling', icon: '⬆️' },
    { label: 'Top', cue: 'Squeeze glutes 2 seconds', icon: '✅' },
    { label: 'Lower', cue: 'Controlled descent', icon: '⬇️' },
  ],
  hinge_hip_thrust: [
    { label: 'Setup', cue: 'Shoulders on bench edge', icon: '🛏️' },
    { label: 'Drive', cue: 'Hips up explosively', icon: '⬆️' },
    { label: 'Top', cue: 'Body parallel to floor', icon: '✅' },
    { label: 'Lower', cue: 'Controlled descent', icon: '⬇️' },
  ],
  core_plank: [
    { label: 'Forearms Down', cue: 'Elbows under shoulders', icon: '💪' },
    { label: 'Brace', cue: 'Core and glutes tight', icon: '🔒' },
    { label: 'Hold', cue: 'Straight line, breathe', icon: '📏' },
    { label: 'Rest', cue: 'Lower and recover', icon: '🔄' },
  ],
  dip_parallel: [
    { label: 'Hang', cue: 'Arms locked out', icon: '🤲' },
    { label: 'Lower (3s)', cue: 'Lean forward slightly', icon: '⬇️' },
    { label: 'Bottom', cue: 'Shoulders below elbows', icon: '✋' },
    { label: 'Push', cue: 'Full lockout at top', icon: '⬆️' },
  ],
  cond_burpee: [
    { label: 'Stand', cue: 'Athletic ready position', icon: '🧍' },
    { label: 'Plank', cue: 'Jump feet back', icon: '⬇️' },
    { label: 'Push-up', cue: 'Chest to floor', icon: '✋' },
    { label: 'Jump Up', cue: 'Explosive jump with arms', icon: '⬆️' },
  ],
  cond_mountain_climber: [
    { label: 'High Plank', cue: 'Arms straight, stable', icon: '🫱' },
    { label: 'Drive Left', cue: 'Left knee to chest', icon: '🏃' },
    { label: 'Drive Right', cue: 'Right knee to chest', icon: '🏃' },
    { label: 'Repeat', cue: 'Alternate fast, hips stable', icon: '🔄' },
  ],
  cond_lunge: [
    { label: 'Stand', cue: 'Upright posture', icon: '🧍' },
    { label: 'Step Back', cue: 'Rear foot lunge', icon: '⬇️' },
    { label: 'Bottom', cue: 'Front knee at 90°', icon: '🪑' },
    { label: 'Drive', cue: 'Through front heel', icon: '⬆️' },
  ],
};

const FORM_CUES: Record<string, { cue: string; type: 'do' | 'dont' }[]> = {
  push_standard: [
    { cue: 'Keep body in a perfectly straight line', type: 'do' },
    { cue: 'Chest touches (or near) the floor', type: 'do' },
    { cue: 'Elbows at 45° from your torso', type: 'do' },
    { cue: "Don't let hips sag or pike", type: 'dont' },
  ],
  push_typewriter: [
    { cue: 'Start in a high plank position', type: 'do' },
    { cue: 'Shift body side to side at the bottom', type: 'do' },
    { cue: 'Keep your core tight and body straight', type: 'do' },
    { cue: "Don't rush — move smoothly and with control", type: 'dont' },
  ],
  pull_strict: [
    { cue: 'Start from a full dead hang', type: 'do' },
    { cue: 'Pull until chin clears the bar', type: 'do' },
    { cue: 'Full arm extension at the bottom', type: 'do' },
    { cue: 'No kipping or swinging momentum', type: 'dont' },
  ],
  squat_bodyweight: [
    { cue: 'Feet shoulder-width, toes slightly out', type: 'do' },
    { cue: 'Knees track over toes throughout', type: 'do' },
    { cue: 'Hip crease below parallel (full depth)', type: 'do' },
    { cue: "Don't let heels rise off the floor", type: 'dont' },
  ],
  hinge_glute_bridge: [
    { cue: 'Feet flat on floor, hip-width apart', type: 'do' },
    { cue: 'Drive hips up to full extension', type: 'do' },
    { cue: 'Squeeze glutes hard at top — 2s hold', type: 'do' },
    { cue: "Don't hyperextend the lower back", type: 'dont' },
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
};

function getSteps(id: string) {
  return EXERCISE_STEPS[id] ?? [
    { label: 'Setup', cue: 'Get into position', icon: '🫱' },
    { label: 'Execute', cue: 'Full range of motion', icon: '⬇️' },
    { label: 'Bottom', cue: 'Control the movement', icon: '✋' },
    { label: 'Return', cue: 'Controlled return', icon: '⬆️' },
  ];
}

function parseTempo(tempo: string) {
  const p = tempo.split('-');
  return { eccentric: p[0] ?? '3', bottom: p[1] ?? '1', concentric: p[2] ?? '1', top: p[3] ?? '0' };
}

export function ExerciseDemo({ exercise, targetReps, rir, tempo, restSec, onStartSet }: ExerciseDemoProps) {
  const steps = getSteps(exercise.id);
  const t = parseTempo(tempo);
  const cameraPos = getCameraPosition(exercise.id);
  const formCues = FORM_CUES[exercise.id] ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a]">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-bold text-white leading-tight">{exercise.name}</h2>
            <span className="text-xs text-neutral-500 bg-[#1a1a1a] px-2.5 py-1 rounded-full ml-2 shrink-0">Tier {exercise.tier}</span>
          </div>
          <p className="text-sm text-neutral-500">{exercise.description}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[#1a1a1a]">
          {[
            { label: 'Reps', value: String(targetReps), color: 'text-white' },
            { label: 'RIR', value: String(rir), color: 'text-yellow-400' },
            { label: 'Tempo', value: tempo, color: 'text-blue-400' },
            { label: 'Rest', value: restSec + 's', color: 'text-green-400' },
          ].map((item) => (
            <div key={item.label} className="bg-[#1a1a1a] rounded-xl py-2.5 text-center">
              <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-neutral-600 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-[#1a1a1a]">
          {exercise.muscleGroups.map((m) => (
            <span key={m} className="text-xs bg-red-950/60 text-red-400 border border-red-900/40 px-2.5 py-1 rounded-full capitalize font-medium">{m}</span>
          ))}
        </div>
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Step by Step</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)` }}>
            {steps.slice(0, 4).map((step, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl p-2.5 text-center relative">
                <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                <div className="text-2xl mb-1 mt-1">{step.icon}</div>
                <p className="text-xs font-semibold text-white leading-tight mb-0.5">{step.label}</p>
                <p className="text-xs text-neutral-500 leading-tight">{step.cue}</p>
              </div>
            ))}
          </div>
          {steps.length > 4 && (
            <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${steps.length - 4}, 1fr)` }}>
              {steps.slice(4).map((step, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-xl p-2.5 text-center relative">
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 5}</div>
                  <div className="text-2xl mb-1 mt-1">{step.icon}</div>
                  <p className="text-xs font-semibold text-white leading-tight mb-0.5">{step.label}</p>
                  <p className="text-xs text-neutral-500 leading-tight">{step.cue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
          {[
            { num: t.eccentric, label: 'sec down' },
            { num: t.bottom, label: 'sec bottom' },
            { num: t.concentric, label: 'sec up' },
            { num: t.top, label: 'sec top' },
          ].map((item, i) => (
            <div key={i} className="py-2.5 text-center">
              <div className="text-lg font-bold text-blue-400">{item.num}</div>
              <div className="text-xs text-neutral-600">{item.label}</div>
            </div>
          ))}
        </div>
        {exercise.cvSupported && (
          <div className="px-4 py-2.5 border-b border-[#1a1a1a] flex items-center gap-2">
            <span>📷</span>
            <div>
              <p className="text-xs font-bold text-blue-400">Camera Position</p>
              <p className="text-xs text-blue-300/70">{cameraPos} · 6–10 ft away</p>
            </div>
          </div>
        )}
        {formCues.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Form Cues</p>
            <ul className="space-y-1.5">
              {formCues.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className={`shrink-0 font-bold mt-0.5 ${item.type === 'do' ? 'text-green-400' : 'text-red-400'}`}>{item.type === 'do' ? '✓' : '✗'}</span>
                  <span className={item.type === 'do' ? 'text-neutral-300' : 'text-neutral-500'}>{item.cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <button onClick={onStartSet} className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors">
        Start Set 🔥
      </button>
    </div>
  );
}