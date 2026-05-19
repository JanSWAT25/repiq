// lib/pose/angles.ts
// Works with both MediaPipe landmarks and MoveNet keypoints

export interface Point2D {
  x: number;
  y: number;
  visibility?: number;
}

// Interior angle at vertex b, in degrees (0–180)
export function angle3pt(a: Point2D, b: Point2D, c: Point2D): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(radians * (180 / Math.PI));
  if (deg > 180) deg = 360 - deg;
  return deg;
}

export function avgAngle(
  lm: Point2D[],
  lA: number, lB: number, lC: number,
  rA: number, rB: number, rC: number
): number {
  const left = angle3pt(lm[lA], lm[lB], lm[lC]);
  const right = angle3pt(lm[rA], lm[rB], lm[rC]);
  return (left + right) / 2;
}

export function landmarksVisible(
  lm: Point2D[],
  indices: number[],
  minVisibility = 0.3
): boolean {
  return indices.every(
    (i) => lm[i] && (lm[i].visibility ?? 1) >= minVisibility
  );
}

export function verticalDiff(a: Point2D, b: Point2D): number {
  return b.y - a.y;
}
