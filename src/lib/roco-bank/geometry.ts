// Measured geometry (references/VIDEO_FORENSICS.md §4). Units:
//   stage px  — the 1600×1200 presentation frame (video pixels)
//   canvas px — the 1440×1024 inset web canvas whose origin is stage (80, 88)
// At the reference capture (1600×1200 viewport, DPR 1) 1 stage px == 1 CSS px.

export type Rect = { x: number; y: number; w: number; h: number };

export const STAGE = { w: 1600, h: 1200 } as const;
export const CANVAS: Rect = { x: 80, y: 88, w: 1440, h: 1024 };
export const CANVAS_RADIUS = 4;
/** Zoom origin of the intro page zoom (stage px). */
export const ZOOM_ORIGIN = { x: 800, y: 600 } as const;

/** Convert a stage-px rect to canvas px. */
export const toCanvas = (r: Rect): Rect => ({ x: r.x - CANVAS.x, y: r.y - CANVAS.y, w: r.w, h: r.h });

// ---------------------------------------------------------------- header (stage px)
export const HEADER = {
  logoMark: { x: 138, y: 137, w: 36, h: 40 },
  wordmark: { x: 191, capTop: 150, baseline: 164 },
  wallet: { x: 1260, y: 136, w: 91, h: 40 },
  register: { x: 1359, y: 136, w: 105, h: 40 },
} as const;

// ---------------------------------------------------------------- hero (canvas px)
export const HERO = {
  arrowUp: { x: 96, y: 357, w: 17, h: 18 },
  arrowDown: { x: 112, y: 394, w: 16, h: 17 },
  eyebrow: { x: 96, capTop: 459, width: 200 },
  headline: { x: 96, line1Baseline: 553, line2Baseline: 622 },
  paragraph: { x: 97, firstCapTop: 662, linePitch: 24 },
  ctaBuy: { x: 96, y: 788, w: 132, h: 32 },
  ctaDiscover: { x: 236, y: 788, w: 132, h: 32 },
  divider: { x: 96, y: 867, w: 752, h: 2 },
  logoStrip: { x: -20, y: 902, w: 880, h: 50, pitch: 147.5 },
  decoText: { x: 1275, w: 100 },
} as const;

export type PillId = "walentyna" | "slawomira" | "haleema" | "patrick" | "brandon";
/** Social-proof pills (canvas px). */
export const PILLS: Record<PillId, Rect> = {
  walentyna: { x: 1022, y: 768, w: 248, h: 56 },
  slawomira: { x: 905, y: 841, w: 237, h: 56 },
  haleema: { x: 1149, y: 841, w: 236, h: 56 },
  patrick: { x: 946, y: 913, w: 220, h: 56 },
  brandon: { x: 1172, y: 913, w: 172, h: 56 },
};

// ---------------------------------------------------------------- cards (stage px)
export const CARD = { w: 440, h: 272, radius: 18 } as const;
export type CardId = "orange" | "green" | "black" | "brown";
/** z-order bottom → top */
export const CARD_STACK: CardId[] = ["brown", "black", "green", "orange"];

// ---------------------------------------------------------------- bento (canvas px)
export type TileId = "credit" | "trust" | "customers" | "ai" | "easy" | "payment" | "invested";
const c = (x: number, y: number, w: number, h: number): Rect => ({ x: x - CANVAS.x, y: y - CANVAS.y, w, h });
export const BENTO_A: Record<TileId, Rect> = {
  credit: c(176, 240, 358, 224),
  trust: c(176, 488, 358, 544),
  customers: c(558, 240, 866, 312),
  ai: c(558, 576, 358, 168),
  easy: c(940, 576, 484, 168),
  payment: c(558, 766, 484, 266),
  invested: c(1066, 766, 358, 266),
};
export const BENTO_B: Record<TileId, Rect> = {
  credit: c(176, 240, 358, 424),
  trust: c(176, 688, 358, 344),
  customers: c(558, 240, 866, 312),
  ai: c(558, 576, 458, 168),
  easy: c(1040, 576, 384, 168),
  payment: c(558, 766, 334, 266),
  invested: c(916, 766, 508, 266),
};
export const TILE_RADIUS = 20;
export type MorphGroup = "bottom" | "middle" | "left";
export const TILE_GROUP: Record<TileId, MorphGroup | null> = {
  credit: "left",
  trust: "left",
  customers: null,
  ai: "middle",
  easy: "middle",
  payment: "bottom",
  invested: "bottom",
};
/** Tile artwork rectangles (canvas px), fixed in page space — public/sites/roco-bank/bento/art.json */
export const TILE_ART: Record<TileId, Rect> = {
  credit: { x: 96, y: 152, w: 358, h: 424 },
  trust: { x: 96, y: 400, w: 358, h: 544 },
  customers: { x: 478, y: 152, w: 866, h: 312 },
  ai: { x: 478, y: 488, w: 458, h: 168 },
  easy: { x: 860, y: 488, w: 484, h: 168 },
  payment: { x: 478, y: 678, w: 484, h: 266 },
  invested: { x: 836, y: 678, w: 508, h: 266 },
};
/** State-B backing colour under the 50 % artwork fade (forensics 7.6). */
export const TILE_BACKING: Record<TileId, string> = {
  credit: "#363636",
  trust: "#131313",
  customers: "#111111",
  ai: "#383838",
  easy: "#2e2e2e",
  payment: "#0e0e0e",
  invested: "#111111",
};
/** Bento entrance scale origin, as a fraction of the tile box (forensics 7.5). */
export const TILE_ENTRANCE_ORIGIN: Record<TileId, [number, number]> = {
  credit: [0.5, 0.98],
  trust: [0.5, 0.5],
  customers: [0.5, 0.5],
  ai: [0.642, 0.5],
  easy: [0.5, 0.5],
  payment: [0.5, 0.5],
  invested: [0.5, 0.5],
};

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
});
