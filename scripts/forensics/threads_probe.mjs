import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36" });
const page = await ctx.newPage();
const media = [];
page.on("response", async (r) => {
  const u = r.url(); const ct = r.headers()["content-type"] || "";
  if (ct.startsWith("video") || /\.mp4/.test(u) || ct.startsWith("image/") && /scontent|cdninstagram|fbcdn/.test(u)) media.push({ u, ct, len: r.headers()["content-length"] });
});
await page.goto("https://www.threads.com/@detailsdotso/post/DcqqcP7Gqb3", { waitUntil: "networkidle", timeout: 60000 }).catch(e => console.log("goto", e.message));
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}/page.png` });
const vids = await page.evaluate(() => [...document.querySelectorAll("video")].map(v => ({ src: v.currentSrc || v.src, poster: v.poster, w: v.videoWidth, h: v.videoHeight, d: v.duration })));
const text = await page.evaluate(() => document.body.innerText.slice(0, 2500));
writeFileSync(`${out}/probe.json`, JSON.stringify({ vids, media, text }, null, 1));
console.log(JSON.stringify(vids, null, 1)); console.log(text.slice(0, 1200)); console.log("media:", media.length);
await browser.close();
