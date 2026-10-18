#!/usr/bin/env node
// Bento → device hand-off: DOM before the pull vs. the pull at several points (DOM glued to the
// inner screen, crossfade, WebGL). Saves screenshots for comparison.
//   node tests/check-handoff.mjs [url] [dpr]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3000";
const dpr = Number(process.argv[3] ?? 2);
const out = "artifacts/visual-audit/handoff";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForFunction(() => document.documentElement.dataset.foldReady === "true", null, { timeout: 90000 });
const H1 = 1400 + 320;
for (const [name, pull] of [["a_dom", -0.03], ["b_pull05", 0.05], ["c_pull12", 0.12], ["d_pull22", 0.22], ["e_pull35", 0.35]]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), Math.round(H1 + 900 * pull));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${name}.png` });
}
await b.close();
console.log("ok");
