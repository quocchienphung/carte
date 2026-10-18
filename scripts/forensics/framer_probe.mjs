import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch((e) => console.log("goto", e.message));
await p.waitForTimeout(6000);
await p.screenshot({ path: `${out}/editor.png` });
const info = await p.evaluate(() => ({ url: location.href, title: document.title, text: document.body.innerText.slice(0, 1500),
  links: [...document.querySelectorAll("a")].map((a) => a.href).filter((h) => /framer\.(app|website)|\.framer\./.test(h)).slice(0, 20) }));
writeFileSync(`${out}/info.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify(info, null, 1));
await b.close();
