import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto("https://plinthdev.framer.website/", { waitUntil: "networkidle", timeout: 90000 });
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(80); }
await p.evaluate(() => scrollTo(0, 5300)); await p.waitForTimeout(1200);
const data = await p.evaluate(() => {
  const pick = (el) => { const c = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { text: (el.innerText || "").slice(0, 60), x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height),
      font: c.fontFamily, size: c.fontSize, weight: c.fontWeight, lh: c.lineHeight, ls: c.letterSpacing, color: c.color, bg: c.backgroundColor,
      border: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor} | L ${c.borderLeftWidth} ${c.borderLeftColor} | R ${c.borderRightWidth} ${c.borderRightColor}`,
      radius: c.borderRadius, shadow: c.boxShadow, opacity: c.opacity, transform: c.transform, transition: c.transition, tt: c.textTransform }; };
  const h2 = [...document.querySelectorAll("h2")].find((e) => /what actually happens/i.test(e.innerText));
  let sec = h2; while (sec.parentElement && sec.getBoundingClientRect().height < 700) sec = sec.parentElement;
  const nodes = [...sec.querySelectorAll("*")].filter((e) => {
    const t = (e.innerText || "").trim(); return t && e.children.length === 0;
  });
  const steps = [...sec.querySelectorAll("*")].filter((e) => /^0[1-6]\s*\n/.test((e.innerText || "").trim()) && e.getBoundingClientRect().height < 200 && e.getBoundingClientRect().height > 60);
  const uniq = steps.filter((e) => !steps.some((o) => o !== e && e.contains(o)));
  return { section: pick(sec), leaves: nodes.slice(0, 40).map(pick), stepCards: uniq.map(pick),
           bgImage: getComputedStyle(sec).backgroundImage.slice(0, 300) };
});
writeFileSync(`${out}/styles.json`, JSON.stringify(data, null, 1));
await p.screenshot({ path: `${out}/hi_5300.png` });
console.log(JSON.stringify(data, null, 1).slice(0, 9000));
await b.close();
