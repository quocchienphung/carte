#!/usr/bin/env node
// Capture deterministic replay frames of the running app in real Chromium (Playwright).
//
//   node tests/capture-app.mjs [--url http://localhost:3210] [--out artifacts/visual-audit/run-x]
//                              [--viewport 1600x1200] [--times 0,0.4,...] [--mode replay|interactive]
//
// For every timestamp it loads `/?demo=1&t=<t>` (replay mode seeks before first paint), waits for
// document.fonts.ready, every <img> decoded and `html[data-replay-ready]`, then saves a PNG.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const base = args.url ?? "http://localhost:3210";
const out = resolve(args.out ?? "artifacts/visual-audit/latest");
const [vw, vh] = (args.viewport ?? "1600x1200").split("x").map(Number);
export const CHECKPOINTS = [0.0, 0.4, 0.8, 1.2, 1.6, 2.2, 3.0, 4.0, 4.3, 4.6, 5.0, 5.4, 6.0, 6.6, 7.2, 7.5, 8.0, 8.5, 9.5];
const times = args.times ? args.times.split(",").map(Number) : CHECKPOINTS;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const consoleLines = [];
page.on("console", (m) => consoleLines.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => consoleLines.push(`[pageerror] ${e.message}`));
const results = [];
for (const t of times) {
  const frame = Math.round(t * 30);
  const url = `${base}/?demo=1&t=${t}`;
  const started = Date.now();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.replayReady === "true", null, { timeout: 30000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)));
  });
  const name = `app_t${t.toFixed(3)}_f${String(frame).padStart(3, "0")}.png`;
  const file = join(out, name);
  await page.screenshot({ path: file, fullPage: false });
  results.push({ t, frame, file, url, ms: Date.now() - started });
  console.log(file);
}
writeFileSync(join(out, "capture.json"), JSON.stringify({ base, viewport: [vw, vh], results, console: consoleLines }, null, 1));
if (consoleLines.length) console.log("console:", consoleLines.slice(0, 20).join("\n"));
await browser.close();
