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

// Draw skeleton overlay
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

  // Draw connections
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [a, b] of connections) {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || !kpB || (kpA.score ?? 0) < 0.3 || (kpB.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo((kpA.x / 192) * w, (kpA.y / 192) * h);
    ctx.lineTo((kpB.x / 192) * w, (kpB.y / 192) * h);
    ctx.stroke();
  }

  // Draw keypoints
  for (const kp of keypoints) {
    if (!kp || (kp.score ?? 0) < 0.3) continue;
    ctx.beginPath();
    ctx.arc((kp.x / 192) * w, (kp.y / 192) * h, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
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
  const frameProcessorRef = useRef<number | null>(null);
  const inferringRef = useRef(false);
  const trackerRef = useRef<ReturnType<typeof createTrackerForExercise>>(null);
  const repCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const alignFramesRef = useRef(0);
  const eccentricTimesRef = useRef<number[]>([]);
  const repDurationsRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef(0);
  const isRecordingRef = useRef(false);

  const [status, setStatus] = useState<'idle' | 'requesting' | 'ready' | 'error'>('idle');
  const [repCount, setRepCount] = useState(0);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [bodyVisible, setBodyVisible] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Starting camera...');
  const [isRecording, setIsRecording] = useState(false);

  // Process a single frame from the video
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

      if (!poses?.[0]?.keypoints) {
        setBodyVisible(false);
        inferringRef.current = false;
        return;
      }

      const keypoints = poses[0].keypoints;
      drawSkeleton(ctx, keypoints, canvas.width, canvas.height);

      const visible = keypoints.filter((kp: any) => (kp.score ?? 0) > 0.4).length;
      setBodyVisible(visible >= 10);

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
    } catch (e) {
      // silently ignore frame errors
    } finally {
      inferringRef.current = false;
    }
  }, [exerciseId, tempo, onRepCounted, onFormScore]);

  // Start pose analysis loop using MediaRecorder timestamps
  const startPoseLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use MediaRecorder to get reliable frame timing
    if (streamRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        const mr = new MediaRecorder(streamRef.current, {
          mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm',
        });

        mr.ondataavailable = () => {
          // Each data chunk = new frames available → trigger pose analysis
          if (!inferringRef.current) {
            processFrame();
          }
        };

        // Request data every 100ms (≈10fps for pose analysis — sufficient for rep counting)
        mr.start(100);
        mediaRecorderRef.current = mr;
        isRecordingRef.current = true;
        setIsRecording(true);
      } catch (e) {
        // MediaRecorder failed, fall back to requestAnimationFrame
        console.warn('[PoseCamera] MediaRecorder failed, falling back to rAF');
        startRAFLoop();
      }
    } else {
      startRAFLoop();
    }
  }, [processFrame]);

  // Fallback rAF loop (iOS Safari where MediaRecorder may not support video)
  const startRAFLoop = useCallback(() => {
    let lastFrameTime = 0;
    const TARGET_INTERVAL = 100; // 10fps

    function loop(ts: number) {
      frameProcessorRef.current = requestAnimationFrame(loop);
      if (ts - lastFrameTime >= TARGET_INTERVAL) {
        lastFrameTime = ts;
        processFrame();
      }
    }
    frameProcessorRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setLoadingMsg('Starting camera...');

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

      await new Promise<void>((resolve, reject) => {
        const v = videoRef.current!;
        v.onloadeddata = () => resolve();
        setTimeout(() => reject(new Error('Video load timeout')), 10000);
      });

      setLoadingMsg('Loading MoveNet (~2MB)...');

      await Promise.race([
        getMoveNetDetector(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model timeout')), 15000)
        ),
      ]);

      trackerRef.current = createTrackerForExercise(exerciseId);
      setStatus('ready');
      startPoseLoop();
    } catch (err: any) {
      console.error('[PoseCamera]', err);
      setStatus('error');
      onError(err.message ?? 'Camera failed');
    }
  }, [exerciseId, startPoseLoop, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (frameProcessorRef.current) {
      cancelAnimationFrame(frameProcessorRef.current);
      frameProcessorRef.current = null;
    }
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [stopRecording]);

  // ── Render: idle ──────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="text-sm text-neutral-400 text-center px-4">
          Auto-count reps using your camera.
        </p>
        <div className="flex flex-col gap-1 text-xs text-neutral-500 text-center">
          <span>📱 Side view · 6–10 ft away · Good lighting</span>
          <span className="text-green-500">⚡ MoveNet model — fast loading</span>
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

  // ── Render: loading ───────────────────────────────────────────────────────
  if (status === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
        <p className="text-sm text-neutral-400">{loadingMsg}</p>
        <p className="text-xs text-neutral-600">Usually ready in 3–5 seconds</p>
        <button
          onClick={() => { setStatus('error'); onError('Cancelled'); }}
          className="text-xs text-neutral-500 underline mt-2"
        >
          Cancel — use manual counting
        </button>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
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

  // ── Render: active ────────────────────────────────────────────────────────
  return (
    <div className="relative w-full">
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

        {/* Status */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${bodyVisible ? 'bg-green-400' : 'bg-yellow-400'} ${isRecording ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-full">
            {bodyVisible ? 'Tracking ✓' : 'Adjust position'}
          </span>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 right-12 flex items-center gap-1 bg-red-600/80 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs text-white font-bold">REC</span>
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

      {/* Controls */}
      <div className="flex gap-2 mt-2">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-900/30 border border-red-800 text-red-300"
          >
            ⏹ Pause Analysis
          </button>
        ) : (
          <button
            onClick={startPoseLoop}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-green-900/30 border border-green-800 text-green-300"
          >
            ▶ Resume Analysis
          </button>
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
