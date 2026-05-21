'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getMoveNetDetector, keypointsToLandmarks, KP } from '@/lib/pose/moveNet';
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
  ctx.strokeStyle = 'rgba(239,68,68,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [a, b] of connections) {
    const kpA = keypoints[a], kpB = keypoints[b];
    if (!kpA || !kpB || (kpA.score ?? 0) < 0.3 || (kpB.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo((kpA.x / 192) * w, (kpA.y / 192) * h);
    ctx.lineTo((kpB.x / 192) * w, (kpB.y / 192) * h);
    ctx.stroke();
  }
  for (const kp of keypoints) {
    if (!kp || (kp.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.arc((kp.x / 192) * w, (kp.y / 192) * h, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function PoseCamera({
  exerciseId, tempo, targetReps,
  onRepCounted, onFormScore, onError,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number | null>(null);
  const inferringRef = useRef(false);
  const trackerRef = useRef<ReturnType<typeof createTrackerForExercise>>(null);
  const repCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const alignFramesRef = useRef(0);
  const eccentricTimesRef = useRef<number[]>([]);
  const repDurationsRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef(0);

  const [phase, setPhase] = useState<'idle' | 'live' | 'error'>('idle');
  const [modelReady, setModelReady] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [bodyVisible, setBodyVisible] = useState(false);

  // Pose analysis loop — runs every ~100ms via rAF throttle
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || inferringRef.current) return;
    inferringRef.current = true;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const det = await getMoveNetDetector();
      const poses = await det.estimatePoses(video);
      if (!poses?.[0]?.keypoints) { setBodyVisible(false); return; }
      const kps = poses[0].keypoints;
      drawSkeleton(ctx, kps, canvas.width, canvas.height);
      setBodyVisible(kps.filter((k: any) => (k.score ?? 0) > 0.4).length >= 10);
      const lm = keypointsToLandmarks(kps);
      frameCountRef.current++;
      if (trackerRef.current) {
        const { tracker } = trackerRef.current as any;
        const ev = tracker.update(lm, performance.now());
        ev.formIssue ? setFormIssue(ev.formIssue) : (setFormIssue(null), alignFramesRef.current++);
        if (ev.event === 'rep') {
          const n = ev.count ?? repCountRef.current + 1;
          repCountRef.current = n;
          setRepCount(n);
          onRepCounted(n);
          if (lastRepTimeRef.current > 0) repDurationsRef.current.push(performance.now() - lastRepTimeRef.current);
          lastRepTimeRef.current = performance.now();
          if (tracker.getStats) eccentricTimesRef.current = tracker.getStats().eccentricTimes ?? [];
          onFormScore(calcFormScore({
            totalReps: n, repsAtDepth: n,
            totalFrames: frameCountRef.current, framesInAlignment: alignFramesRef.current,
            eccentricTimes: eccentricTimesRef.current,
            targetEccentricMs: tempoToEccentricMs(tempo),
            repDurations: repDurationsRef.current,
          }));
        }
      }
    } catch { /* ignore frame errors */ }
    finally { inferringRef.current = false; }
  }, [exerciseId, tempo, onRepCounted, onFormScore]);

  // Start camera — mirrors the facial app pattern exactly
  const startCamera = useCallback(async () => {
    try {
      // 1. Get stream — same as facial app
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;

      // 2. Attach to video element immediately — same as facial app
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.play();

      // 3. Show live feed right away
      setPhase('live');

      // 4. Start MediaRecorder for frame timing — same mimeType logic as facial app
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      try {
        const mr = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mr;
        // Use ondataavailable as frame tick — fires every 100ms
        mr.ondataavailable = () => {
          if (!inferringRef.current) processFrame();
        };
        mr.start(100); // 100ms intervals = 10fps pose analysis
      } catch {
        // Fallback: rAF loop if MediaRecorder fails (iOS Safari)
        let last = 0;
        const loop = (ts: number) => {
          rafRef.current = requestAnimationFrame(loop);
          if (ts - last >= 100) { last = ts; processFrame(); }
        };
        rafRef.current = requestAnimationFrame(loop);
      }

      // 5. Load MoveNet model in background (doesn't block camera view)
      getMoveNetDetector().then(() => {
        trackerRef.current = createTrackerForExercise(exerciseId);
        setModelReady(true);
      }).catch(() => {
        // Model failed — camera still works, no pose overlay
        setModelReady(false);
      });

    } catch (err: any) {
      setPhase('error');
      onError(err.message ?? 'Camera access denied');
    }
  }, [exerciseId, processFrame, onError]);

  // Cleanup
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  // ── Idle: show enable button ──────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="text-sm text-neutral-400 text-center px-4">
          Auto-count reps using your camera.
        </p>
        <p className="text-xs text-neutral-500 text-center">
          📱 Side view · 6–10 ft away · Good lighting
        </p>
        <button
          onClick={startCamera}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          📷 Enable Camera
        </button>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-6 px-4">
        <p className="text-red-400 text-sm text-center">
          Camera unavailable — use manual counting below.
        </p>
        <button onClick={startCamera} className="text-xs text-neutral-400 underline">
          Try again
        </button>
      </div>
    );
  }

  // ── Live feed ─────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {/* Live video — same attributes as facial app */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Pose skeleton overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Model loading indicator */}
        {!modelReady && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <div className="bg-black/70 rounded-full px-3 py-1 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-yellow-300">Loading pose model...</span>
            </div>
          </div>
        )}

        {/* Tracking status */}
        {modelReady && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${bodyVisible ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-full">
              {bodyVisible ? 'Tracking ✓' : 'Adjust position'}
            </span>
          </div>
        )}

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

      {/* No tracker for this exercise */}
      {modelReady && !trackerRef.current && (
        <p className="text-xs text-neutral-500 text-center mt-2">
          Auto-counting not available for this exercise — count manually below.
        </p>
      )}
    </div>
  );
}
