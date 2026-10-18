#!/usr/bin/env node
// Measures the hero intro smoothness in interactive mode: rAF frame intervals, long tasks and
// (optionally) a Chrome trace for the first ~4 s after navigation.
//   node tests/perf-intro.mjs [--url http://localhost:3000] [--size 1440x900] [--trace out.json] [--cpu 1]
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const base = args.url ?? "http://localhost:3000";
const [w, h] = (args.size ?? "1440x900").split("x").map(Number);
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (args.cpu && args.cpu !== "1") await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(args.cpu) });
await page.addInitScript(() => {
  const w = window;
  w.__perf = { frames: [], long: [], marks: {} };
  const t0 = performance.now();
  const loop = (t) => {
    w.__perf.frames.push(t - t0);
    if (t - t0 < 5000) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__perf.long.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
  } catch {}
});
if (args.trace) await browser.startTracing(page, { path: args.trace, screenshots: false, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline.frame", "v8.execute", "blink.user_timing"] });
await page.goto(`${base}/`, { waitUntil: "commit" });
await page.waitForTimeout(5200);
if (args.trace) await browser.stopTracing();
const perf = await page.evaluate(() => window.__perf);
const iv = perf.frames.slice(1).map((t, i) => t - perf.frames[i]);
const jank = iv.map((d, i) => ({ at: Math.round(perf.frames[i]), d: Math.round(d) })).filter((x) => x.d > 25);
const pct = (p) => [...iv].sort((a, b) => a - b)[Math.floor(iv.length * p)]?.toFixed(1);
console.log(`frames ${iv.length}  median ${pct(0.5)} ms  p95 ${pct(0.95)} ms  max ${Math.max(...iv).toFixed(1)} ms`);
console.log(`dropped (>25 ms) intervals: ${jank.length}`, jank.slice(0, 40).map((j) => `${j.at}:${j.d}`).join(" "));
console.log(`long tasks: ${perf.long.length}`, perf.long.map((l) => `${l.start}+${l.dur}`).join(" "));
writeFileSync("artifacts/visual-audit/perf-intro.json", JSON.stringify({ iv, jank, long: perf.long }, null, 1));
await browser.close();
