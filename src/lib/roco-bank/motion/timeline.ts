import { HERO_COPY, PARTNERS } from "../content";
import { BENTO_A, CANVAS, CARD, CARD_STACK, TILE_ART, type CardId, type MorphGroup, type TileId } from "../geometry";
import { CARD_PARALLAX, pageScroll, tileFrame } from "./bento";
import { cardPose, receivedShadow, SHADOW_PAIRS } from "./cards";
import {
  arrowsEntrance,
  dividerScale,
  eyebrowChar,
  headerEntrance,
  headlineLine,
  headlineWord,
  INTRO_START,
  logoStripOpacity,
  MARQUEE_LOOP,
  MARQUEE_PITCH,
  marqueeItem0,
  pageZoom,
  paragraphLine,
} from "./hero";

/** Length of the reference film. */
export const REPLAY_DURATION = 9.8;

/** Named segments (seconds). The replay is one deterministic function of time; each segment's
 *  constants live in hero.ts / cards.ts / bento.ts and can be offset independently. */
export const SEGMENTS = {
  poster: [0, INTRO_START],
  heroCardsEntrance: [INTRO_START, 2.8],
  heroCopyReveal: [INTRO_START, 1.6],
  logoStripReveal: [1.05, 2.33],
  sceneTransition: [3.5, 4.991],
  bentoEntrance: [3.586, 5.461],
  bentoMorphAB: [5.473, 6.758],
  bentoMorphBA: [7.303, 8.854],
} as const;

export type Style = {
  transform?: string;
  opacity?: number;
  filter?: string;
  clipPath?: string;
  color?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  visibility?: "visible" | "hidden";
};
export type SceneState = Record<string, Style>;

export type Clocks = {
  /** replay time (s) — drives everything not overridden below */
  t: number;
  /** hero intro clock (interactive mode: time since load, the intro plays once) */
  heroT?: number;
  /** transition clock: page scroll + bento entrance (interactive mode: mapped from scroll position) */
  scrollT?: number;
  /** partner marquee clock (keeps running in interactive mode) */
  marqueeT?: number;
  /** morph progress per group (interactive mode: hover / focus on the Customers tile) */
  morph?: Partial<Record<MorphGroup, number>>;
  /** full-screen mode: frame height in canvas px (the scroll covers one frame height) */
  frameH?: number;
};

const blurF = (b: number) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none");
const r2 = (v: number) => Math.round(v * 100) / 100;
const ty = (v: number) => `translate3d(0, ${r2(v)}px, 0)`;

