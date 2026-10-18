#!/usr/bin/env node
// Full-line typography test: render the hero headline lines (mixed weights) and paragraph
// line 1 in finalist families at the reference metrics, for overlay scoring by font_lines.py.
//   node scripts/forensics/font_lines.mjs OUT_DIR
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
mkdirSync(out, { recursive: true });
const hrefs = [
  "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@100..900&family=Inter+Tight:wght@100..900&family=Manrope:wght@200..800&family=Onest:wght@100..900&family=Inter:opsz,wght@14..32,100..900&display=block",
  "https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600&f[]=satoshi@300,400,500,700&display=block",
];
// [family, light, medium, body]
const FINALISTS = [
  ["Albert Sans", 200, 400, 450], ["Albert Sans", 250, 400, 450], ["General Sans", 300, 500, 400],
  ["General Sans", 300, 400, 500], ["Inter Tight", 250, 400, 400], ["Manrope", 250, 450, 450],
  ["Onest", 250, 400, 400], ["Inter", 250, 400, 400],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 300 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head>${hrefs.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
<style>body{margin:0;background:#fff;color:#000} .l{position:absolute;left:0;white-space:nowrap;line-height:1}
#a{top:10px} #b{top:100px} #c{top:200px}</style></head><body>
<div class="l" id="a"><span class="m">Roco</span><span class="t">.bank</span></div>
<div class="l" id="b"><span class="t">Professional </span><span class="m">bank</span><span class="t"> card</span></div>
<div class="l" id="c">Roco.bank Introduces A Bank Card Crafted For Professionals Who Demand</div>
</body></html>`, { waitUntil: "networkidle" });
const rows = [];
for (const [family, light, medium, body] of FINALISTS) {
  for (const w of [light, medium, body]) await page.evaluate(async ({ family, w }) => document.fonts.load(`${w} 40px "${family}"`), { family, w });
  const m = await page.evaluate(({ family, light, medium, body }) => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${light} 100px "${family}"`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent / 100;
    const size = 45 / cap;
    ctx.font = `400 100px "${family}"`;
    const bodySize = 12.4 / (ctx.measureText("H").actualBoundingBoxAscent / 100);
    const set = (el, w, sz, ls) => Object.assign(el.style, { fontFamily: `"${family}"`, fontWeight: String(w), fontSize: `${sz}px`, letterSpacing: `${ls}px` });
    const a = document.getElementById("a"), b = document.getElementById("b"), c = document.getElementById("c");
    for (const el of [a, b]) {
      el.style.fontFamily = `"${family}"`; el.style.fontSize = `${size}px`;
      el.querySelectorAll(".t").forEach((s) => { s.style.fontWeight = String(light); });
      el.querySelectorAll(".m").forEach((s) => { s.style.fontWeight = String(medium); });
    }
    set(c, body, bodySize, 0);
    // solve one tracking value for line 2 (596 px wide in the reference) and apply to both lines
    b.style.letterSpacing = "0px";
    const w0 = b.getBoundingClientRect().width;
    const n = [..."Professional bank card"].length;
    const ls = (596 - w0) / n;
    a.style.letterSpacing = `${ls}px`; b.style.letterSpacing = `${ls}px`;
    const wc0 = c.getBoundingClientRect().width;
    const lsc = (587 - wc0) / [...c.textContent].length;
    c.style.letterSpacing = `${lsc}px`;
    return { size, bodySize, ls, lsEm: ls / size, lsc, lscEm: lsc / bodySize,
      l1: a.getBoundingClientRect().width, l2: b.getBoundingClientRect().width };
  }, { family, light, medium, body });
  const tag = `${family.replace(/ /g, "_")}_${light}_${medium}_${body}`;
  for (const id of ["a", "b", "c"]) await page.locator(`#${id}`).screenshot({ path: join(out, `${tag}_${id}.png`) });
  rows.push({ family, light, medium, body, tag, ...m });
  console.log(tag, JSON.stringify(m));
}
writeFileSync(join(out, "lines.json"), JSON.stringify(rows, null, 1));
await browser.close();
