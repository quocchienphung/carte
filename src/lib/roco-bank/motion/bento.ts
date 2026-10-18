import {
  BENTO_A,
  BENTO_B,
  TILE_GROUP,
  lerpRect,
  type MorphGroup,
  type Rect,
  type TileId,
} from "../geometry";
import { clamp01, cubicBezier, powerOut } from "./easing";
import { morphAtoB, morphBtoA, scroll, tileEntrance } from "./measured";

// Scene transition (§7.4), bento entrance (§7.5) and the measured A↔B morph (§7.6).

const scrollEase = cubicBezier(...(scroll.bezier as unknown as [number, number, number, number]));
/** page scroll S(t) in canvas px: 0 → 1024 between 3.500 s and 4.991 s */
export const pageScroll = (t: number) => scroll.distance * scrollEase(clamp01((t - scroll.start) / scroll.duration));
export const CARD_PARALLAX = scroll.card_parallax_factor;
export const SCROLL_WINDOW = { start: scroll.start, end: scroll.start + scroll.duration } as const;

/** tile entrance scale (0 → 1), power-out fits per tile */
export const tileScale = (id: TileId, t: number) => {
  const [start, dur, pw] = tileEntrance[id] as readonly number[];
  return powerOut(pw)(clamp01((t - start) / dur));
};

const abEase = cubicBezier(...(morphAtoB.bezier as unknown as [number, number, number, number]));
const baEase = cubicBezier(...(morphBtoA.bezier as unknown as [number, number, number, number]));

/** replay morph progress of a group (0 = layout A, 1 = layout B; B→A overshoots ≈2 px) */
export function groupProgress(group: MorphGroup, t: number): number {
  const sAB = morphAtoB.starts[group];
  const sBA = morphBtoA.starts[group];
  if (t < sAB) return 0;
  if (t < sBA) return abEase(clamp01((t - sAB) / morphAtoB.duration));
  return 1 - baEase(clamp01((t - sBA) / morphBtoA.duration));
}

/** interactive morph: same per-group curves and stagger, driven by a local clock τ (s since trigger) */
export function groupProgressInteractive(group: MorphGroup, tau: number, towardsB: boolean, from: number): number {
  const stagger = towardsB ? morphAtoB.starts[group] - morphAtoB.starts.bottom : morphBtoA.starts[group] - morphBtoA.starts.bottom;
  const dur = towardsB ? morphAtoB.duration : morphBtoA.duration;
  const u = clamp01((tau - stagger) / dur);
  const e = towardsB ? abEase(u) : baEase(u);
  return towardsB ? from + (1 - from) * e : from * (1 - e);
}

export type TileFrame = {
  rect: Rect;
  /** morph progress of the tile's group */
  p: number;
  scale: number;
};

export function tileFrame(id: TileId, t: number, progressOverride?: Partial<Record<MorphGroup, number>>): TileFrame {
  const g = TILE_GROUP[id];
  const p = g ? (progressOverride?.[g] ?? groupProgress(g, t)) : 0;
  return { rect: lerpRect(BENTO_A[id], BENTO_B[id], p), p, scale: tileScale(id, t) };
}
