#!/usr/bin/env node
// Quick evidence shots during the Carte build.
//   node tests/carte/shot.mjs <outDir> lab|bento|bentoB|mobile
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const [out, what = "bento"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const errs = [];
const page = async (opts) => {
  const p = await b.newPage(opts);
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  return p;
};
if (what === "lab") {
  const p = await page({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/dev/carte-reference-lab", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/lab_full.png`, fullPage: true });
}
if (what === "bento" || what === "bentoB") {
  const p = await page({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  await p.evaluate(() => window.scrollTo(0, 1560));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${out}/bento_A.png` });
  if (what === "bentoB") {
    await p.hover('[data-tile="customers"]');
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${out}/bento_B.png` });
  }
}
if (what === "mobile") {
  const p = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/mobile_full.png`, fullPage: true });
}
await b.close();
console.log(errs.join("\n") || "no console errors");
