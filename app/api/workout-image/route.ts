import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Exercise } from '@/lib/workout/exerciseLibrary';

export const runtime = 'nodejs';
export const maxDuration = 60;

type WorkoutImageRequest = {
  exercise: Pick<Exercise, 'id' | 'name' | 'description' | 'muscleGroups' | 'tier' | 'category'>;
  targetReps: number;
  rir: number;
  tempo: string;
  restSec: number;
};

// Parse tempo string e.g. "3-2-1-0" into labels
function parseTempo(tempo: string): { eccentric: string; bottom: string; concentric: string; top: string } {
  const parts = tempo.split('-');
  return {
    eccentric: parts[0] ?? '3',
    bottom: parts[1] ?? '1',
    concentric: parts[2] ?? '1',
    top: parts[3] ?? '0',
  };
}

// Get step-by-step cues for each exercise
function getExerciseSteps(exerciseId: string): { label: string; cue: string }[] {
  const steps: Record<string, { label: string; cue: string }[]> = {
    push_standard: [
      { label: 'Start', cue: 'High plank, arms straight' },
      { label: 'Lower', cue: '3s eccentric, elbows 45°' },
      { label: 'Bottom', cue: 'Chest near floor' },
      { label: 'Push', cue: 'Drive up explosively' },
    ],
    push_incline: [
      { label: 'Setup', cue: 'Hands on elevated surface' },
      { label: 'Lower', cue: 'Controlled descent' },
      { label: 'Bottom', cue: 'Chest to surface' },
      { label: 'Push', cue: 'Full arm extension' },
    ],
    push_diamond: [
      { label: 'Setup', cue: 'Diamond hand position' },
      { label: 'Lower', cue: 'Elbows track back' },
      { label: 'Bottom', cue: 'Chest near hands' },
      { label: 'Push', cue: 'Squeeze triceps' },
    ],
    push_typewriter: [
      { label: 'Start', cue: 'High plank position' },
      { label: 'Shift Left', cue: 'Transfer weight left' },
      { label: 'Left Bottom', cue: 'Lower on left side' },
      { label: 'Shift Right', cue: 'Travel to right side' },
      { label: 'Right Bottom', cue: 'Lower on right side' },
    ],
    push_archer: [
      { label: 'Setup', cue: 'Wide hand position' },
      { label: 'Shift', cue: 'Load one side' },
      { label: 'Lower', cue: 'Bend working arm' },
      { label: 'Push', cue: 'Drive back to center' },
    ],
    pull_strict: [
      { label: 'Dead Hang', cue: 'Full arm extension' },
      { label: 'Initiate', cue: 'Depress scapula' },
      { label: 'Pull', cue: 'Drive elbows down' },
      { label: 'Top', cue: 'Chin over bar' },
    ],
    pull_chin: [
      { label: 'Dead Hang', cue: 'Palms facing you' },
      { label: 'Pull', cue: 'Lead with elbows' },
      { label: 'Top', cue: 'Chin clears bar' },
      { label: 'Lower', cue: 'Full extension' },
    ],
    squat_bodyweight: [
      { label: 'Stand', cue: 'Feet shoulder-width' },
      { label: 'Descend', cue: 'Push knees out' },
      { label: 'Bottom', cue: 'Hip crease below knees' },
      { label: 'Drive', cue: 'Push through heels' },
    ],
    squat_bulgarian: [
      { label: 'Setup', cue: 'Rear foot on bench' },
      { label: 'Lower', cue: 'Keep torso upright' },
      { label: 'Bottom', cue: 'Front thigh parallel' },
      { label: 'Drive', cue: 'Through front heel' },
    ],
    hinge_glute_bridge: [
      { label: 'Lie Down', cue: 'Feet flat, hip-width' },
      { label: 'Drive', cue: 'Push hips up' },
      { label: 'Top', cue: 'Squeeze glutes 2s' },
      { label: 'Lower', cue: 'Controlled descent' },
    ],
    core_plank: [
      { label: 'Setup', cue: 'Forearms on floor' },
      { label: 'Brace', cue: 'Core and glutes tight' },
      { label: 'Hold', cue: 'Straight line, breathe' },
      { label: 'Reset', cue: 'Rest and repeat' },
    ],
    dip_parallel: [
      { label: 'Hang', cue: 'Arms straight, locked' },
      { label: 'Lower', cue: 'Lean forward slightly' },
      { label: 'Bottom', cue: 'Shoulders below elbows' },
      { label: 'Push', cue: 'Full lockout at top' },
    ],
    cond_burpee: [
      { label: 'Stand', cue: 'Athletic position' },
      { label: 'Plank', cue: 'Jump feet back' },
      { label: 'Push-up', cue: 'Chest to floor' },
      { label: 'Jump', cue: 'Explosive jump up' },
    ],
    row_australian: [
      { label: 'Setup', cue: 'Body under bar' },
      { label: 'Hang', cue: 'Arms straight' },
      { label: 'Pull', cue: 'Chest to bar' },
      { label: 'Squeeze', cue: 'Shoulder blades together' },
    ],
  };
  return steps[exerciseId] ?? [
    { label: 'Start', cue: 'Get into position' },
    { label: 'Execute', cue: 'Full range of motion' },
    { label: 'Hold', cue: 'Control the movement' },
    { label: 'Return', cue: 'Controlled return' },
  ];
}

