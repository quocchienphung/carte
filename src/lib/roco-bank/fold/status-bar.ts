// iPhone Duo cover-screen status block, rebuilt layer by layer from the reference video
// (references/status-bar/iphone-duo-status-reference.mp4 — "Wi-Fi, Cellular Data & Battery are
// now combined into one icon"). Geometry fitted on frame f090 (ring radius R = 109.7 px):
//   battery  = ring arc, stroke 0.149 R, round caps, spans 251° from 144.6° clockwise over the top
//              to 35.5° (canvas angles, y down); its length is the charge level
//   cellular = 4 dots Ø 0.219 R on the ring circle at 120°/100°/80°/60° (the bottom opening)
//   Wi-Fi    = 3 layers (outer arc, inner arc, wedge) centred below the ring centre
// Placement on the cover screen (frame f117, camera-hole Ø D as unit): time + icon are centred under
// the camera; time cap height 0.333 D, cap top 1.05 D below the camera centre; ring centre 2.25 D
// below it, R = 0.52 D. Camera hole from the Apple model: (692.6, 81.6) px, Ø 60.9 px on the
// 774×1125 cover texture.

export const COVER_CAMERA = { x: 692.6, y: 81.6, d: 60.9 } as const;
const D = COVER_CAMERA.d;
export const STATUS_LAYOUT = {
  timeCapTop: COVER_CAMERA.y + 1.05 * D,
  timeCap: 0.333 * D,
  ringY: COVER_CAMERA.y + 2.25 * D,
  R: 0.52 * D,
  /** lowest pixel the block occupies (content must start below this) */
  bottom: COVER_CAMERA.y + 2.25 * D + 0.52 * D * 1.12,
} as const;

// pixel extent 144.6°→35.5° includes the round caps (½ stroke ≈ 4.2° each) → centre-line span 242.6°
const RING_START = (148.8 * Math.PI) / 180;
const RING_SPAN = (242.6 * Math.PI) / 180;
const DOT_ANGLES = [120, 100, 80, 60].map((a) => (a * Math.PI) / 180);

export type StatusState = {
  /** 0–1 charge level (arc length) */
  battery: number;
  /** 0–4 bars of signal (filled dots) */
  signal: number;
  /** 0–3 Wi-Fi strength (filled layers) */
  wifi: number;
  /** 0–1 intro: the ring sweeps in and the dots drop into place (video f060–f096) */
  intro: number;
  showTime: boolean;
  color?: string;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

/** layer: battery ring (dim track + level arc) */
function batteryLayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, level: number, sweep: number, color: string) {
  const w = 0.149 * R;
  ctx.lineCap = "round";
  ctx.lineWidth = w;
  const span = RING_SPAN * sweep;
  if (span <= 0.001) return;
  // track (empty part), then the charged part over it
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.28;
  ctx.beginPath();
  ctx.arc(cx, cy, R, RING_START, RING_START + span);
  ctx.stroke();
  ctx.globalAlpha /= 0.28;
  const charged = Math.min(span, RING_SPAN * level);
  if (charged > 0.001) {
    ctx.strokeStyle = level < 0.2 ? "#ff453a" : color;
    ctx.beginPath();
    ctx.arc(cx, cy, R, RING_START, RING_START + charged);
    ctx.stroke();
  }
}

/** layer: cellular dots in the ring opening */
function cellularLayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, bars: number, intro: number, color: string) {
  const r = (0.219 * R) / 2;
  DOT_ANGLES.forEach((a, i) => {
    const k = easeOut(seg(intro, 0.55 + i * 0.07, 0.8 + i * 0.07));
    if (k <= 0) return;
    // dots travel from a straight row (the old signal bars) onto the arc
    const rowX = cx + (i - 1.5) * r * 3.2;
    const rowY = cy + R * 0.92;
    const x = rowX + (cx + Math.cos(a) * R - rowX) * k;
    const y = rowY + (cy + Math.sin(a) * R - rowY) * k;
    ctx.globalAlpha *= i < bars ? 1 : 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r * (0.6 + 0.4 * k), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= i < bars ? 1 : 0.3;
  });
}

/** layer: Wi-Fi glyph (3 parts) — fitted: outer band top −0.33 R, inner −0.08 R, wedge apex +0.38 R */
function wifiLayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, strength: number, color: string) {
  const ax = cx;
  const ay = cy + 0.383 * R; // shared apex of the arcs
  const half = (41 * Math.PI) / 180;
  const sw = 0.13 * R;
  ctx.lineCap = "round";
  ctx.lineWidth = sw;
  ctx.strokeStyle = color;
  const arcs = [0.655 * R, 0.405 * R];
  arcs.forEach((r, i) => {
    ctx.globalAlpha *= 3 - i <= strength ? 1 : 0.3;
    ctx.beginPath();
    ctx.arc(ax, ay, r, -Math.PI / 2 - half, -Math.PI / 2 + half);
    ctx.stroke();
    ctx.globalAlpha /= 3 - i <= strength ? 1 : 0.3;
  });
  ctx.fillStyle = color;
  ctx.globalAlpha *= strength >= 1 ? 1 : 0.3;
  const wr = 0.185 * R;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.arc(ax, ay, wr, -Math.PI / 2 - half, -Math.PI / 2 + half);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = sw * 0.35;
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha /= strength >= 1 ? 1 : 0.3;
}

export function drawStatusBlock(
  ctx: CanvasRenderingContext2D,
  s: StatusState,
  drawTime: (x: number, capTop: number, cap: number, color: string) => void,
) {
  const color = s.color ?? "#ffffff";
  const { R, ringY } = STATUS_LAYOUT;
  const cx = COVER_CAMERA.x;
  ctx.save();
  if (s.showTime) {
    ctx.globalAlpha = seg(s.intro, 0, 0.3);
    drawTime(cx, STATUS_LAYOUT.timeCapTop, STATUS_LAYOUT.timeCap, color);
  }
  ctx.globalAlpha = 1;
  // video: the ring sweeps from ~88° to its full 251° in ≈0.7 s with an ease-out
  const sweep = easeOut(seg(s.intro, 0.1, 0.75));
  ctx.globalAlpha = seg(s.intro, 0, 0.2);
  wifiLayer(ctx, cx, ringY, R, s.wifi, color);
  batteryLayer(ctx, cx, ringY, R, s.battery, sweep, color);
  ctx.globalAlpha = 1;
  cellularLayer(ctx, cx, ringY, R, s.signal, s.intro, color);
  ctx.restore();
}
