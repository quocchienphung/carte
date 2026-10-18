// Carte DOM → canvas painter for the device's inner screen. The bento is live React DOM; the WebGL
// screen samples a 2D canvas. Instead of a second hand-made copy of seven scenes (which drifts), this
// paints the *rendered* tiles: box backgrounds (solid / linear gradients), rounded clips, ring and drop
// shadows, <img>, inline <svg> (serialised with its computed styles so CSS-module classes, transforms
// and animations survive) and text (per word, at the browser's own line breaks).
// Deliberately limited to what the Carte scenes use — no foreignObject (Safari taints the canvas, and
// it would need fonts / images inlined), no pseudo-elements, filters only via ctx.filter.

export type PaintOptions = {
  /** subtracted from every font weight: trilinear minification on the device screen thickens
   *  strokes (calibrated in tests/check-screen-text.*) */
  weightDelta?: number;
};

type Ctx = CanvasRenderingContext2D;
/** `rootHidden`: the whole tile is visibility:hidden (the DOM bento is hidden while the device shows
 *  it, but the state can still change) — then only explicit hiding inside the tile can't be told apart */
type Frame = { left: number; top: number; scale: number; ox: number; oy: number; rootHidden: boolean };

const svgCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadSvg(markup: string) {
  let p = svgCache.get(markup);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    });
    if (svgCache.size > 400) svgCache.clear();
    svgCache.set(markup, p);
  }
  return p;
}

const SVG_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "transform",
  "transform-origin",
  "transform-box",
  "display",
  "visibility",
  "stop-color",
  "stop-opacity",
  "flood-color",
  "flood-opacity",
] as const;

/** clone an inline <svg> with every element's computed presentation inlined */
function serializeSvg(svg: SVGSVGElement, w: number, h: number, pad: number) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...svg.querySelectorAll("*")];
  const dst = [clone, ...clone.querySelectorAll("*")];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const d = dst[i] as SVGElement;
    d.removeAttribute("class");
    const parts: string[] = [];
    for (const p of SVG_PROPS) {
      const v = cs.getPropertyValue(p);
      if (v && v !== "none" && v !== "normal") parts.push(`${p}:${v}`);
      else if (p === "transform" || p === "fill" || p === "stroke" || p === "display") parts.push(`${p}:${v}`);
    }
    // CSS transitions / animations are already resolved in the computed values
    d.setAttribute("style", parts.join(";"));
  });
  const vb = svg.viewBox.baseVal;
  const hasVb = vb && vb.width > 0 && vb.height > 0;
  const ux = hasVb ? vb.width / w : 1;
  const uy = hasVb ? vb.height / h : 1;
  const x0 = hasVb ? vb.x : 0;
  const y0 = hasVb ? vb.y : 0;
  clone.setAttribute("viewBox", `${x0 - pad * ux} ${y0 - pad * uy} ${(w + 2 * pad) * ux} ${(h + 2 * pad) * uy}`);
  clone.setAttribute("width", String(w + 2 * pad));
  clone.setAttribute("height", String(h + 2 * pad));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.style.overflow = "visible";
  return new XMLSerializer().serializeToString(clone);
}

/** "rgba(0, 0, 0, 0.35) 0px 14px 28px 0px, rgb(…) 0px 0px 0px 1px inset" → parts */
function parseShadows(v: string) {
  if (!v || v === "none") return [];
  const list: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      list.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) list.push(cur.trim());
  return list.map((s) => {
    const color = s.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i)?.[0] ?? "rgba(0,0,0,0.3)";
    const nums = s
      .replace(color, "")
      .replace("inset", "")
      .trim()
      .split(/\s+/)
      .map((n) => parseFloat(n))
      .filter((n) => !Number.isNaN(n));
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return { color, x, y, blur, spread, inset: s.includes("inset") };
  });
}

