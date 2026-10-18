import { SCROLL_WINDOW } from "./motion/bento";

// Interactive page choreography, in CSS px of page scroll:
//   hero ─TRANSITION (measured film window, scrubbed)→ bento ─HOLD→
//   ─PULL (bento handed to the device screen, device pops in)→ ─FOLD (180° → 0°)→
//   ─PROCESS (device slides left; Apple Pay process column scrolls up 1:1, cards activate at 48 %)→ end
export const SEG = { TRANSITION: 1400, HOLD: 320, PULL: 900, FOLD: 1300, SHIFT: 520 } as const;
const H1 = SEG.TRANSITION + SEG.HOLD;
const P1 = H1 + SEG.PULL;
const F1 = P1 + SEG.FOLD;
export const PROCESS_START = F1;
/** process column: header block + 6 cards of 156 px (Plinth geometry) */
export const PROCESS_COLUMN = { header: 289, card: 156, cards: 6 } as const;
export const ACTIVE_LINE = 0.48; // viewport fraction where a card becomes active (measured on Plinth)

export function processLength(vh: number) {
  const lastTop = PROCESS_COLUMN.header + (PROCESS_COLUMN.cards - 1) * PROCESS_COLUMN.card;
  // column starts just below the viewport; end once the last card has been active for a while
  return vh - ACTIVE_LINE * vh + lastTop + PROCESS_COLUMN.card + 260;
}

export function scrollLength(vh: number) {
  return F1 + processLength(vh);
}

export function anchors(vh: number) {
  return {
    home: 0,
    explore: SEG.TRANSITION + SEG.HOLD * 0.5,
    about: P1 + SEG.FOLD * 0.6,
    contact: scrollLength(vh),
  } as const;
}
export type AnchorId = keyof ReturnType<typeof anchors>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function mapScroll(y: number) {
  const q = clamp01(y / SEG.TRANSITION);
  return {
    scrollT: y <= 0 ? 3.4 : SCROLL_WINDOW.start + q * (SCROLL_WINDOW.end - SCROLL_WINDOW.start),
    pull: clamp01((y - H1) / SEG.PULL),
    fold: clamp01((y - P1) / SEG.FOLD),
    after: clamp01((y - F1) / SEG.SHIFT),
    /** px scrolled into the process section (drives the column 1:1) */
    processPx: Math.max(0, y - F1),
    foldVisible: y > H1 - 2,
  };
}
