#!/usr/bin/env node
// Measures text coverage of the device's inner-screen texture (drawn with candidate weights) vs. the
// DOM bento as the browser shows it, for several text lines. Prints ratios per weight pair.
//   node tests/calibrate-screen-weight.mjs [url]
import { chromium } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.evaluate(() => scrollTo(0, 1690));
await p.waitForTimeout(1500);
// DOM truth: screenshot of each text line's box (device px, as composited by the browser)
const lines = await p.evaluate(() =>
  [...document.querySelectorAll("[data-tile] [class*=line]")].map((el) => {
    const r = el.getBoundingClientRect();
    const spans = [...el.querySelectorAll("span")].filter((s) => !s.children.length);
    const parts = (spans.length ? spans : [el]).map((s) => ({ text: s.textContent, weight: +getComputedStyle(s).fontWeight }));
    const c = getComputedStyle(el);
    return { x: r.left, y: r.top, w: r.width, h: r.height, size: parseFloat(c.fontSize), ls: parseFloat(c.letterSpacing) || 0, parts };
  }),
);
const shots = [];
for (const l of lines) {
  const buf = await p.screenshot({ clip: { x: l.x - 2, y: l.y - 2, width: l.w + 4, height: l.h + 4 } });
  shots.push(buf.toString("base64"));
}
const res = await p.evaluate(async ({ lines, shots }) => {
  await document.fonts.ready;
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-albert").trim();
  const load = (b64) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
  const covOf = (ctx, w, h) => { const d = ctx.getImageData(0, 0, w, h).data; let bg = 255, s = 0; for (let i = 0; i < d.length; i += 4) bg = Math.min(bg, d[i]); for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; if (Math.min(d[i], d[i + 1], d[i + 2]) > 150 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 40) s += v; } return s; };
  const fs = 900 / 1024; // frame scale at 1440×900
  const out = {};
  for (const [lo, md] of [[330, 500], [300, 470], [280, 450], [260, 430], [240, 410]]) {
    let domSum = 0, cvSum = 0;
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i]; const img = await load(shots[i]);
      const W = img.width, H = img.height;
      const a = document.createElement("canvas"); a.width = W; a.height = H; const ac = a.getContext("2d"); ac.drawImage(img, 0, 0);
      // texture path: same line drawn on the dark tile colour at the device-px scale, white text
      const c = document.createElement("canvas"); c.width = W; c.height = H; const cc = c.getContext("2d");
      cc.drawImage(img, 0, 0); // keep the art background identical, then repaint text region bg by sampling
      const k = 2 * fs;
      // estimate bg: draw the DOM shot, then cover text with the min-filtered background is complex;
      // instead compare text-only coverage on a flat dark background for both
      const flat = (ctx, drawText) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#202020"; ctx.fillRect(0, 0, W, H); drawText(); };
      flat(cc, () => {
        cc.setTransform(k, 0, 0, k, 0, 0); cc.fillStyle = "#fff"; cc.textBaseline = "alphabetic"; cc.letterSpacing = L.ls + "px";
        let x = 2 / k; for (const pt of L.parts) { const wgt = pt.weight === 500 ? md : pt.weight === 330 ? lo : pt.weight; cc.font = `${wgt} ${L.size}px ${fam}`; cc.fillText(pt.text, x, 2 / k + 0.85 * L.size); x += cc.measureText(pt.text).width; }
      });
      // DOM text on the same flat background: re-render via an offscreen DOM clone is not possible
      // here, so measure the DOM shot's white-ink coverage directly (art behind is dark/mid-grey)
      domSum += covOf(ac, W, H); cvSum += covOf(cc, W, H);
    }
    out[`${lo}/${md}`] = +(cvSum / domSum).toFixed(3);
  }
  return out;
}, { lines, shots });
console.log("canvas/DOM coverage by light/medium weight:", JSON.stringify(res));
await b.close();
