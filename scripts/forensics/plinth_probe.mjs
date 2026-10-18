import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://plinthdev.framer.website/", { waitUntil: "networkidle", timeout: 90000 });
// scroll through to trigger lazy content
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 600) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(150); }
const found = await p.evaluate(() => {
  const all = [...document.querySelectorAll("h1,h2,h3,h4,p,span,div")];
  const el = all.find((e) => /what actually happens/i.test(e.textContent || "") && e.children.length < 4);
  if (!el) return null;
  let sec = el;
  while (sec.parentElement && sec.parentElement !== document.body && sec.getBoundingClientRect().height < 500) sec = sec.parentElement;
  const r = sec.getBoundingClientRect();
  return { text: el.textContent, top: r.top + scrollY, h: r.height, w: r.width, html: sec.outerHTML.length, sectionText: sec.innerText.slice(0, 3000) };
});
writeFileSync(`${out}/found.json`, JSON.stringify(found, null, 1));
console.log(JSON.stringify(found, null, 1)?.slice(0, 4000));
console.log("page height", H);
await b.close();
