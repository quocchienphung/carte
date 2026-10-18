import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const MONO = ["Space Mono", "DM Mono", "IBM Plex Mono", "JetBrains Mono", "Geist Mono", "Roboto Mono", "Fragment Mono",
  "Martian Mono", "Azeret Mono", "Red Hat Mono", "Spline Sans Mono", "Source Code Pro", "Fira Code", "Ubuntu Mono",
  "Overpass Mono", "Sometype Mono", "Chivo Mono", "Courier Prime", "Noto Sans Mono", "PT Mono", "Anonymous Pro", "Cousine", "Xanh Mono", "Major Mono Display"];
const href = "https://fonts.googleapis.com/css2?" + MONO.map((f) => `family=${f.replace(/ /g, "+")}`).join("&") + "&display=block";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 100 } });
await p.setContent(`<html><head><link rel="stylesheet" href="${href}"><style>body{margin:0;background:#f6f6f6}#s{position:absolute;left:10px;top:10px;white-space:nowrap;color:#999;line-height:1}</style></head><body><span id="s">$29,000.00</span></body></html>`, { waitUntil: "networkidle" });
const rows = [];
for (const f of MONO) {
  await p.evaluate(async (f) => document.fonts.load(`400 20px "${f}"`), f);
  const m = await p.evaluate((f) => {
    const ctx = document.createElement("canvas").getContext("2d"); ctx.font = `400 100px "${f}"`;
    const capR = ctx.measureText("0").actualBoundingBoxAscent / 100;
    const size = 9.2 / capR; const s = document.getElementById("s");
    Object.assign(s.style, { fontFamily: `"${f}"`, fontSize: `${size}px`, letterSpacing: "0px" });
    const w0 = s.getBoundingClientRect().width; const ls = (74 - w0) / 10; s.style.letterSpacing = `${ls}px`;
    return { size, ls, lsEm: ls / size };
  }, f);
  const file = `${out}/${f.replace(/ /g, "_")}.png`;
  await p.locator("#s").screenshot({ path: file }); rows.push({ family: f, file, ...m });
}
writeFileSync(`${out}/mono.json`, JSON.stringify(rows, null, 1)); await b.close();