/** linear-gradient(180deg | to bottom | <none>, c1 [p1], c2 [p2] …) → vertical / angled canvas gradient */
function gradientFill(ctx: Ctx, v: string, x: number, y: number, w: number, h: number) {
  const m = v.match(/linear-gradient\((.*)\)\s*$/);
  if (!m) return null;
  const args: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of m[1]) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  args.push(cur.trim());
  let angle = 180;
  if (/deg$/.test(args[0])) angle = parseFloat(args.shift()!);
  else if (/^to /.test(args[0])) {
    const dir = args.shift()!;
    angle = dir.includes("right") ? 90 : dir.includes("left") ? 270 : dir.includes("top") ? 0 : 180;
  }
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  args.forEach((a, i) => {
    const color = a.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}|transparent/i)?.[0] ?? "transparent";
    const pos = a.match(/(-?[\d.]+)%/);
    g.addColorStop(Math.min(1, Math.max(0, pos ? parseFloat(pos[1]) / 100 : i / Math.max(1, args.length - 1))), color);
  });
  return g;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, w / 2, h / 2)));
}

const zOf = (el: Element) => {
  const z = getComputedStyle(el).zIndex;
  return z === "auto" ? 0 : parseInt(z, 10) || 0;
};

/** Paint `root` and its subtree into ctx; (ox, oy) is where root's top-left lands, in ctx units. */
export async function paintElement(ctx: Ctx, root: HTMLElement, ox: number, oy: number, opts: PaintOptions = {}) {
  const rr = root.getBoundingClientRect();
  const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
  if (!scale) return;
  const f: Frame = { left: rr.left, top: rr.top, scale, ox, oy, rootHidden: getComputedStyle(root).visibility === "hidden" };
  // pre-resolve every svg first (async decode), then paint synchronously in DOM / z order
  const svgs = new Map<SVGSVGElement, { img: HTMLImageElement | null; pad: number }>();
  await Promise.all(
    [...root.querySelectorAll("svg")].map(async (svg) => {
      if (svg.parentElement?.closest("svg")) return; // nested svg: painted with its outer svg
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const w = r.width / f.scale;
      const h = r.height / f.scale;
      const pad = getComputedStyle(svg).overflow === "visible" ? 32 : 0;
      svgs.set(svg, { img: await loadSvg(serializeSvg(svg, w, h, pad)), pad });
    }),
  );
  paintNode(ctx, root, f, 1, opts, svgs);
}

function local(f: Frame, r: DOMRect) {
  return { x: (r.left - f.left) / f.scale + f.ox, y: (r.top - f.top) / f.scale + f.oy, w: r.width / f.scale, h: r.height / f.scale };
}

