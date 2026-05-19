// lib/pose/formScore.ts
// Composite form score 0–100

export interface FormScoreInput {
  // Depth: % of reps reaching target angle
  totalReps: number;
  repsAtDepth: number; // reps where down angle was reached

  // Body alignment: % of frames in target range
  totalFrames: number;
  framesInAlignment: number;

  // Tempo: eccentric durations vs target
  eccentricTimes: number[]; // ms per rep
  targetEccentricMs: number; // e.g. 3000 for 3s

  // Cadence consistency
  repDurations: number[]; // ms per full rep
}

export function calcFormScore(input: FormScoreInput): number {
  // 1. Depth score (40 pts)
  const depthScore = input.totalReps > 0
    ? (input.repsAtDepth / input.totalReps) * 40
    : 0;

  // 2. Alignment score (30 pts)
  const alignScore = input.totalFrames > 0
    ? (input.framesInAlignment / input.totalFrames) * 30
    : 30; // default full score if no data

  // 3. Tempo score (20 pts)
  let tempoScore = 20;
  if (input.eccentricTimes.length > 0) {
    const avgEcc =
      input.eccentricTimes.reduce((a, b) => a + b, 0) /
      input.eccentricTimes.length;
    const targetMs = input.targetEccentricMs;
    const deviation = Math.abs(avgEcc - targetMs) / targetMs;
    tempoScore = Math.max(0, 20 - deviation * 20);
  }

  // 4. Cadence consistency (10 pts)
  let cadenceScore = 10;
  if (input.repDurations.length >= 2) {
    const mean =
      input.repDurations.reduce((a, b) => a + b, 0) /
      input.repDurations.length;
    const variance =
      input.repDurations.reduce((s, d) => s + Math.pow(d - mean, 2), 0) /
      input.repDurations.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    cadenceScore = Math.max(0, 10 - cv * 10);
  }

  return Math.round(depthScore + alignScore + tempoScore + cadenceScore);
}

// Parse tempo string like "3-1-1-0" → eccentric ms
export function tempoToEccentricMs(tempo: string): number {
  const parts = tempo.split('-').map(Number);
  if (parts.length >= 1 && !isNaN(parts[0])) {
    return parts[0] * 1000;
  }
  return 3000; // default 3s
}
