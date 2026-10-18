import { chromium } from "@playwright/test";
const pages = ["", "platform", "docs", "trust", "pricing", "company"];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const pg of pages) {
  await p.goto(`https://plinthdev.framer.website/${pg}`, { waitUntil: "networkidle", timeout: 90000 });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 800) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(80); }
  const heads = await p.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map((h) => h.innerText.replace(/\s+/g, " ").trim()).filter(Boolean));
  console.log(`== /${pg}`); console.log(heads.filter((h) => /request|happens|lifecycle|journey/i.test(h)).join(" | ") || "(none)", "\n  all:", heads.slice(0, 40).join(" | ").slice(0, 900));
}
await b.close();
