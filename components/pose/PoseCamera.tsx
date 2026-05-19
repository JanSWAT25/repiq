'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getPoseLandmarker, disposeLandmarker } from '@/lib/pose/poseLandmarker';
import { createTrackerForExercise } from '@/lib/pose/exerciseTrackers';
import { calcFormScore, tempoToEccentricMs } from '@/lib/pose/formScore';

interface PoseCameraProps {
  exerciseId: string;
  tempo: string;
  targetReps: number;
  onRepCounted: (reps: number) => void;
  onFormScore: (score: number) => void;
  onError: (msg: string) => void;
}

// Draw skeleton on canvas
function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
  const connections = [
    [11, 13], [13, 15], // L arm
    [12, 14], [14, 16], // R arm
    [11, 12],           // shoulders
    [11, 23], [12, 24], // torso
    [23, 24],           // hips
    [23, 25], [25, 27], // L leg
    [24, 26], [26, 28], // R leg
  ];

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;

  for (const [a, b] of connections) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;
    if ((lmA.visibility ?? 1) < 0.3 || (lmB.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(lmA.x * w, lmA.y * h);
    ctx.lineTo(lmB.x * w, lmB.y * h);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  for (const lm of landmarks) {
    if (!lm || (lm.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export function PoseCamera({
  exerciseId,
  tempo,
  targetReps,
  onRepCounted,
  onFormScore,
  onError,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const inferringRef = useRef(false);
  const trackerRef = useRef<ReturnType<typeof createTrackerForExercise>>(null);
  const repCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const alignFramesRef = useRef(0);
  const eccentricTimesRef = useRef<number[]>([]);
  const repDurationsRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef(0);

  const [status, setStatus] = useState<'idle' | 'requesting' | 'ready' | 'error'>('idle');
  const [repCount, setRepCount] = useState(0);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [allLandmarksVisible, setAllLandmarksVisible] = useState(false);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadeddata = () => resolve();
      });

      await Promise.race([
        getPoseLandmarker(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model load timeout')), 30000)
        ),
      ]);

      // Create tracker for this exercise
      trackerRef.current = createTrackerForExercise(exerciseId);

      setStatus('ready');
      startInference();
    } catch (err: any) {
      setStatus('error');
      onError(err.message ?? 'Camera access denied');
    }
  }, [exerciseId]);

  function startInference() {
    const landmarker = getPoseLandmarker();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function processFrame(timestampMs: number) {
      rafRef.current = requestAnimationFrame(processFrame);

      if (inferringRef.current) return; // skip if previous frame still processing
      if (video!.readyState < 2) return;

      inferringRef.current = true;

      try {
        // Match canvas to video
        canvas!.width = video!.videoWidth;
        canvas!.height = video!.videoHeight;

        // Draw video frame
        ctx!.drawImage(video!, 0, 0);

        // Run pose detection
        landmarker.then((lm: any) => {
          try {
            const result = lm.detectForVideo(video, timestampMs);
            inferringRef.current = false;

            if (!result.landmarks || result.landmarks.length === 0) {
              setAllLandmarksVisible(false);
              return;
            }

            const landmarks = result.landmarks[0];
            const w = canvas!.width;
            const h = canvas!.height;

            // Draw skeleton
            drawSkeleton(ctx!, landmarks, w, h);

            // Check overall visibility
            const visible = landmarks.filter((l: any) => (l.visibility ?? 0) > 0.5).length;
            setAllLandmarksVisible(visible >= 20);

            frameCountRef.current++;

            // Run exercise tracker
            if (trackerRef.current) {
              const { tracker, type } = trackerRef.current as any;
              const event = tracker.update(landmarks, timestampMs);

              if (event.formIssue) {
                setFormIssue(event.formIssue);
              } else {
                setFormIssue(null);
                alignFramesRef.current++;
              }

              if (event.event === 'rep') {
                const newCount = event.count ?? repCountRef.current + 1;
                repCountRef.current = newCount;
                setRepCount(newCount);
                onRepCounted(newCount);

                // Track rep duration for cadence
                if (lastRepTimeRef.current > 0) {
                  repDurationsRef.current.push(timestampMs - lastRepTimeRef.current);
                }
                lastRepTimeRef.current = timestampMs;

                // Collect eccentric times if available
                if (tracker.getStats) {
                  const stats = tracker.getStats();
                  eccentricTimesRef.current = stats.eccentricTimes ?? [];
                }

                // Compute form score
                const score = calcFormScore({
                  totalReps: newCount,
                  repsAtDepth: newCount, // simplified — all reps counted means depth reached
                  totalFrames: frameCountRef.current,
                  framesInAlignment: alignFramesRef.current,
                  eccentricTimes: eccentricTimesRef.current,
                  targetEccentricMs: tempoToEccentricMs(tempo),
                  repDurations: repDurationsRef.current,
                });
                onFormScore(score);
              }
            }
          } catch {
            inferringRef.current = false;
          }
        });
      } catch {
        inferringRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-neutral-400 text-center px-4">
          Use your camera to automatically count reps and score your form.
        </p>
        <div className="text-xs text-neutral-500 text-center px-4 mb-2">
          📱 Place phone 6–10 ft away · Side view · Good lighting
        </div>
        <button
          onClick={startCamera}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          📷 Enable Camera
        </button>
      </div>
    );
  }

  if (status === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
        <p className="text-sm text-neutral-400">Loading pose detection...</p>
        <p className="text-xs text-neutral-600">First load may take 30s</p>
        <button
          onClick={() => setStatus('error')}
          className="text-xs text-neutral-500 underline mt-2"
        >
          Cancel and use manual counting
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 px-4">
        <p className="text-red-400 text-sm text-center">
          Camera unavailable. Use manual rep counting below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Video + canvas overlay */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Ready indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${allLandmarksVisible ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
            {allLandmarksVisible ? 'Tracking' : 'Adjust position'}
          </span>
        </div>

        {/* Rep counter overlay */}
        <div className="absolute top-2 right-2 bg-black/70 rounded-xl px-3 py-2 text-center">
          <div className="text-3xl font-black text-white">{repCount}</div>
          <div className="text-xs text-neutral-400">/ {targetReps}</div>
        </div>

        {/* Form issue */}
        {formIssue && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-900/80 rounded-lg px-3 py-1.5 text-center">
            <p className="text-xs text-red-200">⚠️ {formIssue}</p>
          </div>
        )}
      </div>

      {/* CV not supported message */}
      {!trackerRef.current && status === 'ready' && (
        <p className="text-xs text-neutral-500 text-center mt-2">
          Auto rep counting not available for this exercise. Count manually below.
        </p>
      )}
    </div>
  );
}
