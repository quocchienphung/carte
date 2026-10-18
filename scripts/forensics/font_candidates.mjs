#!/usr/bin/env node
// Font forensics: render candidate Google fonts in real Chromium, matched to the reference
// cap height, solve letter-spacing so the measured word width matches, and save glyph renders
// for scoring by font_score.py.
//
//   node scripts/forensics/font_candidates.mjs OUT_DIR
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] ?? "font-out";
mkdirSync(out, { recursive: true });

const SANS = [
  "Inter", "Inter Tight", "Manrope", "DM Sans", "Figtree", "Geist", "Onest", "Instrument Sans",
  "Albert Sans", "Hanken Grotesk", "Schibsted Grotesk", "Host Grotesk", "Public Sans", "Plus Jakarta Sans",
  "Work Sans", "Archivo", "IBM Plex Sans", "Be Vietnam Pro", "Golos Text", "Funnel Sans", "Urbanist",
  "Outfit", "Sora", "Rethink Sans", "Familjen Grotesk", "Bricolage Grotesque", "Space Grotesk", "Mona Sans",
  "Hubot Sans", "Wix Madefor Text", "Red Hat Display", "Libre Franklin", "Karla", "Satoshi-fallback",
];
const MONO = ["Space Mono", "DM Mono", "IBM Plex Mono", "JetBrains Mono", "Geist Mono", "Roboto Mono",
  "Fragment Mono", "Martian Mono", "Azeret Mono", "Red Hat Mono", "Spline Sans Mono", "Source Code Pro",
  "Fira Code", "Ubuntu Mono", "Courier Prime", "Overpass Mono", "Sometype Mono", "Chivo Mono"];

// Reference targets measured on f085 (video px == CSS px)
const TARGETS = {
  professional: { text: "Professional", weight: 300, cap: 45, width: 311 },
  roco: { text: "Roco", weight: 500, cap: 45, width: null },
  para: { text: "Roco.bank Introduces A Bank Card Crafted For Professionals Who Demand", weight: 400, cap: 12.4, width: 587 },
  amount: { text: "$32,100.00", weight: 400, cap: 9, width: null, mono: true },
};

const fam = (f) => f.replace(/ /g, "+");
const sansCss = SANS.filter((f) => !f.includes("fallback")).map((f) => `family=${fam(f)}:wght@300;400;500;600;700`);
const monoCss = MONO.map((f) => `family=${fam(f)}:wght@400;500`);
const css = [...sansCss, ...monoCss];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 400 }, deviceScaleFactor: 1 });
// Google Fonts CSS2 accepts many families per request; chunk to keep URLs short
const links = [];
for (let i = 0; i < css.length; i += 8) {
  links.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${css.slice(i, i + 8).join("&")}&display=block">`);
}
await page.setContent(`<!doctype html><html><head>${links.join("")}
<style>body{margin:0;background:#fff} #s{position:absolute;left:20px;top:20px;white-space:nowrap;color:#000;
font-kerning:normal;text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}</style></head>
<body><span id="s"></span><canvas id="c" width="10" height="10"></canvas></body></html>`, { waitUntil: "networkidle" });

const results = [];
const families = [...SANS.filter((f) => !f.includes("fallback")), ...MONO];
for (const family of families) {
  const isMono = MONO.includes(family);
  // force-load the weights used
  await page.evaluate(async (f) => {
    for (const w of [300, 400, 500]) await document.fonts.load(`${w} 40px "${f}"`);
  }, family);
  const loaded = await page.evaluate((f) => document.fonts.check(`400 40px "${f}"`), family);
  for (const [key, tg] of Object.entries(TARGETS)) {
    if (Boolean(tg.mono) !== isMono) continue;
    const m = await page.evaluate(({ f, tg }) => {
      const ctx = document.getElementById("c").getContext("2d");
      ctx.font = `${tg.weight} 100px "${f}"`;
      const H = ctx.measureText("H");
      const capRatio = H.actualBoundingBoxAscent / 100;
      const size = tg.cap / capRatio;
      ctx.font = `${tg.weight} ${size}px "${f}"`;
      const w = ctx.measureText(tg.text).width;
      const n = [...tg.text].length;
      const ls = tg.width ? (tg.width - w) / (n - 1) : 0;
      return { capRatio, size, naturalWidth: w, letterSpacingPx: ls, letterSpacingEm: ls / size };
    }, { f: family, tg });
    await page.evaluate(({ f, tg, m }) => {
      const s = document.getElementById("s");
      s.textContent = tg.text;
      s.style.fontFamily = `"${f}"`;
      s.style.fontWeight = String(tg.weight);
      s.style.fontSize = `${m.size}px`;
      s.style.letterSpacing = `${m.letterSpacingPx}px`;
      s.style.lineHeight = "1";
    }, { f: family, tg, m });
    const file = join(out, `${key}__${family.replace(/ /g, "_")}.png`);
    await page.locator("#s").screenshot({ path: file, omitBackground: false });
    results.push({ family, key, loaded, file, ...m });
  }
  process.stdout.write(`${family}${loaded ? "" : " (NOT LOADED)"}  `);
}
writeFileSync(join(out, "renders.json"), JSON.stringify(results, null, 1));
await browser.close();
console.log(`\n${results.length} renders -> ${out}`);
