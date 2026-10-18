#!/usr/bin/env node
// Screenshots of the interactive (full-screen website) mode: hero after the intro, mid-scroll, bento.
//   node tests/capture-interactive.mjs [--url http://localhost:3000] [--out artifacts/visual-audit/interactive]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const base = args.url ?? "http://localhost:3000";
const out = resolve(args.out ?? "artifacts/visual-audit/interactive");
mkdirSync(out, { recursive: true });
const sizes = (args.sizes ?? "1440x900,1920x1080").split(",").map((s) => s.split("x").map(Number));

const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.replayReady === "true", null, { timeout: 30000 });
  await page.waitForTimeout(3600); // intro plays once
  await page.screenshot({ path: join(out, `${w}x${h}_hero.png`) });
  const range = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (const [q, label] of [[0.45, "mid"], [1, "bento"]]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(range * q));
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(out, `${w}x${h}_${label}.png`) });
  }
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`${w}x${h}: saved; horizontal overflow=${overflowX}; errors=${errors.length ? errors.join(" | ") : "none"}`);
  await page.close();
}
await browser.close();
