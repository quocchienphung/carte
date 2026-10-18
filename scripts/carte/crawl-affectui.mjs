#!/usr/bin/env node
// Carte research: crawl the Affect UI catalog (illustrations, components, screens, blocks, motion)
// with a real browser — the site renders client-side, so text fetchers miss content. For every
// detail page records name, access (public registry / Pro), registry URL, docs sections and API
// prop names. Polite: 2 pages at a time, bounded retries, no account / checkout / external links.
//   node scripts/carte/crawl-affectui.mjs [out.json]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const OUT = process.argv[2] ?? "docs/implementation/carte/affectui-crawl.json";
const ORIGIN = "https://www.affectui.com";
const SECTIONS = ["illustrations", "components", "screens", "blocks", "motion"];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });

async function listDetails() {
  const p = await ctx.newPage();
  const urls = new Set();
  for (const s of SECTIONS) {
    await p.goto(`${ORIGIN}/${s}`, { waitUntil: "networkidle", timeout: 60000 });
    const links = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.href));
    for (const l of links) {
      const u = new URL(l);
      if (u.origin !== ORIGIN) continue;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length === 2 && SECTIONS.includes(parts[0])) urls.add(`${ORIGIN}/${parts[0]}/${parts[1]}`);
    }
  }
  await p.close();
  return [...urls].sort();
}

function section(text, start, ends) {
  const i = text.indexOf(`\n${start}\n`);
  if (i < 0) return [];
  const rest = text.slice(i + start.length + 2);
  let j = rest.length;
  for (const e of ends) {
    const k = rest.indexOf(`\n${e}\n`);
    if (k >= 0 && k < j) j = k;
  }
  return rest
    .slice(0, j)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const HEADS = ["When to use", "When not to use", "Installation", "Usage", "Examples", "API reference", "Keyboard interactions", "Accessibility", "Motion", "Responsive behavior"];

async function inspect(url) {
  const p = await ctx.newPage();
  let lastErr = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await p.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await p.waitForTimeout(800);
      const data = await p.evaluate(() => {
        const main = document.querySelector("main") ?? document.body;
        const text = main.innerText;
        const h1 = main.querySelector("h1")?.textContent?.trim() ?? "";
        const desc = main.querySelector("h1 + p, h1 ~ p")?.textContent?.trim() ?? "";
        const codes = [...main.querySelectorAll("pre, code")].map((e) => e.textContent ?? "");
        const props = [...main.querySelectorAll("table tr td:first-child")].map((td) => td.textContent?.trim() ?? "");
        return { text, h1, desc, codes, props };
      });
      await p.close();
      const reg = data.codes.join("\n").match(/https:\/\/www\.affectui\.com\/r\/[a-z0-9-]+\.json/);
      const pro = /Get Pro to install|is a Pro (component|illustration|screen|block|effect)|Installation is part of Pro/i.test(data.text);
      const [, category, slug] = new URL(url).pathname.split("/");
      const sec = Object.fromEntries(HEADS.map((h) => [h, section(data.text, h, HEADS.filter((x) => x !== h))]));
      return {
        id: slug,
        name: data.h1,
        category,
        canonicalUrl: url,
        httpStatus: res?.status() ?? null,
        access: pro ? "pro" : reg ? "public-registry" : "unknown",
        registryUrl: reg?.[0] ?? null,
        description: data.desc,
        requiresReact19: /Requires React 19/.test(data.text),
        whenToUse: sec["When to use"],
        whenNotToUse: sec["When not to use"],
        props: [...new Set(data.props)].filter(Boolean),
        keyboard: sec["Keyboard interactions"],
        accessibility: sec["Accessibility"],
        motion: sec["Motion"],
        responsive: sec["Responsive behavior"],
        inspectedAt: new Date().toISOString(),
        status: "inspected",
      };
    } catch (e) {
      lastErr = String(e?.message ?? e).split("\n")[0];
      await p.waitForTimeout(1500 * attempt);
    }
  }
  await p.close();
  const [, category, slug] = new URL(url).pathname.split("/");
  return { id: slug, category, canonicalUrl: url, status: "failed", error: lastErr, inspectedAt: new Date().toISOString() };
}

const urls = await listDetails();
console.log("detail urls", urls.length);
const results = [];
for (let i = 0; i < urls.length; i += 2) {
  const batch = await Promise.all(urls.slice(i, i + 2).map(inspect));
  results.push(...batch);
  process.stdout.write(`\r${results.length}/${urls.length}`);
}
await b.close();
const counts = {};
for (const r of results) {
  counts[r.category] ??= { total: 0, publicRegistry: 0, pro: 0, unknown: 0, failed: 0 };
  const c = counts[r.category];
  c.total++;
  if (r.status === "failed") c.failed++;
  else if (r.access === "pro") c.pro++;
  else if (r.access === "public-registry") c.publicRegistry++;
  else c.unknown++;
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ crawledAt: new Date().toISOString(), origin: ORIGIN, counts, items: results }, null, 2));
console.log("\n", JSON.stringify(counts, null, 1), "\n→", OUT);
