// lib/pose/moveNet.ts
// TensorFlow.js MoveNet — replaces MediaPipe
// Model: ~1.9MB, loads in 2-3s, 30fps on mobile

let detector: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

export async function getMoveNetDetector(): Promise<any> {
  if (detector) return detector;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.ready();
      await tf.setBackend('webgl');

      const poseDetection = await import('@tensorflow-models/pose-detection');

      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          // Lightning = fastest, smallest (~1.9MB)
          // Thunder = more accurate but slower (~12MB)
        }
      );

      loading = false;
      console.log('[MoveNet] Detector ready');
      return detector;
    } catch (err) {
      loading = false;
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

export function disposeDetector(): void {
  if (detector) {
    try { detector.dispose(); } catch {}
    detector = null;
    loadPromise = null;
  }
}

// MoveNet keypoint indices
export const KP = {
  NOSE: 0,
  LEFT_EYE: 1,    RIGHT_EYE: 2,
  LEFT_EAR: 3,    RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,     RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,     RIGHT_WRIST: 10,
  LEFT_HIP: 11,      RIGHT_HIP: 12,
  LEFT_KNEE: 13,     RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,    RIGHT_ANKLE: 16,
} as const;

// Convert MoveNet keypoints to our Point2D format
export function keypointsToLandmarks(keypoints: any[]): Array<{x: number; y: number; visibility: number}> {
  return keypoints.map((kp) => ({
    x: kp.x / 192, // normalize to 0-1 (MoveNet uses pixel coords on 192x192)
    y: kp.y / 192,
    visibility: kp.score ?? 0,
  }));
}
