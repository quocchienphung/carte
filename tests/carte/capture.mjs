#!/usr/bin/env node
// Carte evidence capture: hero → bento → hand-off → fold → process column (desktop) and the
// responsive page (mobile). Screens go to the ignored artifacts/visual-audit/carte/<label>/.
//   node tests/carte/capture.mjs <label> [url]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const label = process.argv[2] ?? "run";
const base = process.argv[3] ?? "http://localhost:3000";
const out = `artifacts/visual-audit/carte/${label}`;
mkdirSync(out, { recursive: true });
const errors = [];
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

async function desktop(w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on("console", (m) => m.type() === "error" && errors.push(`[${w}x${h}] ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`[${w}x${h}] pageerror ${e.message}`));
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(4200);
  await p.screenshot({ path: `${out}/d${w}_01_hero.png` });
  await p.evaluate(() => window.scrollTo(0, 1400 + 160));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${out}/d${w}_02_bento.png` });
  await p.waitForFunction(() => document.documentElement.dataset.foldReady === "true", null, { timeout: 120000 }).catch(() => errors.push("fold not ready"));
  const H1 = 1400 + 320;
  const shots = [["03_pull20", H1 + 180], ["04_pull45", H1 + 405], ["05_pull100", H1 + 900], ["06_fold50", H1 + 900 + 650], ["07_closed", H1 + 900 + 1300], ["08_process", H1 + 900 + 1300 + 700], ["09_process_end", H1 + 900 + 1300 + 1500]];
  for (const [name, y] of shots) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/d${w}_${name}.png` });
  }
  await p.close();
}

async function mobile(w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  p.on("console", (m) => m.type() === "error" && errors.push(`[m${w}] ${m.text()}`));
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/m${w}_full.png`, fullPage: true });
  await p.close();
}

await desktop(1440, 900);
await mobile(390, 844);
await b.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
console.log("saved", out);
