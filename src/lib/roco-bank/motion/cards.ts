import type { CardId } from "../geometry";
import { clamp01, cubicBezier, type Ease } from "./easing";
import { INTRO_START } from "./hero";
import { cardFits, cardPoster, cardRest, orangeFocus, type CardPose } from "./measured";

// Hero card choreography: per-card, per-property cubic-bezier tweens fitted to 1,100+ SIFT
// poses and an analysis-by-synthesis fit of the defocused first frames (rms ≤ 0.6 px, ≤ 0.4°).

type Prop = "cx" | "cy" | "rot" | "scale";
const PROPS: Prop[] = ["cx", "cy", "rot", "scale"];

type Fit = { from: number; to: number; start: number; duration: number; bezier: readonly number[] };
const ease = new Map<string, Ease>();
const easeFor = (id: CardId, p: Prop) => {
  const k = `${id}.${p}`;
  let e = ease.get(k);
  if (!e) {
    const b = (cardFits[id][p] as Fit).bezier;
    e = cubicBezier(b[0], b[1], b[2], b[3]);
    ease.set(k, e);
  }
  return e;
};

export type CardState = CardPose & { blur: number; opacity: number };

export function cardPose(id: CardId, t: number): CardState {
  if (t < INTRO_START) {
    const p = cardPoster[id];
    return { ...p, blur: 0, opacity: 1 };
  }
  const out = { blur: 0, opacity: 1 } as CardState;
  for (const p of PROPS) {
    const f = cardFits[id][p] as Fit;
    const u = clamp01((t - f.start) / f.duration);
    out[p] = f.to + (f.from - f.to) * (1 - easeFor(id, p)(u));
  }
  if (id === "orange") Object.assign(out, orangeFocusAt(t));
  return out;
}

/** depth-of-field pull of the top card (f002–f018), linear between measured frames */
function orangeFocusAt(t: number): { blur: number; opacity: number } {
  const rows = orangeFocus;
  if (t >= rows[rows.length - 1].t + 1 / 30) return { blur: 0, opacity: 1 };
  if (t <= rows[0].t) return { blur: rows[0].blur, opacity: rows[0].opacity };
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i];
    const b = rows[i + 1];
    if (t >= a.t && t <= b.t) {
      const p = (t - a.t) / (b.t - a.t);
      return { blur: a.blur + (b.blur - a.blur) * p, opacity: a.opacity + (b.opacity - a.opacity) * p };
    }
  }
  const last = rows[rows.length - 1];
  const p = clamp01((t - last.t) * 30);
  return { blur: last.blur * (1 - p), opacity: last.opacity + (1 - last.opacity) * p };
}

export const CARD_REST = cardRest;

// ------------------------------------------------------------------ received cast shadows
// Measured on the rest frame against a shadow-free intro frame (green under orange): darkness
// α·Φ((31 − d)/28) with α ≈ 0.77, ≈31 px spread beyond the upper card, σ ≈ 28 px, +4 px down.
// Its strength grows as the cards settle in depth: (1 − Δscale/0.15)^0.8 (f040 → 0, rest → 1).
// The white page receives no shadow at rest (sampled 255 next to every card edge).

/** [lower, upper] pairs: each card receives the shadow of every card above it */
export const SHADOW_PAIRS: [CardId, CardId][] = [
  ["green", "orange"],
  ["black", "orange"],
  ["black", "green"],
  ["brown", "orange"],
  ["brown", "green"],
  ["brown", "black"],
];
export const SHADOW_SPREAD = 31;
const SHADOW_SIGMA = 28;
const SHADOW_ALPHA = 0.77;
const SHADOW_DY = 4;
const CW = 440;
const CH = 272;

/** pose of the upper card's (spread) shadow in the lower card's local, untransformed box */
export function receivedShadow(lower: CardState, upper: CardState) {
  const a = (-lower.rot * Math.PI) / 180;
  const dx = upper.cx - lower.cx;
  const dy = upper.cy - lower.cy + SHADOW_DY;
  const tx = (Math.cos(a) * dx - Math.sin(a) * dy) / lower.scale;
  const ty = (Math.sin(a) * dx + Math.cos(a) * dy) / lower.scale;
  const ds = Math.abs(upper.scale - lower.scale);
  const depth = Math.pow(Math.max(0, 1 - ds / 0.15), 0.8);
  return {
    tx,
    ty,
    rot: upper.rot - lower.rot,
    scale: upper.scale / lower.scale,
    blur: SHADOW_SIGMA / lower.scale,
    opacity: SHADOW_ALPHA * depth * Math.min(upper.opacity, lower.opacity),
    w: CW + 2 * SHADOW_SPREAD,
    h: CH + 2 * SHADOW_SPREAD,
  };
}
