import { NextResponse } from 'next/server';
import type { Exercise } from '@/lib/workout/exerciseLibrary';

export const runtime = 'nodejs';

type WorkoutImageRequest = {
  exercise: Pick<Exercise, 'id' | 'name' | 'description' | 'muscleGroups' | 'tier' | 'category'>;
  targetReps: number;
  rir: number;
  tempo: string;
  restSec: number;
};

function buildWorkoutImagePrompt(input: WorkoutImageRequest) {
  const { exercise, targetReps, rir, tempo, restSec } = input;
  const muscles = exercise.muscleGroups.map((m) => m[0].toUpperCase() + m.slice(1)).join(', ');

  return `Create a premium dark-mode fitness app infographic for this workout exercise.\n\nExercise: ${exercise.name}\nInstruction: ${exercise.description}\nTier: ${exercise.tier}\nReps: ${targetReps}\nRIR: ${rir}\nTempo: ${tempo}\nRest: ${restSec}s\nTarget muscles: ${muscles}\n\nVisual direction:\n- Black / charcoal background, high-end mobile fitness app style\n- Clear step-by-step exercise demonstration frames\n- Show an athletic adult person demonstrating proper form\n- Include readable UI cards for reps, RIR, tempo, rest, tier, and muscle chips\n- Use red accents for muscle chips, blue for tempo, green for rest, yellow for RIR\n- Add simple visual arrows showing movement direction\n- Include practical form cues at the bottom\n- Clean, realistic, instructional, safe, non-sexual, no brand logos\n- Text should be large and readable on a phone screen\n- Match the style of a polished workout coaching app`;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is missing. Add it to your environment variables.' },
      { status: 500 }
    );
  }

  let body: WorkoutImageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.exercise?.id || !body.exercise?.name) {
    return NextResponse.json({ error: 'Missing exercise details.' }, { status: 400 });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
        prompt: buildWorkoutImagePrompt(body),
        size: '1536x1024',
        quality: 'medium',
        n: 1,
        output_format: 'png',
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? 'Image generation failed.' },
        { status: openaiRes.status }
      );
    }

    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: 'No image returned from OpenAI.' }, { status: 502 });
    }

    return NextResponse.json(
      { imageUrl: `data:image/png;base64,${b64}` },
      { headers: { 'Cache-Control': 'private, max-age=604800' } }
    );
  } catch (error) {
    console.error('Workout image generation error:', error);
    return NextResponse.json({ error: 'Unable to generate workout image.' }, { status: 500 });
  }
}