export async function POST(req: Request) {
  let body: WorkoutImageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.exercise?.id || !body.exercise?.name) {
    return NextResponse.json({ error: 'Missing exercise details.' }, { status: 400 });
  }

  const { exercise, targetReps, rir, tempo, restSec } = body;
  const muscles = exercise.muscleGroups.map(m => m[0].toUpperCase() + m.slice(1)).join(', ');
  const t = parseTempo(tempo);
  const steps = getExerciseSteps(exercise.id);
  const stepCount = steps.length;

  // Build SVG infographic matching the reference image style
  const stepWidth = 200;
  const svgWidth = Math.max(900, stepCount * stepWidth + 100);
  const svgHeight = 580;

  const muscleColors: Record<string, string> = {
    chest: '#7f1d1d', back: '#1e3a5f', shoulders: '#1a3a1a',
    biceps: '#2d1b69', triceps: '#1a2e1a', quads: '#1e3a1e',
    hamstrings: '#2a1a0e', glutes: '#2d1f0e', core: '#1a2d1a',
  };
  const muscleTextColors: Record<string, string> = {
    chest: '#fca5a5', back: '#93c5fd', shoulders: '#86efac',
    biceps: '#c4b5fd', triceps: '#86efac', quads: '#86efac',
    hamstrings: '#fdba74', glutes: '#fcd34d', core: '#86efac',
  };

  // Generate the SVG directly — Claude draws the step frames as illustrated figures
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generate a complete SVG infographic for the exercise "${exercise.name}".