export function evaluate(clocks: Clocks): SceneState {
  const { t } = clocks;
  const heroT = clocks.heroT ?? t;
  const scrollT = clocks.scrollT ?? t;
  const marqueeT = clocks.marqueeT ?? t;
  // the poster frames (t < f002) show the rested hero
  const rested = heroT < INTRO_START;
  const h = rested ? 99 : heroT;
  const s: SceneState = {};

  // --------------------------------------------------------------- page
  s.zoom = { transform: `scale(${pageZoom(heroT).toFixed(5)})` };
  const FH = clocks.frameH ?? CANVAS.h;
  const S = pageScroll(scrollT) * (FH / CANVAS.h);
  s.heroScroll = { transform: ty(-S) };
  s.dark = { transform: ty(FH - S), visibility: S > 0.01 ? "visible" : "hidden" };
  s.cardsLayer = { transform: ty(-CARD_PARALLAX * S) };

  // --------------------------------------------------------------- header (fixed; per-pixel split on the dark edge)
  const he = headerEntrance(h);
  const darkTop = FH - S;
  s.headerInner = { transform: ty(he.dy), opacity: r2(he.opacity), filter: blurF(he.blur) };
  s.headerDarkInner = s.headerInner;
  s.headerLight = { clipPath: `inset(0px 0px ${r2(Math.max(0, FH - darkTop))}px 0px)` };
  s.headerDark = { clipPath: `inset(${r2(Math.min(FH, darkTop))}px 0px 0px 0px)` };

  // --------------------------------------------------------------- hero copy
  const ar = arrowsEntrance(h);
  s.arrowUp = { transform: ty(ar.up.dy), opacity: r2(ar.up.opacity) };
  s.arrowDown = { transform: ty(ar.down.dy), opacity: r2(ar.down.opacity) };
  for (let i = 0; i < HERO_COPY.eyebrow.length; i++) {
    const c = eyebrowChar(h, i);
    s[`eyebrow.${i}`] = { opacity: r2(c.opacity), filter: blurF(c.blur) };
  }
  for (const line of [1, 2] as const) {
    const e = headlineLine(h, line);
    s[`headline.${line}`] = { transform: ty(e.dy), filter: blurF(e.blur) };
  }
  HERO_COPY.headline.forEach((_, i) => {
    const w = headlineWord(h, i);
    s[`word.${i}`] = { color: w.ink, opacity: w.word };
    s[`ph.${i}`] = { color: w.ink, opacity: r2(w.placeholder) };
  });
  HERO_COPY.paragraph.forEach((_, i) => {
    const e = paragraphLine(h, i);
    s[`para.${i}`] = { transform: ty(e.dy), opacity: r2(e.opacity), filter: blurF(e.blur) };
  });
  s.divider = { transform: `scaleX(${dividerScale(h).toFixed(4)})` };
  s.logoStrip = { opacity: r2(logoStripOpacity(h)) };
  const x0 = marqueeItem0(rested ? 0 : marqueeT);
  PARTNERS.forEach((_, i) => {
    // slot centres wrap so items re-enter from the left (content travels right)
    let x = (x0 + i * MARQUEE_PITCH) % MARQUEE_LOOP;
    if (x < -2 * MARQUEE_PITCH) x += MARQUEE_LOOP;
    if (x >= MARQUEE_LOOP - 2 * MARQUEE_PITCH) x -= MARQUEE_LOOP;
    s[`partner.${i}`] = { transform: `translate3d(${r2(x - MARQUEE_PITCH / 2)}px, 0, 0)` };
  });

  // --------------------------------------------------------------- hero cards (stage px)
  const poses = Object.fromEntries(CARD_STACK.map((id) => [id, cardPose(id, heroT)])) as Record<CardId, ReturnType<typeof cardPose>>;
  for (const id of CARD_STACK) {
    const p = poses[id];
    s[`card.${id}`] = {
      transform: `translate3d(${r2(p.cx - CARD.w / 2)}px, ${r2(p.cy - CARD.h / 2)}px, 0) rotate(${p.rot.toFixed(3)}deg) scale(${p.scale.toFixed(4)})`,
      opacity: r2(p.opacity),
      filter: blurF(p.blur),
    };
  }
  // cast shadows received by lower cards (clipped to the receiving card, never on the page)
  for (const [lower, upper] of SHADOW_PAIRS) {
    const sh = receivedShadow(poses[lower], poses[upper]);
    s[`shadow.${lower}.${upper}`] = {
      transform: `translate3d(${r2(sh.tx)}px, ${r2(sh.ty)}px, 0) rotate(${sh.rot.toFixed(3)}deg) scale(${sh.scale.toFixed(4)})`,
      filter: `blur(${sh.blur.toFixed(2)}px)`,
      opacity: r2(sh.opacity),
    };
  }

  // --------------------------------------------------------------- bento (canvas px, inside the dark section)
  (Object.keys(BENTO_A) as TileId[]).forEach((id) => {
    const fr = tileFrame(id, t, clocks.morph);
    const scale = tileFrame(id, scrollT).scale;
    const { rect } = fr;
    s[`tile.${id}`] = {
      left: r2(rect.x),
      top: r2(rect.y),
      width: r2(rect.w),
      height: r2(rect.h),
      transform: scale >= 0.9999 ? "none" : `scale(${scale.toFixed(4)})`,
      visibility: scale > 0.002 ? "visible" : "hidden",
    };
    const art = TILE_ART[id];
    s[`tile.${id}.art`] = { transform: `translate3d(${r2(art.x - rect.x)}px, ${r2(art.y - rect.y)}px, 0)` };
    s[`tile.${id}.dim`] = { opacity: r2(fr.dim) };
    const shift = id === "credit" ? [0, 98 * fr.p] : id === "payment" ? [-28 * fr.p, 0] : [0, 0];
    s[`tile.${id}.text`] = { transform: `translate3d(${r2(shift[0])}px, ${r2(shift[1])}px, 0)` };
  });

  return s;
}
