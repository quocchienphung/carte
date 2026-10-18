// Canvas renderings of the two device screens. The inner screen is the bento scene drawn from the
// same assets, rects and type specs as the DOM version (bento.module.css), so the hand-off from the
// page to the device screen is seamless. The cover screen shows the content revealed after the fold.
import { TILES } from "../content";
import { BENTO_A, TILE_ART, type TileId } from "../geometry";
import logo from "@/components/sites/roco-bank/logo-params.json";

import { INNER_UI_SIZE, OUTER_UI_SIZE } from "./engine";
import { drawStatusBlock, STATUS_LAYOUT } from "./status-bar";

const ASCENT = 0.85; // Albert Sans: line-height 1 ⇒ baseline = top + 0.85·F

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

function family() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-albert").trim();
  return v || "'Albert Sans', sans-serif";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function logoMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const s = size / 40;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  for (const b of logo.bars_viewbox40) {
    ctx.save();
    ctx.translate(b.cx, b.cy);
    ctx.rotate((b.angle * Math.PI) / 180);
    ctx.fillRect(-logo.bar_length / 2, -logo.bar_width / 2, logo.bar_length, logo.bar_width);
    ctx.restore();
  }
  ctx.restore();
}

type Run = { text: string; weight: number };
function text(
  ctx: CanvasRenderingContext2D,
  runs: Run[],
  x: number,
  top: number,
  size: number,
  trackEm: number,
  color: string,
  align: "left" | "center" = "left",
) {
  const fam = family();
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = `${(trackEm * size).toFixed(2)}px`;
  const widths = runs.map((r) => {
    ctx.font = `${r.weight} ${size}px ${fam}`;
    return ctx.measureText(r.text).width;
  });
  let cx = align === "center" ? x - widths.reduce((a, b) => a + b, 0) / 2 : x;
  runs.forEach((r, i) => {
    ctx.font = `${r.weight} ${size}px ${fam}`;
    ctx.fillText(r.text, cx, top + ASCENT * size);
    cx += widths[i];
  });
  ctx.letterSpacing = "0px";
}

// line specs mirrored from bento.module.css (tile-relative canvas px)
// The DOM bento uses 330 / 500 (bento.module.css). On the device screen the texture is minified by
// trilinear sampling, which spreads every thin stroke over an extra pixel and reads ~11 % heavier
// (measured: tests/check-screen-text.*). The texture therefore uses calibrated lighter cuts so the
// text on the device matches the page bento.
// Calibrated per texture resolution (DPR 2 → res ≈ 1.6, DPR 1 → res 1).
const weightComp = (res: number) =>
  res >= 1.3 ? { light: 252, medium: 425, eyebrow: 335 } : { light: 220, medium: 392, eyebrow: 305 };
let WEIGHT_COMP = weightComp(1.6);
type Line = { left: number | "center"; top: number; size: number; track: number; color?: string };
const LINES: Record<TileId, Line[]> = {
  credit: [{ left: 53.6, top: 67.8, size: 47.86, track: -0.045 }, { left: 53, top: 120.4, size: 33, track: -0.035 }],
  customers: [
    { left: 50, top: 52.9, size: 14.29, track: 0.325, color: "rgba(255,255,255,0.96)" },
    { left: 50.6, top: 170.2, size: 48, track: -0.045 },
    { left: 50.4, top: 231.3, size: 31.4, track: -0.035 },
  ],
  trust: [
    { left: 50, top: 53.5, size: 13.6, track: 0.325, color: "rgba(255,255,255,0.96)" },
    { left: 50.4, top: 91.3, size: 31.4, track: -0.035 },
    { left: 49.5, top: 126.3, size: 31.4, track: -0.035 },
  ],
  ai: [{ left: "center", top: 64.2, size: 38.6, track: -0.045 }],
  easy: [{ left: 53, top: 64.2, size: 38.6, track: -0.045 }],
  payment: [
    { left: 50, top: 48.9, size: 14.29, track: 0.325, color: "rgba(255,255,255,0.96)" },
    { left: 50.2, top: 126.8, size: 47.86, track: -0.045 },
    { left: 49, top: 188.3, size: 31.4, track: -0.035 },
  ],
  invested: [
    { left: 46, top: 35.2, size: 38.6, track: -0.035, color: "rgba(255,255,255,0.9)" },
    { left: 47.2, top: 83.2, size: 38.6, track: -0.045 },
  ],
};

