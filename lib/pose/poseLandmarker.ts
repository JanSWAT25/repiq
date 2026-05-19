// lib/pose/poseLandmarker.ts
// MediaPipe Tasks-Vision PoseLandmarker singleton
// Uses Lite model on iOS (performance), Full on desktop

let landmarker: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export async function getPoseLandmarker(): Promise<any> {
  if (landmarker) return landmarker;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      const { PoseLandmarker, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const modelSize = isIOS() ? 'lite' : 'full';
      const modelUrl = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${modelSize}/float16/1/pose_landmarker_${modelSize}.task`;

      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelUrl,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });

      loading = false;
      return landmarker;
    } catch (err) {
      loading = false;
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

export function disposeLandmarker(): void {
  if (landmarker) {
    try { landmarker.close(); } catch {}
    landmarker = null;
    loadPromise = null;
  }
}

// Landmark indices for reference
export const LM = {
  NOSE: 0,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13,    R_ELBOW: 14,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_KNEE: 25,     R_KNEE: 26,
  L_ANKLE: 27,    R_ANKLE: 28,
} as const;
