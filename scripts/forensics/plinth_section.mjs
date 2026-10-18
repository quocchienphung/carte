import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://plinthdev.framer.website/", { waitUntil: "networkidle", timeout: 90000 });
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(120); }
const info = await p.evaluate(() => {
  const h = [...document.querySelectorAll("h1,h2,h3")].find((e) => /what actually happens/i.test(e.innerText));
  if (!h) return null;
  // climb to a section-sized ancestor
  let sec = h;
  while (sec.parentElement && sec.getBoundingClientRect().height < 700) sec = sec.parentElement;
  const r = sec.getBoundingClientRect(); const hr = h.getBoundingClientRect();
  return { heading: h.textContent, headingTop: hr.top + scrollY, secTop: r.top + scrollY, secH: r.height, secW: r.width, secLeft: r.left,
           text: sec.innerText, tag: sec.tagName, cls: sec.className };
});
writeFileSync(`${out}/section.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify({ ...info, text: info?.text.slice(0, 2500) }, null, 1));
if (info) {
  // screenshots while scrolling through the section
  const start = info.secTop - 200, end = info.secTop + info.secH - 500;
  let i = 0;
  for (let y = start; y <= end; y += 200) {
    await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/scroll_${String(i++).padStart(2, "0")}_${Math.round(y)}.png` });
  }
  const html = await p.evaluate(() => {
    let sec = [...document.querySelectorAll("h1,h2,h3")].find((e) => /what actually happens/i.test(e.innerText)); while (sec.parentElement && sec.getBoundingClientRect().height < 700) sec = sec.parentElement;
    return sec.outerHTML;
  });
  writeFileSync(`${out}/section.html`, html);
}
await b.close();