/** `res` = texture resolution multiplier. The bento is handed from the DOM to this texture, so it
 *  is drawn at the device-pixel size it is shown at (1.0 = 1600×1125, the reference UI size). */
export async function drawInnerScreen(canvas: HTMLCanvasElement, res = 1) {
  WEIGHT_COMP = weightComp(res);
  canvas.width = Math.round(INNER_UI_SIZE.w * res);
  canvas.height = Math.round(INNER_UI_SIZE.h * res);
  const ctx = canvas.getContext("2d")!;
  const ids = Object.keys(BENTO_A) as TileId[];
  const art = Object.fromEntries(
    await Promise.all(ids.map(async (id) => [id, await loadImage(`/sites/roco-bank/bento/${id}.webp`)] as const)),
  ) as Record<TileId, HTMLImageElement>;
  await document.fonts.ready;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 1440×1024 canvas px → 1600×1125 texture (fit height, centred)
  const k = (INNER_UI_SIZE.h * res) / 1024;
  ctx.setTransform(k, 0, 0, k, (INNER_UI_SIZE.w * res - 1440 * k) / 2, 0);
  // header (dark theme)
  logoMark(ctx, 56.05, 49.12, 40, "#fff");
  text(ctx, [{ text: "Roco.bank", weight: 520 }], 110.05, 59.62, 20.4, 0.016, "#fff");
  // tiles
  for (const id of ids) {
    // yield between tiles so building the texture never blocks a frame for long
    await new Promise<void>((r) => setTimeout(r, 0));
    const r = BENTO_A[id];
    const a = TILE_ART[id];
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, r.x, r.y, r.w, r.h, 20);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, r.x, r.y, r.w, r.h, 20);
    ctx.clip();
    ctx.drawImage(art[id], a.x, a.y, a.w, a.h);
    TILES[id].text.forEach((line, i) => {
      const spec = LINES[id][i];
      const runs: Run[] =
        line.kind === "eyebrow"
          ? [{ text: line.text, weight: WEIGHT_COMP.eyebrow }]
          : line.parts.map((p) => ({ text: p.text, weight: p.weight === "medium" ? WEIGHT_COMP.medium : WEIGHT_COMP.light }));
      const x = spec.left === "center" ? r.x + r.w / 2 : r.x + spec.left;
      text(ctx, runs, x, r.y + spec.top, spec.size, spec.track, spec.color ?? "#fff", spec.left === "center" ? "center" : "left");
    });
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------------------------------------------------------------- cover screen: Apple Pay wallet
// Driven by a single process time t (‑1 … 6) that mirrors the six process cards beside the phone:
//   t < 0  lock screen        0–1 wake (double-click)      1–2 cards rise into the stack
//   2–3   default card chosen 3–4 Pay button + press       4–5 Face ID scan   5–6 green check, Done

const WALLET_CARDS = [
  { id: "vietinbank", label: "VietinBank" },
  { id: "vib", label: "VIB" },
  { id: "techcombank", label: "Techcombank" },
  { id: "vietcombank", label: "Vietcombank" },
] as const;