function paintNode(
  ctx: Ctx,
  el: Element,
  f: Frame,
  alpha: number,
  opts: PaintOptions,
  svgs: Map<SVGSVGElement, { img: HTMLImageElement | null; pad: number }>,
) {
  const cs = getComputedStyle(el);
  if (cs.display === "none" || (cs.visibility === "hidden" && !f.rootHidden)) return;
  const a = alpha * parseFloat(cs.opacity || "1");
  if (a <= 0.003) return;
  const r = local(f, el.getBoundingClientRect());
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;

  if (el instanceof SVGSVGElement) {
    const s = svgs.get(el);
    if (s?.img) {
      ctx.globalAlpha = a;
      ctx.drawImage(s.img, r.x - s.pad, r.y - s.pad, r.w + 2 * s.pad, r.h + 2 * s.pad);
    }
    return;
  }
  if (el instanceof SVGElement) return;

  ctx.save();
  ctx.globalAlpha = a;
  // shadows: drop shadows under the box, rings around / inside it
  const shadows = parseShadows(cs.boxShadow);
  for (const s of shadows.filter((s) => !s.inset && s.blur > 0)) {
    // shadow only: the casting shape is drawn far off-canvas and its shadow offset back into place
    // (shadow offsets / blur are in device px, unaffected by the context transform)
    const BIG = 20000;
    const sc = ctx.getTransform().a || 1;
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur * sc;
    ctx.shadowOffsetX = (s.x + BIG) * sc;
    ctx.shadowOffsetY = s.y * sc;
    ctx.fillStyle = "#000";
    roundRect(ctx, r.x - s.spread - BIG, r.y - s.spread, r.w + 2 * s.spread, r.h + 2 * s.spread, radius + s.spread);
    ctx.fill();
    ctx.restore();
  }
  const bg = cs.backgroundColor;
  const hasBg = bg && bg !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(bg);
  if (hasBg) {
    ctx.fillStyle = bg;
    roundRect(ctx, r.x, r.y, r.w, r.h, radius);
    ctx.fill();
  }
  if (cs.backgroundImage && cs.backgroundImage !== "none") {
    for (const layer of cs.backgroundImage.split(/,(?![^(]*\))(?=\s*(?:linear|radial)-gradient)/).reverse()) {
      const g = gradientFill(ctx, layer.trim(), r.x, r.y, r.w, r.h);
      if (!g) continue;
      ctx.fillStyle = g;
      roundRect(ctx, r.x, r.y, r.w, r.h, radius);
      ctx.fill();
    }
  }
  for (const s of shadows.filter((s) => s.blur === 0 && s.spread > 0)) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.spread;
    const o = s.inset ? s.spread / 2 : -s.spread / 2;
    roundRect(ctx, r.x + o, r.y + o, r.w - 2 * o, r.h - 2 * o, Math.max(0, radius - o));
    ctx.stroke();
  }
  const bw = parseFloat(cs.borderTopWidth) || 0;
  if (bw > 0 && cs.borderTopStyle !== "none") {
    ctx.strokeStyle = cs.borderTopColor;
    ctx.lineWidth = bw;
    roundRect(ctx, r.x + bw / 2, r.y + bw / 2, r.w - bw, r.h - bw, Math.max(0, radius - bw / 2));
    ctx.stroke();
  }

  if (el instanceof HTMLImageElement) {
    if (el.complete && el.naturalWidth) {
      ctx.save();
      roundRect(ctx, r.x, r.y, r.w, r.h, radius);
      ctx.clip();
      if (cs.filter && cs.filter !== "none") ctx.filter = cs.filter;
      // object-fit: cover
      const s = Math.max(r.w / el.naturalWidth, r.h / el.naturalHeight);
      const dw = el.naturalWidth * s;
      const dh = el.naturalHeight * s;
      ctx.drawImage(el, r.x + (r.w - dw) / 2, r.y + (r.h - dh) / 2, dw, dh);
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (cs.overflow !== "visible" || cs.overflowX !== "visible") {
    roundRect(ctx, r.x, r.y, r.w, r.h, radius);
    ctx.clip();
  }

  // children in paint order: by z-index (stable), text runs in DOM order
  const kids = [...el.childNodes];
  const order = kids
    .map((n, i) => ({ n, i, z: n instanceof Element ? zOf(n) : 0 }))
    .sort((p, q) => p.z - q.z || p.i - q.i);
  for (const { n } of order) {
    if (n.nodeType === Node.TEXT_NODE) paintText(ctx, n as Text, cs, f, a, opts);
    else if (n instanceof Element) paintNode(ctx, n, f, a, opts, svgs);
  }
  ctx.restore();
}

function paintText(ctx: Ctx, node: Text, cs: CSSStyleDeclaration, f: Frame, alpha: number, opts: PaintOptions) {
  const text = node.data;
  if (!text.trim()) return;
  const weight = Math.max(100, (parseInt(cs.fontWeight, 10) || 400) - (opts.weightDelta ?? 0));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${cs.fontStyle} ${weight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.fillStyle = cs.color;
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  const m = ctx.measureText("Hg");
  const ascent = m.fontBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent;
  const range = document.createRange();
  // word by word: each word sits on its own line box as the browser laid it out
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    range.setStart(node, match.index);
    range.setEnd(node, match.index + match[0].length);
    const rects = range.getClientRects();
    if (!rects.length) continue;
    const rr = local(f, rects[0]);
    const y = rr.y + (rr.h - (ascent + descent)) / 2 + ascent;
    ctx.fillText(cs.textTransform === "uppercase" ? match[0].toUpperCase() : match[0], rr.x, y);
  }
  range.detach();
  ctx.restore();
}
