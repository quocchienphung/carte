import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto("https://plinthdev.framer.website/", { waitUntil: "networkidle", timeout: 90000 });
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(80); }
const samples = [];
// sample active-card index + opacities over scroll to learn the trigger mapping
for (let y = 4900; y <= 6100; y += 50) {
  await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(450);
  const s = await p.evaluate(() => {
    const h2 = [...document.querySelectorAll("h2")].find((e) => /what actually happens/i.test(e.innerText));
    let sec = h2; while (sec.parentElement && sec.getBoundingClientRect().height < 700) sec = sec.parentElement;
    const steps = [...sec.querySelectorAll("*")].filter((e) => /^0[1-6]\s*\n/.test((e.innerText || "").trim()) && e.getBoundingClientRect().height < 200 && e.getBoundingClientRect().height > 60);
    const cards = steps.filter((e) => !steps.some((o) => o !== e && e.contains(o)));
    return cards.map((c) => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect();
      return { op: +(+cs.opacity).toFixed(2), bg: cs.backgroundColor, top: Math.round(r.top) }; });
  });
  samples.push({ y, s });
}
const dom = await p.evaluate(() => {
  const h2 = [...document.querySelectorAll("h2")].find((e) => /what actually happens/i.test(e.innerText));
  let sec = h2; while (sec.parentElement && sec.getBoundingClientRect().height < 700) sec = sec.parentElement;
  const steps = [...sec.querySelectorAll("*")].filter((e) => /^0[1-6]\s*\n/.test((e.innerText || "").trim()) && e.getBoundingClientRect().height < 200 && e.getBoundingClientRect().height > 60);
  const card = steps.filter((e) => !steps.some((o) => o !== e && e.contains(o)))[0];
  const desc = (el, d = 0) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    let s = `${"  ".repeat(d)}<${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} bg=${cs.backgroundColor} bd=${cs.borderTopWidth}/${cs.borderRightWidth}/${cs.borderBottomWidth}/${cs.borderLeftWidth} ${cs.borderTopColor} rad=${cs.borderRadius} pad=${cs.padding} op=${cs.opacity} pos=${cs.position}>${el.children.length ? "" : " " + (el.innerText || "").slice(0, 30)}\n`;
    for (const c of el.children) s += desc(c, d + 1); return s; };
  return desc(card.parentElement) + "\nBODY BG " + getComputedStyle(document.body).backgroundColor + " SEC BG " + getComputedStyle(sec.parentElement).backgroundColor;
});
writeFileSync(`${out}/card_dom.txt`, dom);
writeFileSync(`${out}/scroll_states.json`, JSON.stringify(samples, null, 1));
console.log(dom.slice(0, 5000));
for (const s of samples) console.log(s.y, s.s.map((c) => `${c.op}${c.bg.includes("255, 255, 255") ? "W" : ""}@${c.top}`).join(" "));
await b.close();
