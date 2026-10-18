// Deterministic easing primitives. Every curve used by the replay is one of these, with
// parameters fitted to the reference video (scripts/forensics/*), never an arbitrary preset.

export type Ease = (u: number) => number;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** CSS-style cubic-bezier(x1, y1, x2, y2) solved for y(x) (Newton + bisection fallback). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sy = (s: number) => ((ay * s + by) * s + cy) * s;
  const dsx = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  return (u: number) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let s = u;
    for (let i = 0; i < 8; i++) {
      const d = sx(s) - u;
      if (Math.abs(d) < 1e-7) return sy(s);
      const dd = dsx(s);
      if (Math.abs(dd) < 1e-6) break;
      s -= d / dd;
    }
    let lo = 0;
    let hi = 1;
    s = u;
    for (let i = 0; i < 40; i++) {
      const v = sx(s);
      if (Math.abs(v - u) < 1e-7) break;
      if (v < u) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return sy(s);
  };
}

/** power-p "out" ease: 1 - (1 - u)^p */
export const powerOut = (p: number): Ease => (u) => 1 - Math.pow(1 - clamp01(u), p);

/** progress of a tween that starts at `start` (s) and lasts `duration` (s), eased */
export const progress = (t: number, start: number, duration: number, ease: Ease = (u) => u) =>
  ease(clamp01((t - start) / duration));

/** value of an "entrance offset" A·(1-u)^p (measured model for rise/blur decays) */
export const decay = (t: number, start: number, duration: number, power: number, amplitude: number) => {
  if (t <= start) return amplitude;
  const u = clamp01((t - start) / duration);
  return amplitude * Math.pow(1 - u, power);
};
