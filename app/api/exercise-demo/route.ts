import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Cache generated SVGs in memory (resets on cold start, good enough)
const svgCache: Record<string, string> = {};

const EXERCISE_PROMPTS: Record<string, string> = {
  push_standard: 'animated SVG of a person doing a push-up, side view, showing the up and down motion',
  push_incline: 'animated SVG of a person doing an incline push-up with hands on elevated surface',
  push_diamond: 'animated SVG of a person doing diamond push-ups with hands close together',
  push_decline: 'animated SVG of a person doing decline push-ups with feet elevated',
  push_pike: 'animated SVG of a person doing pike push-ups in an inverted V position',
  push_archer: 'animated SVG of a person doing archer push-ups, shifting weight side to side',
  pull_strict: 'animated SVG of a person doing strict pull-ups on a bar, full range of motion',
  pull_chin: 'animated SVG of a person doing chin-ups with supinated grip',
  pull_negative: 'animated SVG of a person doing negative pull-ups, slowly lowering down',
  row_australian: 'animated SVG of a person doing Australian rows under a bar, horizontal body',
  squat_bodyweight: 'animated SVG of a person doing bodyweight squats, side view, full depth',
  squat_bulgarian: 'animated SVG of a person doing Bulgarian split squats with rear foot elevated',
  squat_pistol: 'animated SVG of a person doing pistol squats on one leg',
  hinge_glute_bridge: 'animated SVG of a person doing glute bridges lying on their back',
  hinge_hip_thrust: 'animated SVG of a person doing hip thrusts with shoulders on a bench',
  core_plank: 'animated SVG of a person holding a plank position, side view',
  core_hollow_body: 'animated SVG of a person holding a hollow body position',
  core_leg_raise: 'animated SVG of a person doing hanging leg raises',
  dip_parallel: 'animated SVG of a person doing parallel bar dips',
  dip_bench: 'animated SVG of a person doing bench dips with hands behind',
  cond_burpee: 'animated SVG of a person doing burpees, full sequence',
  cond_mountain_climber: 'animated SVG of a person doing mountain climbers in plank position',
  cond_lunge: 'animated SVG of a person doing reverse lunges, alternating legs',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get('id');

  if (!exerciseId) {
    return NextResponse.json({ error: 'Missing exercise id' }, { status: 400 });
  }

  // Return cached SVG if available
  if (svgCache[exerciseId]) {
    return new Response(svgCache[exerciseId], {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const prompt = EXERCISE_PROMPTS[exerciseId] ?? `animated SVG of a person doing ${exerciseId.replace(/_/g, ' ')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Create a clean, minimal ${prompt}. 
          
Requirements:
- SVG viewBox="0 0 300 200"
- Dark background (#0a0a0a)
- Red stick figure (#ef4444) with smooth CSS animation showing the exercise movement
- The animation should loop infinitely showing the full range of motion
- Include the exercise name as small text at the bottom
- Keep it simple but clear — this is for a fitness app demo
- Return ONLY the SVG code, nothing else, no markdown backticks`,
        }],
      }),
    });

    const data = await response.json();
    const svgContent = data.content?.[0]?.text ?? '';

    // Extract SVG if wrapped in anything
    const svgMatch = svgContent.match(/<svg[\s\S]*<\/svg>/);
    const svg = svgMatch ? svgMatch[0] : getFallbackSVG(exerciseId);

    // Cache it
    svgCache[exerciseId] = svg;

    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    console.error('SVG generation error:', err);
    const fallback = getFallbackSVG(exerciseId);
    return new Response(fallback, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}

function getFallbackSVG(exerciseId: string): string {
  const name = exerciseId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
      .fig { animation: bob 1.5s ease-in-out infinite; }
    </style>
    <rect width="300" height="200" fill="#0a0a0a"/>
    <line x1="30" y1="170" x2="270" y2="170" stroke="#1a1a1a" stroke-width="2"/>
    <g class="fig" transform="translate(130,50)">
      <circle cx="20" cy="15" r="12" fill="none" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="20" y1="27" x2="20" y2="65" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="20" y1="38" x2="2" y2="55" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="20" y1="38" x2="38" y2="55" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="20" y1="65" x2="8" y2="90" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="20" y1="65" x2="32" y2="90" stroke="#ef4444" stroke-width="2.5"/>
      <circle cx="8" cy="92" r="3" fill="#ef4444"/>
      <circle cx="32" cy="92" r="3" fill="#ef4444"/>
    </g>
    <text x="150" y="190" text-anchor="middle" fill="#444" font-size="10" font-family="sans-serif">${name}</text>
  </svg>`;
}
