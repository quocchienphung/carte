#!/usr/bin/env node
// Stage-2 font forensics: variable-weight sweep of the best stage-1 families.
// Each render: cap height matched to the reference, letter-spacing solved to the reference width.
//   node scripts/forensics/font_sweep.mjs OUT_DIR
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
mkdirSync(out, { recursive: true });
// optional 2nd arg: JSON config {"hrefs": [css urls], "families": {"Name": {"settings": ["normal"]}}}
const extra = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : null;
const BUILTIN = {
  "Inter": { css: "Inter:opsz,wght@14..32,100..900", settings: ["'opsz' 32", "'opsz' 14"] },
  "Inter Tight": { css: "Inter+Tight:wght@100..900", settings: ["normal"] },
  "Hubot Sans": { css: "Hubot+Sans:wght@200..900", settings: ["normal"] },
  "Albert Sans": { css: "Albert+Sans:wght@100..900", settings: ["normal"] },
  "Plus Jakarta Sans": { css: "Plus+Jakarta+Sans:wght@200..800", settings: ["normal"] },
  "Manrope": { css: "Manrope:wght@200..800", settings: ["normal"] },
  "Onest": { css: "Onest:wght@100..900", settings: ["normal"] },
  "Hanken Grotesk": { css: "Hanken+Grotesk:wght@100..900", settings: ["normal"] },
  "Geist": { css: "Geist:wght@100..900", settings: ["normal"] },
  "Public Sans": { css: "Public+Sans:wght@100..900", settings: ["normal"] },
  "Figtree": { css: "Figtree:wght@300..900", settings: ["normal"] },
};
const TARGETS = {
  professional: { text: "Professional", cap: 45, width: 311, weights: [150, 175, 200, 225, 250, 275, 300, 350] },
  roco: { text: "Roco", cap: 45, width: 138, weights: [350, 400, 450, 500, 550, 600] },
  para: { text: "Roco.bank Introduces A Bank Card Crafted For Professionals Who Demand", cap: 12.4, width: 587,
    weights: [300, 350, 400, 450, 500] },
};
const FAMILIES = extra ? extra.families : BUILTIN;
const hrefs = extra ? extra.hrefs
  : [`https://fonts.googleapis.com/css2?${Object.values(BUILTIN).map((f) => `family=${f.css}`).join("&")}&display=block`];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 300 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head>${hrefs.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
<style>body{margin:0;background:#fff}#s{position:absolute;left:20px;top:20px;white-space:nowrap;color:#000;line-height:1}</style>
</head><body><span id="s"></span></body></html>`, { waitUntil: "networkidle" });
const results = [];
for (const [family, cfg] of Object.entries(FAMILIES)) {
  for (const settings of cfg.settings) {
    for (const [key, tg] of Object.entries(TARGETS)) {
      for (const weight of tg.weights) {
        await page.evaluate(async ({ family, weight }) => { await document.fonts.load(`${weight} 50px "${family}"`); }, { family, weight });
        // measure with the DOM (canvas ignores font-variation-settings)
        const m = await page.evaluate(({ family, weight, settings, tg }) => {
          const s = document.getElementById("s");
          Object.assign(s.style, { fontFamily: `"${family}"`, fontWeight: String(weight), fontVariationSettings: settings,
            fontSize: "100px", letterSpacing: "0px" });
          s.textContent = "H";
          // cap height via a probe canvas of the rendered glyph is not available; use Range rects on a tall glyph
          const c = document.createElement("canvas"); c.width = 200; c.height = 200;
          const ctx = c.getContext("2d");
          ctx.font = `${weight} 100px "${family}"`;
          const capRatio = ctx.measureText("H").actualBoundingBoxAscent / 100;
          const size = tg.cap / capRatio;
          s.style.fontSize = `${size}px`;
          s.textContent = tg.text;
          const w0 = s.getBoundingClientRect().width;
          const n = [...tg.text].length;
          const ls = (tg.width - w0) / n; // letter-spacing applies after every glyph in Chromium
          s.style.letterSpacing = `${ls}px`;
          return { capRatio, size, naturalWidth: w0, letterSpacingPx: ls, letterSpacingEm: ls / size };
        }, { family, weight, settings, tg });
        const file = join(out, `${key}__${family.replace(/ /g, "_")}__${settings.replace(/[^a-z0-9]/gi, "")}__${weight}.png`);
        await page.locator("#s").screenshot({ path: file });
        results.push({ family, settings, key, weight, file, ...m });
      }
    }
  }
  process.stdout.write(`${family} `);
}
writeFileSync(join(out, "renders.json"), JSON.stringify(results, null, 1));
await browser.close();
console.log(`\n${results.length} renders`);
