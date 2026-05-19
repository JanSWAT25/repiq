'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getMoveNetDetector, keypointsToLandmarks, KP } from '@/lib/pose/moveNet';
import { createTrackerForExercise } from '@/lib/pose/exerciseTrackers';
import { calcFormScore, tempoToEccentricMs } from '@/lib/pose/formScore';
import { angle3pt } from '@/lib/pose/angles';

interface PoseCameraProps {
  exerciseId: string;
  tempo: string;
  targetReps: number;
  onRepCounted: (reps: number) => void;
  onFormScore: (score: number) => void;
  onError: (msg: string) => void;
}

// Draw MoveNet skeleton on canvas
function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: any[], w: number, h: number) {
  const connections = [
    [KP.LEFT_SHOULDER, KP.LEFT_ELBOW], [KP.LEFT_ELBOW, KP.LEFT_WRIST],
    [KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW], [KP.RIGHT_ELBOW, KP.RIGHT_WRIST],
    [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER],
    [KP.LEFT_SHOULDER, KP.LEFT_HIP], [KP.RIGHT_SHOULDER, KP.RIGHT_HIP],
    [KP.LEFT_HIP, KP.RIGHT_HIP],
    [KP.LEFT_HIP, KP.LEFT_KNEE], [KP.LEFT_KNEE, KP.LEFT_ANKLE],
    [KP.RIGHT_HIP, KP.RIGHT_KNEE], [KP.RIGHT_KNEE, KP.RIGHT_ANKLE],
  ];

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;

  for (const [a, b] of connections) {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || !kpB) continue;
    if ((kpA.score ?? 0) < 0.3 || (kpB.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(kpA.x * w / 192, kpA.y * h / 192);
    ctx.lineTo(kpB.x * w / 192, kpB.y * h / 192);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  for (const kp of keypoints) {
    if (!kp || (kp.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.arc(kp.x * w / 192, kp.y * h / 192, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export function PoseCamera({
  exerciseId, tempo, targetReps,
  onRepCounted, onFormScore, onError,
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
  const [bodyVisible, setBodyVisible] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Starting camera...');

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setLoadingMsg('Starting camera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadeddata = () => resolve();
      });

      setLoadingMsg('Loading MoveNet model (~2MB)...');

      // Load MoveNet with 15s timeout
      await Promise.race([
        getMoveNetDetector(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model load timeout after 15s')), 15000)
        ),
      ]);

      trackerRef.current = createTrackerForExercise(exerciseId);
      setStatus('ready');
      startInference();
    } catch (err: any) {
      console.error('[PoseCamera] Error:', err);
      setStatus('error');
      onError(err.message ?? 'Camera failed');
    }
  }, [exerciseId]);

  function startInference() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    async function processFrame() {
      rafRef.current = requestAnimationFrame(processFrame);
      if (inferringRef.current || video!.readyState < 2) return;
      inferringRef.current = true;

      try {
        canvas!.width = video!.videoWidth;
        canvas!.height = video!.videoHeight;
        ctx!.drawImage(video!, 0, 0);

        const det = await getMoveNetDetector();
        const poses = await det.estimatePoses(video);
        inferringRef.current = false;

        if (!poses || poses.length === 0 || !poses[0].keypoints) {
          setBodyVisible(false);
          return;
        }

        const keypoints = poses[0].keypoints;
        const w = canvas!.width;
        const h = canvas!.height;

        drawSkeleton(ctx!, keypoints, w, h);

        const visible = keypoints.filter((kp: any) => (kp.score ?? 0) > 0.4).length;
        setBodyVisible(visible >= 10);

        // Convert to normalized landmarks for state machines
        const landmarks = keypointsToLandmarks(keypoints);
        frameCountRef.current++;

        if (trackerRef.current) {
          const { tracker } = trackerRef.current as any;
          const event = tracker.update(landmarks, performance.now());

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

            if (lastRepTimeRef.current > 0) {
              repDurationsRef.current.push(performance.now() - lastRepTimeRef.current);
            }
            lastRepTimeRef.current = performance.now();

            if (tracker.getStats) {
              eccentricTimesRef.current = tracker.getStats().eccentricTimes ?? [];
            }

            const score = calcFormScore({
              totalReps: newCount,
              repsAtDepth: newCount,
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
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="text-sm text-neutral-400 text-center px-4">
          Auto-count reps using your camera with MoveNet AI.
        </p>
        <div className="text-xs text-neutral-500 text-center px-4">
          📱 Side view · 6–10 ft away · Good lighting
        </div>
        <div className="text-xs text-green-500 text-center">
          ⚡ Fast loading (~2MB model)
        </div>
        <button onClick={startCamera}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          📷 Enable Camera
        </button>
      </div>
    );
  }

  if (status === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
        <p className="text-sm text-neutral-400">{loadingMsg}</p>
        <p className="text-xs text-neutral-600">Usually ready in 3–5 seconds</p>
        <button onClick={() => { setStatus('error'); onError('Cancelled'); }}
          className="text-xs text-neutral-500 underline mt-2">
          Cancel — use manual counting
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-6 px-4">
        <p className="text-red-400 text-sm text-center">
          Camera unavailable — using manual counting below.
        </p>
        <button onClick={startCamera} className="text-xs text-neutral-400 underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video ref={videoRef} autoPlay muted playsInline
          className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Status dot */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${bodyVisible ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
            {bodyVisible ? 'Tracking ✓' : 'Adjust position'}
          </span>
        </div>

        {/* Rep counter */}
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

      {!trackerRef.current && (
        <p className="text-xs text-neutral-500 text-center mt-2">
          Auto-counting not available for this exercise. Count manually below.
        </p>
      )}
    </div>
  );
}
