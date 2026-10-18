#!/usr/bin/env node
// Fold + Apple Pay process captures in real Chromium (interactive website mode).
//   node tests/capture-fold.mjs [--url http://localhost:3000] [--out artifacts/visual-audit/fold2] [--size 1440x900]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const base = args.url ?? "http://localhost:3000";
const out = resolve(args.out ?? "artifacts/visual-audit/fold2");
const [w, h] = (args.size ?? "1440x900").split("x").map(Number);
mkdirSync(out, { recursive: true });
// keep in sync with src/lib/roco-bank/scroll-map.ts
const SEG = { TRANSITION: 1400, HOLD: 320, PULL: 900, FOLD: 1300, SHIFT: 520 };
const H1 = SEG.TRANSITION + SEG.HOLD, P1 = H1 + SEG.PULL, F1 = P1 + SEG.FOLD;
const lineY = 0.48 * h;
// card i becomes active when column top + 289 + i*156 <= 0.48 vh, column top = vh - processPx
const cardAt = (i, sub = 0.5) => F1 + h - lineY + 289 + i * 156 + sub * 156;
const shots = [
  ["01_pull_30", H1 + SEG.PULL * 0.3],
  ["02_pull_80", H1 + SEG.PULL * 0.8],
  ["03_pull_100", P1],
  ["04_fold_40", P1 + SEG.FOLD * 0.4],
  ["05_fold_70", P1 + SEG.FOLD * 0.7],
  ["06_fold_100", F1],
  ["07_shift_100", F1 + SEG.SHIFT],
  ["08_step1_wake", cardAt(0, 0.8)],
  ["09_step2_cards", cardAt(1, 0.85)],
  ["10_step3_choose", cardAt(2, 0.9)],
  ["11_step4_pay", cardAt(3, 0.7)],
  ["12_step5_faceid", cardAt(4, 0.55)],
  ["13_step6_done", cardAt(5, 0.95)],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.documentElement.dataset.foldReady === "true", null, { timeout: 90000 });
await page.waitForTimeout(1500);
for (const [name, y] of shots) {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: join(out, `${name}.png`) });
}
// click-to-pay from the Pay step
await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(cardAt(3, 0.3)));
await page.waitForTimeout(1300);
await page.getByRole("button", { name: "Click to pay" }).click();
for (const ms of [500, 1200, 1900, 2800]) {
  await page.waitForTimeout(ms === 500 ? 500 : 700 + (ms === 2800 ? 200 : 0));
  await page.screenshot({ path: join(out, `14_click_${ms}ms.png`) });
}
console.log(`saved to ${out}`);
console.log(logs.length ? logs.slice(0, 15).join("\n") : "no console errors");
await browser.close();