The SVG must be exactly this structure (${svgWidth}x${svgHeight}px, dark background #0f0f0f):

HEADER SECTION (y=0 to y=140):
- Exercise name "${exercise.name}" in large white bold text (font-size 42px, x=40, y=55)
- Description "${exercise.description}" in gray text (font-size 18px, x=40, y=85, fill=#888)
- "Tier ${exercise.tier}" badge (rounded rect at x=${svgWidth - 140}, y=25, 110x40, fill=#1a1a1a, text fill=#888)
- 4 metric cards in a row (x=40, y=100, each 160px wide, 55px tall, fill=#1a1a1a, rx=10):
  Card 1: big white "${targetReps}" + small gray "Reps"
  Card 2: big yellow "${rir}" (fill=#eab308) + small gray "RIR"  
  Card 3: big blue "${tempo}" (fill=#3b82f6) + small gray "Tempo"
  Card 4: big green "${restSec}s" (fill=#22c55e) + small gray "Rest"
- Muscle chips after cards: ${exercise.muscleGroups.map(m => `"${m[0].toUpperCase() + m.slice(1)}"`).join(', ')} — each as rounded rect (fill=#7f1d1d, text fill=#fca5a5, rx=18, height=32, font-size 14px)

STEPS SECTION (y=170 to y=430):
${steps.map((s, i) => `- Step ${i + 1} at x=${40 + i * stepWidth}: numbered circle (⬤ ${i + 1}, fill=#3b82f6, r=16), label "${s.label}" in white, arrow → connecting to next step
  Below: dark photo frame (${stepWidth - 20}x180px, fill=#0a0a0a, stroke=#333, rx=8) with a detailed stick figure illustration of "${exercise.name}" at the "${s.label}" position — draw the figure with:
  - Circle head (r=18, fill=#e5e7eb)
  - Torso rectangle 
  - Arms and legs as thick lines (stroke-width=8, stroke=#e5e7eb, stroke-linecap=round)
  - Show the body position clearly for this step
  Below frame: cue text "${s.cue}" in gray (font-size 13px, fill=#888, text-anchor=middle)`).join('\n')}

TEMPO ROW (y=450 to y=500, full width dark bar fill=#111):
- "${t.eccentric} seconds down" | "${t.bottom} seconds at bottom" | "${t.concentric} second up" | "${t.top} second at top"
- Numbers in blue (#3b82f6, font-size 28px bold), labels in gray (#666, font-size 14px)
- Separated by vertical dividers

Return ONLY the complete SVG code starting with <svg and ending with </svg>. No markdown, no explanation.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/);
    const svg = svgMatch ? svgMatch[0] : buildFallbackSVG(exercise, targetReps, rir, tempo, restSec, steps, t, muscles, svgWidth, svgHeight);

    // Convert SVG to base64 data URL
    const b64 = Buffer.from(svg).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${b64}`;

    return NextResponse.json(
      { imageUrl, isSvg: true },
      { headers: { 'Cache-Control': 'private, max-age=604800' } }
    );
  } catch (err: any) {
    console.error('Image generation error:', err);
    // Fallback SVG
    const svg = buildFallbackSVG(exercise, targetReps, rir, tempo, restSec, steps, t, muscles, svgWidth, svgHeight);
    const b64 = Buffer.from(svg).toString('base64');
    return NextResponse.json({ imageUrl: `data:image/svg+xml;base64,${b64}`, isSvg: true });
  }
}

function buildFallbackSVG(
  exercise: WorkoutImageRequest['exercise'],
  targetReps: number,
  rir: number,
  tempo: string,
  restSec: number,
  steps: { label: string; cue: string }[],
  t: ReturnType<typeof parseTempo>,
  muscles: string,
  w: number,
  h: number
): string {
  const stepW = Math.floor((w - 80) / steps.length);

  const muscleChips = exercise.muscleGroups.map((m, i) => {
    const label = m[0].toUpperCase() + m.slice(1);
    return `<rect x="${700 + i * 110}" y="158" width="${label.length * 9 + 24}" height="32" rx="16" fill="#7f1d1d"/>
<text x="${700 + i * 110 + label.length * 4.5 + 12}" y="179" text-anchor="middle" fill="#fca5a5" font-size="14" font-family="system-ui" font-weight="600">${label}</text>`;
  }).join('\n');

  const stepSvgs = steps.map((s, i) => {
    const x = 40 + i * stepW;
    const cx = x + stepW / 2;
    // Simple figure positions
    const figures: Record<string, string> = {
      '0': `<circle cx="${cx}" cy="${295}" r="12" fill="#e5e7eb"/>
<line x1="${cx}" y1="${307}" x2="${cx}" y2="${340}" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
<line x1="${cx}" y1="${320}" x2="${cx - 20}" y2="${310}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${320}" x2="${cx + 20}" y2="${310}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${340}" x2="${cx - 14}" y2="${370}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${340}" x2="${cx + 14}" y2="${370}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>`,
      '1': `<circle cx="${cx}" cy="${300}" r="12" fill="#e5e7eb"/>
<line x1="${cx}" y1="${312}" x2="${cx}" y2="${345}" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
<line x1="${cx}" y1="${320}" x2="${cx - 22}" y2="${335}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${320}" x2="${cx + 22}" y2="${335}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${345}" x2="${cx - 12}" y2="${375}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${345}" x2="${cx + 12}" y2="${375}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>`,
      '2': `<circle cx="${cx}" cy="${310}" r="12" fill="#e5e7eb"/>
<line x1="${cx}" y1="${322}" x2="${cx}" y2="${352}" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
<line x1="${cx}" y1="${330}" x2="${cx - 25}" y2="${345}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${330}" x2="${cx + 25}" y2="${345}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${352}" x2="${cx - 10}" y2="${378}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${352}" x2="${cx + 10}" y2="${378}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>`,
      '3': `<circle cx="${cx}" cy="${295}" r="12" fill="#e5e7eb"/>
<line x1="${cx}" y1="${307}" x2="${cx}" y2="${340}" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
<line x1="${cx}" y1="${318}" x2="${cx - 20}" y2="${308}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${318}" x2="${cx + 20}" y2="${308}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${340}" x2="${cx - 14}" y2="${368}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>
<line x1="${cx}" y1="${340}" x2="${cx + 14}" y2="${368}" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/>`,
    };
    const fig = figures[String(i % 4)] ?? figures['0'];

    return `
<circle cx="${x + 16}" cy="${190}" r="16" fill="#3b82f6"/>
<text x="${x + 16}" y="${196}" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="system-ui">${i + 1}</text>
<text x="${x + 40}" y="${197}" fill="white" font-size="15" font-weight="600" font-family="system-ui">${s.label}</text>
${i < steps.length - 1 ? `<text x="${x + stepW - 10}" y="${197}" fill="#555" font-size="20" font-family="system-ui">→</text>` : ''}
<rect x="${x}" y="${212}" width="${stepW - 15}" height="${180}" rx="8" fill="#0a0a0a" stroke="#2a2a2a" stroke-width="1"/>
${fig}
<text x="${cx}" y="${415}" text-anchor="middle" fill="#888" font-size="13" font-family="system-ui">${s.cue}</text>`;
  }).join('\n');

  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
<rect width="${w}" height="${h}" fill="#0f0f0f" rx="16"/>

<!-- Header -->
<text x="40" y="55" fill="white" font-size="42" font-weight="bold" font-family="system-ui">${exercise.name}</text>
<text x="40" y="85" fill="#888" font-size="18" font-family="system-ui">${exercise.description}</text>
<rect x="${w - 140}" y="25" width="110" height="40" rx="10" fill="#1a1a1a"/>
<text x="${w - 85}" y="51" text-anchor="middle" fill="#888" font-size="16" font-family="system-ui">Tier ${exercise.tier}</text>

<!-- Metric cards -->
<rect x="40" y="100" width="155" height="55" rx="10" fill="#1a1a1a"/>
<text x="118" y="122" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="system-ui">${targetReps}</text>
<text x="118" y="145" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">Reps</text>

<rect x="205" y="100" width="155" height="55" rx="10" fill="#1a1a1a"/>
<text x="283" y="122" text-anchor="middle" fill="#eab308" font-size="24" font-weight="bold" font-family="system-ui">${rir}</text>
<text x="283" y="145" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">RIR</text>

<rect x="370" y="100" width="155" height="55" rx="10" fill="#1a1a1a"/>
<text x="448" y="122" text-anchor="middle" fill="#3b82f6" font-size="24" font-weight="bold" font-family="system-ui">${tempo}</text>
<text x="448" y="145" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">Tempo</text>

<rect x="535" y="100" width="155" height="55" rx="10" fill="#1a1a1a"/>
<text x="613" y="122" text-anchor="middle" fill="#22c55e" font-size="24" font-weight="bold" font-family="system-ui">${restSec}s</text>
<text x="613" y="145" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">Rest</text>

<!-- Muscle chips -->
${muscleChips}

<!-- Steps -->
${stepSvgs}

<!-- Tempo row -->
<rect x="0" y="430" width="${w}" height="70" fill="#111"/>
<line x1="${w / 4}" y1="440" x2="${w / 4}" y2="490" stroke="#2a2a2a" stroke-width="1"/>
<line x1="${w / 2}" y1="440" x2="${w / 2}" y2="490" stroke="#2a2a2a" stroke-width="1"/>
<line x1="${(3 * w) / 4}" y1="440" x2="${(3 * w) / 4}" y2="490" stroke="#2a2a2a" stroke-width="1"/>

<text x="${w / 8}" y="462" text-anchor="middle" fill="#3b82f6" font-size="28" font-weight="bold" font-family="system-ui">${t.eccentric}</text>
<text x="${w / 8}" y="485" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">seconds down</text>

<text x="${(3 * w) / 8}" y="462" text-anchor="middle" fill="#3b82f6" font-size="28" font-weight="bold" font-family="system-ui">${t.bottom}</text>
<text x="${(3 * w) / 8}" y="485" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">seconds at bottom</text>

<text x="${(5 * w) / 8}" y="462" text-anchor="middle" fill="#3b82f6" font-size="28" font-weight="bold" font-family="system-ui">${t.concentric}</text>
<text x="${(5 * w) / 8}" y="485" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">second up</text>

<text x="${(7 * w) / 8}" y="462" text-anchor="middle" fill="#3b82f6" font-size="28" font-weight="bold" font-family="system-ui">${t.top}</text>
<text x="${(7 * w) / 8}" y="485" text-anchor="middle" fill="#666" font-size="13" font-family="system-ui">second at top</text>
</svg>`;
}
