import { PARTNERS } from "../content";
import { clamp01, cubicBezier, decay, powerOut, progress } from "./easing";
import { marquee, zoom } from "./measured";

// All constants: references/VIDEO_FORENSICS.md §7.1–7.2, §7.7 (fitted from tracked frames).

/** First frame of the intro after the poster cut (f002). */
export const INTRO_START = 2 / 30;

const zoomEase = cubicBezier(...(zoom.bezier as unknown as [number, number, number, number]));
/** Page zoom (canvas + page content, header excluded), about stage (800, 600). */
export const pageZoom = (t: number) => {
  if (t < INTRO_START) return 1;
  const u = clamp01((t - zoom.start) / zoom.duration);
  return zoom.from + (zoom.to - zoom.from) * zoomEase(u);
};

export type Entrance = { dy: number; opacity: number; blur: number };

/** Header logo: rise 44.7 px, start .217 s, 1.344 s, power 3.82; opacity power 3 over 1.4 s. */
export const headerEntrance = (t: number): Entrance => ({
  dy: decay(t, 0.217, 1.344, 3.82, 44.7),
  opacity: progress(t, 0.22, 1.4, powerOut(3)),
  blur: t < 0.47 ? 2 * (1 - clamp01((t - 0.2) / 0.27)) : 0,
});

export const arrowsEntrance = (t: number) => ({
  up: { dy: decay(t, 0.208, 0.73, 1.86, 8.8), opacity: progress(t, 0, 1.1, powerOut(3)), blur: 0 },
  down: { dy: -decay(t, 0.057, 2.23, 8, 19.4), opacity: progress(t, 0.05, 1.0, powerOut(2.5)), blur: 0 },
});

// ---------------------------------------------------------------- eyebrow typewriter
/** Reveal frame of every character of "CREATE YOUR OWN" (spaces included), measured f002…f032. */
const EYEBROW_FRAMES = [2, 4, 6, 8, 10, 12, 14, 16, 19, 21, 23, 25, 27, 30, 32];
/** opacity of character i: 0.5 on its reveal frame (soft new glyph), 1 one frame later */
export const eyebrowChar = (t: number, i: number) => {
  const tr = EYEBROW_FRAMES[i] / 30;
  if (t < tr - 0.5 / 30) return { opacity: 0, blur: 0 };
  const p = clamp01((t - (tr - 0.5 / 30)) / (1.5 / 30));
  return { opacity: 0.35 + 0.65 * p, blur: (1 - p) * 1.2 };
};

// ---------------------------------------------------------------- headline scramble
/** ink ramp start (s) per word: luminance follows 255·(1-u)^2.4 over 0.8 s (white → black) */
const WORD_INK_START = [0.037, 0.14, 0.27, 0.35, 0.45];
/** glyph swap (asterisks → word) frames f013 f016 f019 f022 f026 */
const WORD_SWAP = [13, 16, 19, 22, 26].map((f) => f / 30);
/** placeholder appearance frames f002 f003 f009 f012 f015 */
const WORD_APPEAR = [2, 3, 9, 12, 15].map((f) => f / 30);

export const headlineWord = (t: number, i: number) => {
  const lum = 255 * Math.pow(1 - clamp01((t - WORD_INK_START[i]) / 0.8), 2.4);
  const appear = clamp01((t - WORD_APPEAR[i] + 1 / 30) / (2 / 30));
  const swapped = t >= WORD_SWAP[i];
  const v = Math.round(lum);
  return { ink: `rgb(${v} ${v} ${v})`, placeholder: swapped ? 0 : appear, word: swapped ? 1 : 0 };
};

/** headline line rise (placeholder phase included) */
export const headlineLine = (t: number, line: 1 | 2): Entrance =>
  line === 1
    ? { dy: decay(t, 0.25, 0.9, 3.2, 23), opacity: 1, blur: t < 0.77 ? 2 * (1 - clamp01((t - 0.43) / 0.34)) : 0 }
    : { dy: decay(t, 0.35, 1.15, 3, 21), opacity: 1, blur: t < 0.97 ? 2 * (1 - clamp01((t - 0.64) / 0.33)) : 0 };

// ---------------------------------------------------------------- blur-rise elements
type RiseSpec = { a: number; start: number; dur: number; pow: number; blur: number; blurDur: number; opDur: number; opPow: number };
const RISE: Record<string, RiseSpec> = {
  para1: { a: 38.7, start: 0.46, dur: 0.96, pow: 2.84, blur: 3, blurDur: 0.5, opDur: 0.45, opPow: 1.2 },
  para2: { a: 38.5, start: 0.681, dur: 0.93, pow: 2.6, blur: 3, blurDur: 0.42, opDur: 0.45, opPow: 1.2 },
  para3: { a: 34.5, start: 0.961, dur: 0.98, pow: 3.22, blur: 3, blurDur: 0.37, opDur: 0.45, opPow: 1.2 },
  para4: { a: 27.5, start: 1.227, dur: 0.77, pow: 2.26, blur: 2, blurDur: 0.34, opDur: 0.45, opPow: 1.2 },
};

const rise = (t: number, s: RiseSpec): Entrance => ({
  dy: decay(t, s.start, s.dur, s.pow, s.a),
  opacity: progress(t, s.start, s.opDur, powerOut(s.opPow)),
  blur: s.blur * Math.pow(1 - clamp01((t - s.start) / s.blurDur), 2),
});

export const paragraphLine = (t: number, i: number) => rise(t, RISE[`para${i + 1}`]);

/** divider draws left → right: scaleX power-2.5 out, start 1.05 s, 1.05 s */
export const dividerScale = (t: number) => progress(t, 1.05, 1.05, powerOut(2.5));
/** partner strip opacity: linear 1.05 → 2.33 s */
export const logoStripOpacity = (t: number) => clamp01((t - 1.05) / 1.28);

// ---------------------------------------------------------------- partner marquee
export const MARQUEE_PITCH = 147.5;
export const MARQUEE_LOOP = MARQUEE_PITCH * PARTNERS.length;
/** cumulative rightward travel (px): base speed + decaying boost (rms 2.2 px) */
const travel = (t: number) => marquee.c_px_per_s * t + marquee.A_px * (1 - Math.exp(-marquee.k_per_s * (t - 1.1)));
/** x (canvas px) of item 0's slot centre; item i sits at base + i·pitch (mod loop). Calibrated so
 *  that "Vercel" (i = 8) is centred at stage x 467 at t = 2.833 s (f085). */
const BASE_ITEM0 = 467 - 80 - 8 * MARQUEE_PITCH - travel(2.8333);
/** poster frame: "Retool" (i = 1) centred at stage x 239 */
const POSTER_ITEM0 = 239 - 80 - MARQUEE_PITCH;
export const marqueeItem0 = (t: number) => (t < INTRO_START ? POSTER_ITEM0 : BASE_ITEM0 + travel(t));