const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const backOut = (u: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export class WalletScreen {
  private ctx: CanvasRenderingContext2D;
  private cards: HTMLImageElement[] = [];
  private lastT = Number.NaN;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = OUTER_UI_SIZE.w;
    canvas.height = OUTER_UI_SIZE.h;
    this.ctx = canvas.getContext("2d")!;
  }

  async load() {
    this.cards = await Promise.all(WALLET_CARDS.map((c) => loadImage(`/sites/roco-bank/cards/${c.id}.webp`)));
    await document.fonts.ready;
    this.draw(-1, 1, true);
  }

  /** returns true when the canvas changed */
  /** `intro` (0–1) plays the combined status icon in as the device finishes closing */
  draw(t: number, intro = 1, force = false) {
    const q = Math.round(t * 400) / 400 + Math.round(intro * 200) * 10;
    if (!force && q === this.lastT) return false;
    this.lastT = q;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const wake = seg(t, 0, 0.7);
    // ---- lock screen (fades out on wake)
    if (wake < 1) {
      ctx.globalAlpha = 1 - wake;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#1b1a19");
      bg.addColorStop(1, "#050505");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      text(ctx, [{ text: "Friday 17 October", weight: 500 }], 56, 168, 28, -0.01, "rgba(255,255,255,0.75)");
      text(ctx, [{ text: "9:41", weight: 600 }], 48, 206, 168, -0.04, "rgba(255,255,255,0.92)");
      text(ctx, [{ text: "Double-click to pay", weight: 450 }], W / 2, H - 140, 24, -0.01, "rgba(255,255,255,0.5)", "center");
      ctx.globalAlpha = 1;
    }
    // status layers: time appears once the Wallet is awake (the lock screen has its own big clock)
    drawStatusBlock(ctx, { battery: 0.82, signal: 3, wifi: 3, intro, showTime: wake > 0, color: "#ffffff" }, (x, capTop, cap, color) => {
      const size = cap / 0.7;
      ctx.globalAlpha *= wake;
      text(ctx, [{ text: "9:41", weight: 600 }], x, capTop - 0.15 * size, size, -0.01, color, "center");
    });
    if (wake <= 0) return true;

    ctx.globalAlpha = wake;
    // ---- Wallet header
    const choose = easeInOut(seg(t, 2, 2.9));
    text(ctx, [{ text: "Wallet", weight: 600 }], 48, 120, 44, -0.03, `rgba(255,255,255,${1 - choose})`);
    const TOP = Math.ceil(STATUS_LAYOUT.bottom) + 18;

    // ---- card stack
    const cw = W - 88;
    const ch = (cw * 272) / 440;
    const n = this.cards.length;
    for (let i = 0; i < n; i++) {
      const rise = seg(t, 1 + i * 0.16, 1.5 + i * 0.16);
      if (rise <= 0) continue;
      const e = backOut(rise);
      const front = i === n - 1;
      // stack layout: each card shows its top strip, the default card (front) is fully visible
      const yStack = TOP + i * 84;
      // chosen layout: default card on top, the others collapse into a compact stack at the bottom
      const yChosen = front ? TOP : H - 150 + (i - n + 1) * 18;
      const sChosen = front ? 0.88 : 0.82 - (n - 1 - i) * 0.03;
      const y = mix(yStack, yChosen, choose) + (1 - e) * 140;
      const sc = mix((0.94 + 0.06 * Math.min(1, e)) * 0.96, sChosen, choose);
      const pay = seg(t, 3, 3.35);
      const hideOthers = front ? 1 : 1 - seg(t, 2.75, 3.2);
      ctx.save();
      ctx.globalAlpha = wake * Math.min(1, rise * 1.6) * hideOthers;
      const x = W / 2 - (cw * sc) / 2;
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = -6;
      roundRect(ctx, x, y, cw * sc, ch * sc, 24 * sc);
      ctx.fillStyle = "#0b0b0b";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(this.cards[i], x, y, cw * sc, ch * sc);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = wake * Math.min(1, rise * 1.6) * hideOthers * 0.9;
      roundRect(ctx, x + 0.5, y + 0.5, cw * sc - 1, ch * sc - 1, 24 * sc);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      void pay;
    }
    ctx.globalAlpha = 1;

    // ---- merchant + amount under the chosen card
    const info = seg(t, 2.4, 3);
    if (info > 0) {
      const yInfo = TOP + ch * 0.88 + 34;
      ctx.globalAlpha = easeOut(info);
      text(ctx, [{ text: "Roco Coffee · Saigon", weight: 450 }], W / 2, yInfo + (1 - info) * 20, 26, -0.01, "rgba(255,255,255,0.6)", "center");
      text(ctx, [{ text: "$32.10", weight: 330 }], W / 2, yInfo + 40 + (1 - info) * 20, 92, -0.045, "#fff", "center");
      ctx.globalAlpha = 1;
    }

    // ---- Pay button (appears, is pressed, then gives way to Face ID)
    const btnIn = easeOut(seg(t, 3, 3.45));
    const press = seg(t, 3.55, 3.75) - seg(t, 3.75, 3.95);
    const btnOut = seg(t, 3.95, 4.15);
    if (btnIn > 0 && btnOut < 1) {
      const bw = 520;
      const bh = 104;
      const bx = W / 2 - bw / 2;
      const by = H - 200 + (1 - btnIn) * 60;
      const k = 1 - 0.05 * press;
      ctx.save();
      ctx.globalAlpha = btnIn * (1 - btnOut);
      ctx.translate(W / 2, by + bh / 2);
      ctx.scale(k, k);
      roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
      ctx.fillStyle = press > 0 ? "#d9d9d9" : "#ffffff";
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = btnIn * (1 - btnOut);
      faceGlyph(ctx, bx + 104, by + bh / 2, 44, "#000", 1, 0);
      text(ctx, [{ text: "Pay  $32.10", weight: 560 }], W / 2 + 26, by + 31, 38, -0.02, "#000", "center");
      // tap ripple
      if (press > 0 || seg(t, 3.55, 4.1) > 0) {
        const r = seg(t, 3.55, 4.1);
        ctx.beginPath();
        ctx.arc(W / 2 + 120, by + bh / 2, 20 + r * 120, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - r)})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // ---- Face ID → green check
    const faceIn = easeOut(seg(t, 4, 4.3));
    const scan = seg(t, 4.25, 4.85);
    const morph = easeInOut(seg(t, 4.8, 5.15));
    const draw = seg(t, 5.05, 5.6);
    if (faceIn > 0) {
      const cx = W / 2;
      const cy = H - 186;
      const size = 118;
      ctx.save();
      ctx.globalAlpha = faceIn;
      const glow = seg(t, 5.2, 5.6) * (1 - seg(t, 5.7, 6));
      if (glow > 0) {
        const gr = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
        gr.addColorStop(0, `rgba(52,199,89,${0.35 * glow})`);
        gr.addColorStop(1, "rgba(52,199,89,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(cx - 260, cy - 260, 520, 520);
      }
      if (morph < 1) faceGlyph(ctx, cx, cy, size * mix(0.8, 1, faceIn), "#fff", 1 - morph, scan);
      if (morph > 0) {
        // brackets close into a ring that turns green, then the check draws
        const r = size * 0.56;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.strokeStyle = draw > 0 ? "#34c759" : `rgba(255,255,255,${morph})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(morph * 0.25, draw));
        ctx.stroke();
        if (draw > 0.35) {
          const k = seg(draw, 0.35, 1);
          const pts: [number, number][] = [
            [cx - r * 0.42, cy + r * 0.02],
            [cx - r * 0.1, cy + r * 0.34],
            [cx + r * 0.46, cy - r * 0.3],
          ];
          const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
          const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
          const L = (l1 + l2) * k;
          ctx.strokeStyle = "#34c759";
          ctx.lineWidth = 12;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(...pts[0]);
          if (L <= l1) ctx.lineTo(mix(pts[0][0], pts[1][0], L / l1), mix(pts[0][1], pts[1][1], L / l1));
          else {
            ctx.lineTo(...pts[1]);
            const v = (L - l1) / l2;
            ctx.lineTo(mix(pts[1][0], pts[2][0], v), mix(pts[1][1], pts[2][1], v));
          }
          ctx.stroke();
        }
      }
      const label = seg(t, 4.3, 4.5) * (1 - seg(t, 4.9, 5.05));
      if (label > 0) text(ctx, [{ text: "Face ID", weight: 500 }], cx, cy + size * 0.78, 28, -0.01, `rgba(255,255,255,${0.75 * label})`, "center");
      const done = seg(t, 5.35, 5.7);
      if (done > 0) text(ctx, [{ text: "Done", weight: 600 }], cx, cy + size * 0.78 + (1 - done) * 12, 34, -0.02, `rgba(52,199,89,${done})`, "center");
      ctx.restore();
    }
    // home indicator
    roundRect(ctx, W / 2 - 120, H - 34, 240, 9, 4.5);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    return true;
  }
}

/** Face ID glyph: four corner brackets + eyes, nose and smile; `scan` sweeps a highlight line */
function faceGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha: number, scan: number) {
  const s = size / 2;
  const L = s * 0.42;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.06);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const pulse = scan > 0 ? 1 + 0.06 * Math.sin(scan * Math.PI * 4) : 1;
  const k = s * pulse;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * k, cy + sy * (k - L));
    ctx.lineTo(cx + sx * k, cy + sy * (k - s * 0.16));
    ctx.quadraticCurveTo(cx + sx * k, cy + sy * k, cx + sx * (k - s * 0.16), cy + sy * k);
    ctx.lineTo(cx + sx * (k - L), cy + sy * k);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.36, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.36, cy - s * 0.14);
  ctx.moveTo(cx + s * 0.36, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.36, cy - s * 0.14);
  ctx.moveTo(cx + s * 0.02, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.02, cy + s * 0.08);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.08);
  ctx.moveTo(cx - s * 0.34, cy + s * 0.3);
  ctx.quadraticCurveTo(cx, cy + s * 0.56, cx + s * 0.34, cy + s * 0.3);
  ctx.stroke();
  if (scan > 0 && scan < 1) {
    const y = cy - k + 2 * k * easeInOut(scan);
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - k, y - 30, 2 * k, 60);
  }
  ctx.restore();
}
