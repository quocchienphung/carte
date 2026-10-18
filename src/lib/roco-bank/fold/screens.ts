// Canvas renderings of the two device screens.
// Inner screen: the live Carte bento painted from the rendered DOM tiles (src/lib/carte/dom-paint.ts),
//   so the hand-off from the page to the device shows the same scenes and the same demo state.
// Cover screen: the Carte security demo — six checkpoints driven by one process time t (−1 … 6) that
//   mirrors the process column beside the phone, ending on a remote overview of the demo card.
import { GLYPHS, type GlyphName } from "@/lib/carte/glyphs";
import { paintElement } from "@/lib/carte/dom-paint";
import { DEMO, SIGNALS, remoteRows, type DemoState } from "@/lib/carte/security-demo";
import logo from "@/components/sites/roco-bank/logo-params.json";

import { BRAND } from "../content";
import { INNER_UI_SIZE, OUTER_UI_SIZE } from "./ui-size";
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
  align: "left" | "center" | "right" = "left",
) {
  const fam = family();
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = `${(trackEm * size).toFixed(2)}px`;
  const widths = runs.map((r) => {
    ctx.font = `${r.weight} ${size}px ${fam}`;
    return ctx.measureText(r.text).width;
  });
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  runs.forEach((r, i) => {
    ctx.font = `${r.weight} ${size}px ${fam}`;
    ctx.fillText(r.text, cx, top + ASCENT * size);
    cx += widths[i];
  });
  ctx.letterSpacing = "0px";
}

const glyphPaths = new Map<GlyphName, Path2D>();
/** a Carte glyph (24 grid stroke paths, shared with the DOM) */
function glyph(ctx: CanvasRenderingContext2D, name: GlyphName, cx: number, cy: number, size: number, color: string, width = 1.6) {
  let p = glyphPaths.get(name);
  if (!p) glyphPaths.set(name, (p = new Path2D(GLYPHS[name])));
  const s = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(p);
  ctx.restore();
}

// ---------------------------------------------------------------- inner screen
// The DOM bento renders at 330 / 500; on the device the texture is minified by trilinear sampling,
// which spreads thin strokes and reads ~11 % heavier (tests/check-screen-text.*) — the painted text
// is set lighter by a calibrated amount per texture resolution (DPR 2 → res ≈ 1.6, DPR 1 → res 1).
const weightDelta = (res: number) => (res >= 1.3 ? 78 : 110);

/** `res` = texture resolution multiplier (1.0 = 1600×1125). `bento` = the DOM grid holding the
 *  `[data-tile]` boxes; each tile is painted at its current layout rect (A, B or mid-morph). The
 *  frame is composed off-screen and blitted in one step, so an upload never sees a half-drawn texture. */
export async function drawInnerScreen(canvas: HTMLCanvasElement, res = 1, bento: HTMLElement | null = null) {
  const W = Math.round(INNER_UI_SIZE.w * res);
  const H = Math.round(INNER_UI_SIZE.h * res);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const buf = document.createElement("canvas");
  buf.width = W;
  buf.height = H;
  const ctx = buf.getContext("2d")!;
  await document.fonts.ready;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);
  // 1440×1024 canvas px → 1600×1125 texture (fit height, centred)
  const k = (INNER_UI_SIZE.h * res) / 1024;
  ctx.setTransform(k, 0, 0, k, (INNER_UI_SIZE.w * res - 1440 * k) / 2, 0);
  // header (dark theme): mark + live wordmark only
  logoMark(ctx, 56.05, 49.12, 40, "#fff");
  text(ctx, [{ text: BRAND.name, weight: 520 }], 110.05, 59.62, 20.4, 0.016, "#fff");
  if (bento) {
    for (const el of bento.querySelectorAll<HTMLElement>("[data-tile]")) {
      // yield between tiles so building the texture never blocks a frame for long
      await new Promise<void>((r) => setTimeout(r, 0));
      await paintElement(ctx, el, el.offsetLeft, el.offsetTop, { weightDelta: weightDelta(res) });
    }
  }
  const out = canvas.getContext("2d")!;
  out.drawImage(buf, 0, 0);
}

