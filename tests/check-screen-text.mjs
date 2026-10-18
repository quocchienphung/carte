#!/usr/bin/env node
// Text weight on the device's inner screen vs. the DOM bento.
// 1) DOM bento at full size (just before the pull); 2) the WebGL screen at pull P (device small).
// The DOM shot is area-downscaled to the device-screen size measured from the same tile in both
// shots (scripts compare ink in tests/check-screen-text.py).
//   node tests/check-screen-text.mjs [url] [pull] [dpr]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3000";
const pull = Number(process.argv[3] ?? 0.7);
const dpr = Number(process.argv[4] ?? 2);
const out = "artifacts/visual-audit/screen-text";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 1200));
await p.waitForFunction(() => document.documentElement.dataset.foldReady === "true", null, { timeout: 90000 });
const H1 = 1400 + 320;
for (const [name, y] of [["dom", H1 - 30], ["gl", H1 + 900 * pull]]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), Math.round(y));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${name}.png` });
}
await b.close();
console.log("ok");
