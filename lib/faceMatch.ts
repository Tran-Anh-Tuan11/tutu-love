// Ngưỡng khoảng cách Euclidean chuẩn của face-api.js (128-d descriptor).
export const FACE_MATCH_THRESHOLD = 0.5;

export function faceDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function isFaceMatch(a: number[], b: number[]): boolean {
  return a.length === b.length && faceDistance(a, b) <= FACE_MATCH_THRESHOLD;
}
