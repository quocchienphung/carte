// Run against a running site: node tests/carte/hero-regression.mjs [url] [--hmr]
import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const base = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "http://localhost:3000";
const out = "artifacts/visual-audit/carte/hero-regression";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];

async function assertHero(page) {
  await page.waitForFunction(() => document.querySelector("#top")?.style.transform === "translate3d(0px, 0px, 0px)");
  const state = await page.locator("[data-roco-stage]").evaluate((stage) => {
    const wrap = stage.firstElementChild;
    const viewport = wrap.firstElementChild;
    return {
      handoff: wrap.getAttribute("data-handoff"),
      transform: wrap.style.transform,
      visibility: getComputedStyle(wrap).visibility,
      background: getComputedStyle(viewport).backgroundColor,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  assert.equal(state.handoff, "", "Hero must leave the device handoff state");
  assert.equal(state.transform, "", "Hero must restore its unscaled layout");
  assert.equal(state.visibility, "visible");
  assert.equal(state.background, "rgb(255, 255, 255)", "Hero background must return to white");
  assert.equal(state.overflow, false, "No horizontal page overflow");
}

async function scrollToPull(page, y, pull) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForFunction((value) => document.querySelector("[data-status]")?.style.getPropertyValue("--pull") === value, pull);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.replayReady === "true");
  await page.waitForFunction(() => document.querySelector('[data-status="ready"]'), null, { timeout: 120000 });
  await assertHero(page);

  for (const viewport of [{ width: 1440, height: 900 }, { width: 2048, height: 1016 }]) {
    await page.setViewportSize(viewport);
    await scrollToPull(page, 2100, "0.4222");
    // Near the start of the device transition, scale rounds to 1.00000 while still differing
    // from 1 in floating point. Previously its cache key prevented the white reset at the top.
    await scrollToPull(page, 1721, "0.0011");
    await scrollToPull(page, 0, "0.0000");
    await assertHero(page);
    await page.screenshot({ path: `${out}/desktop-${viewport.width}.png` });
  }

  if (process.argv.includes("--hmr")) {
    // A temporary comment triggers a real Fast Refresh (a timestamp-only touch is ignored).
    // Remove only that comment afterward, preserving any concurrent source edits.
    await scrollToPull(page, 2100, "0.4222");
    await page.evaluate(() => { window.__heroRegressionDocument = true; });
    const refreshed = page.waitForEvent("console", { predicate: (message) => message.text().includes("[Fast Refresh] done") });
    const source = fileURLToPath(new URL("../../src/components/sites/roco-bank/RocoBankExperience.tsx", import.meta.url));
    const probe = "\n// Carte hero Fast Refresh regression probe.\n";
    try {
      appendFileSync(source, probe);
      await refreshed;
    } finally {
      const current = readFileSync(source, "utf8");
      if (current.includes(probe)) {
        const restored = page.waitForEvent("console", { predicate: (message) => message.text().includes("[Fast Refresh] done") });
        writeFileSync(source, current.replace(probe, ""));
        await restored;
      }
    }
    assert.equal(await page.evaluate(() => window.__heroRegressionDocument), true, "Fast Refresh must preserve the document");
    await scrollToPull(page, 0, "0.0000");
    await assertHero(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("group", { name: "Demo card designs" }).evaluate(async (cards) => {
    await Promise.all([
      ...cards.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)),
      ...Array.from(cards.querySelectorAll("img"), (image) => image.decode()),
    ]);
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  await page.screenshot({ path: `${out}/mobile.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await assertHero(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("h1")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await assertHero(page);
  await page.close();
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(`Hero regression passed; screenshots: ${out}`);
} finally {
  await browser.close();
}