// ---------------------------------------------------------------- cover screen: Carte security demo
// One process time t (−1 … 6) mirrors the six checkpoints in the column beside the phone:
//   t < 0  lock screen          0–1 open the wallet           1–2 cards rise, select a card
//   2–3   review the details    3–4 check the signals         4–5 simulated identity check
//   5–6   clear result, then the remote overview of the demo card (state from the shared model)

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

const C = {
  ok: "#3fbf74",
  warn: "#fb8a3c",
  frost: "#9fd4ff",
  accent: "#8eabff",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.32)",
  panel: "#18181b",
  line: "rgba(255,255,255,0.09)",
};

/** demo outcome shown at step 06: frozen when the review froze the card (or it is frozen) */
const outcome = (d: DemoState) => (d.decision === "frozen" || d.card === "frozen" ? "frozen" : "approved");

export class WalletScreen {
  private ctx: CanvasRenderingContext2D;
  private cards: HTMLImageElement[] = [];
  private lastKey = "";

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = OUTER_UI_SIZE.w;
    canvas.height = OUTER_UI_SIZE.h;
    this.ctx = canvas.getContext("2d")!;
  }

  async load(demo: DemoState) {
    this.cards = await Promise.all(WALLET_CARDS.map((c) => loadImage(`/sites/roco-bank/cards/${c.id}.webp?v=polished-2`)));
    await document.fonts.ready;
    this.draw(-1, 1, demo, true);
  }

  /** returns true when the canvas changed. `intro` (0–1) plays the combined status icon in as the
   *  device finishes closing. */
  draw(t: number, intro: number, demo: DemoState, force = false) {
    const key = `${Math.round(t * 400)}|${Math.round(intro * 200)}|${demo.version}`;
    if (!force && key === this.lastKey) return false;
    this.lastKey = key;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
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
      text(ctx, [{ text: `Double-click to open ${BRAND.name}`, weight: 450 }], W / 2, H - 140, 24, -0.01, "rgba(255,255,255,0.5)", "center");
      ctx.globalAlpha = 1;
    }
    // status layers: time appears once the wallet is awake (the lock screen has its own big clock)
    drawStatusBlock(ctx, { battery: 0.82, signal: 3, wifi: 3, intro, showTime: wake > 0, color: "#ffffff" }, (x, capTop, cap, color) => {
      const size = cap / 0.7;
      ctx.globalAlpha *= wake;
      text(ctx, [{ text: "9:41", weight: 600 }], x, capTop - 0.15 * size, size, -0.01, color, "center");
    });
    if (wake <= 0) return true;

    ctx.globalAlpha = wake;
    // ---- 01 header
    const choose = easeInOut(seg(t, 2, 2.9));
    const overview = easeInOut(seg(t, 5.55, 6));
    text(ctx, [{ text: `${BRAND.name} `, weight: 600 }, { text: "Wallet", weight: 400 }], 48, 112, 44, -0.03, `rgba(255,255,255,${1 - choose})`);
    text(ctx, [{ text: DEMO.label, weight: 450 }], 50, 170, 21, -0.005, `rgba(255,255,255,${0.42 * (1 - choose)})`);
    const TOP = Math.ceil(STATUS_LAYOUT.bottom) + 18;

    // ---- 02 card stack → the demo card on top
    const cw = W - 88;
    const ch = (cw * 272) / 440;
    const n = this.cards.length;
    const lift = overview * 40;
    for (let i = 0; i < n; i++) {
      const rise = seg(t, 1 + i * 0.16, 1.5 + i * 0.16);
      if (rise <= 0) continue;
      const e = backOut(rise);
      const front = i === n - 1;
      const yStack = TOP + i * 84;
      const yChosen = front ? TOP - lift : H - 150 + (i - n + 1) * 18;
      const sChosen = front ? 0.88 - overview * 0.3 : 0.82 - (n - 1 - i) * 0.03;
      const y = mix(yStack, yChosen, choose) + (1 - e) * 140;
      const sc = mix((0.94 + 0.06 * Math.min(1, e)) * 0.96, sChosen, choose);
      const hideOthers = front ? 1 : 1 - seg(t, 2.75, 3.2);
      if (hideOthers <= 0) continue;
      const x = front ? mix(W / 2 - (cw * sc) / 2, 44, overview) : W / 2 - (cw * sc) / 2;
      ctx.save();
      ctx.globalAlpha = wake * Math.min(1, rise * 1.6) * hideOthers;
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = -6;
      roundRect(ctx, x, y, cw * sc, ch * sc, 24 * sc);
      ctx.fillStyle = "#0b0b0b";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(this.cards[i], x, y, cw * sc, ch * sc);
      // frozen demo card: frost wash + snowflake
      if (front && demo.card === "frozen") {
        ctx.filter = "none";
        ctx.fillStyle = "rgba(120, 170, 230, 0.42)";
        ctx.fillRect(x, y, cw * sc, ch * sc);
        glyph(ctx, "snowflake", x + (cw * sc) / 2, y + (ch * sc) / 2, 64 * sc + 16, "#ffffff", 1.6);
      }
      ctx.restore();
      if (front && choose > 0) {
        ctx.save();
        ctx.globalAlpha = wake * choose * (1 - overview);
        roundRect(ctx, x + 28 * sc, y + ch * sc - 70 * sc, 150 * sc, 44 * sc, 12 * sc);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fill();
        text(ctx, [{ text: `•••• ${DEMO.cardLast4}`, weight: 500 }], x + 103 * sc, y + ch * sc - 62 * sc, 26 * sc, 0.06, "rgba(255,255,255,0.92)", "center");
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    // ---- 03 review the details (merchant, amount, card) under the chosen card
    const info = seg(t, 2.4, 3) * (1 - overview);
    const yInfo = TOP + ch * 0.88 + 30;
    if (info > 0) {
      ctx.globalAlpha = easeOut(info);
      const dy = (1 - info) * 20;
      text(ctx, [{ text: DEMO.merchant, weight: 500 }], W / 2, yInfo + dy, 28, -0.01, "rgba(255,255,255,0.72)", "center");
      text(ctx, [{ text: DEMO.amountLabel, weight: 330 }], W / 2, yInfo + 40 + dy, 92, -0.045, "#fff", "center");
      text(ctx, [{ text: `Card ending ${DEMO.cardLast4}`, weight: 450 }], W / 2, yInfo + 146 + dy, 22, -0.005, C.muted, "center");
      ctx.globalAlpha = 1;
    }

    // ---- 04 check the signals: three rows + verdict, in a panel at the bottom
    const sigIn = easeOut(seg(t, 3, 3.4));
    const sigOut = seg(t, 3.95, 4.15);
    if (sigIn > 0 && sigOut < 1) {
      const a = sigIn * (1 - sigOut);
      const px = 44;
      const pw = W - 88;
      const py = H - 292 + (1 - sigIn) * 40;
      ctx.save();
      ctx.globalAlpha = a;
      roundRect(ctx, px, py, pw, 232, 30);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      glyph(ctx, "alert", px + 44, py + 40, 26, C.warn, 2);
      text(ctx, [{ text: DEMO.verdict, weight: 500 }], px + 70, py + 27, 25, -0.01, C.warn);
      SIGNALS.forEach((s, i) => {
        const ry = py + 78 + i * 48;
        const on = seg(t, 3.15 + i * 0.12, 3.4 + i * 0.12);
        ctx.globalAlpha = a * on;
        const gname: GlyphName = s.id === "device" ? "device" : s.id === "amount" ? "amount" : "pin";
        glyph(ctx, gname, px + 44, ry + 18, 26, "rgba(255,255,255,0.75)", 1.8);
        text(ctx, [{ text: s.label, weight: 450 }], px + 76, ry + 4, 25, -0.01, "rgba(255,255,255,0.85)");
        text(ctx, [{ text: s.value, weight: 500 }], px + pw - 32, ry + 4, 25, -0.01, s.tone === "warn" ? C.warn : C.ok, "right");
      });
      ctx.restore();
    }

    // ---- 05 simulated identity check → 06 result
    const faceIn = easeOut(seg(t, 4, 4.3));
    const scan = seg(t, 4.25, 4.85);
    const morph = easeInOut(seg(t, 4.8, 5.15));
    const draw = seg(t, 5.05, 5.6);
    const result = outcome(demo);
    const tone = result === "approved" ? C.ok : C.frost;
    if (faceIn > 0) {
      const cx = W / 2;
      const cy = mix(H - 186, H - 120, overview);
      const size = mix(118, 84, overview);
      ctx.save();
      ctx.globalAlpha = faceIn;
      const glow = seg(t, 5.2, 5.6) * (1 - seg(t, 5.7, 6));
      if (glow > 0) {
        const gr = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
        gr.addColorStop(0, result === "approved" ? `rgba(63,191,116,${0.35 * glow})` : `rgba(159,212,255,${0.32 * glow})`);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(cx - 260, cy - 260, 520, 520);
      }
      if (morph < 1) faceGlyph(ctx, cx, cy, size * mix(0.8, 1, faceIn), "#fff", 1 - morph, scan);
      if (morph > 0) {
        const r = size * 0.56;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.strokeStyle = draw > 0 ? tone : `rgba(255,255,255,${morph})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(morph * 0.25, draw));
        ctx.stroke();
        if (draw > 0.35) {
          const k = seg(draw, 0.35, 1);
          if (result === "approved") {
            const pts: [number, number][] = [
              [cx - r * 0.42, cy + r * 0.02],
              [cx - r * 0.1, cy + r * 0.34],
              [cx + r * 0.46, cy - r * 0.3],
            ];
            const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
            const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
            const L = (l1 + l2) * k;
            ctx.strokeStyle = tone;
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
          } else {
            ctx.globalAlpha = faceIn * k;
            glyph(ctx, "lock", cx, cy, r * 1.25, tone, 2);
          }
        }
      }
      const label = seg(t, 4.3, 4.5) * (1 - seg(t, 4.9, 5.05));
      if (label > 0) {
        ctx.globalAlpha = 1;
        text(ctx, [{ text: "Simulated check", weight: 500 }], cx, cy + size * 0.78, 28, -0.01, `rgba(255,255,255,${0.75 * label})`, "center");
      }
      const done = seg(t, 5.35, 5.7) * (1 - overview);
      if (done > 0) {
        ctx.globalAlpha = 1;
        const title = result === "approved" ? "Approved · demo" : "Card frozen · declined";
        text(ctx, [{ text: title, weight: 600 }], cx, cy + size * 0.78 + (1 - done) * 12, 34, -0.02, result === "approved" ? `rgba(63,191,116,${done})` : `rgba(159,212,255,${done})`, "center");
      }
      ctx.restore();
    }

    // ---- 06 remote overview (Affect UI Change Summary rows): the demo card managed from the phone
    if (overview > 0) this.drawOverview(ctx, demo, overview, TOP - lift + ch * 0.58 + 26);

    // home indicator
    ctx.globalAlpha = 1;
    roundRect(ctx, W / 2 - 120, H - 34, 240, 9, 4.5);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    return true;
  }

  private drawOverview(ctx: CanvasRenderingContext2D, demo: DemoState, a: number, top: number) {
    const W = this.canvas.width;
    const px = 44;
    const pw = W - 88;
    const rows = remoteRows(demo);
    ctx.save();
    ctx.globalAlpha = a;
    text(ctx, [{ text: "Remote overview", weight: 500 }], px + 4, top, 26, -0.01, "rgba(255,255,255,0.86)");
    text(ctx, [{ text: "Demo", weight: 450 }], px + pw - 4, top + 2, 22, 0, C.faint, "right");
    const y0 = top + 46;
    roundRect(ctx, px, y0, pw, rows.length * 68 + 12, 26);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    rows.forEach((r, i) => {
      const ry = y0 + 6 + i * 68;
      if (i > 0) {
        ctx.fillStyle = C.line;
        ctx.fillRect(px + 24, ry, pw - 48, 2);
      }
      const color = r.tone === "good" ? C.ok : r.tone === "bad" ? C.warn : r.tone === "frost" ? C.frost : "rgba(255,255,255,0.5)";
      glyph(ctx, r.glyph, px + 44, ry + 34, 26, color, 1.9);
      text(ctx, [{ text: r.label, weight: 450 }], px + 76, ry + 21, 24, -0.01, "rgba(255,255,255,0.8)");
      text(ctx, [{ text: r.value, weight: 500 }], px + pw - 28, ry + 21, 24, -0.01, color, "right");
    });
    ctx.restore();
  }
}

/** Face-scan glyph for the simulated identity check: corner brackets + eyes, nose and smile; `scan`
 *  sweeps a highlight line. (No real biometric check is involved.) */
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
