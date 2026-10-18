#!/usr/bin/env node
// One-off conversion of the prepared iPhone Duo USD (public/sites/roco-bank/iphone-duo/) into a
// binary glTF with the same hierarchy, names, materials and textures. Parsing USDC in the browser
// blocks the main thread for ~1.7 s (measured, tests/perf-intro.mjs); GLB parsing is ~20× cheaper.
// Runs three's own USDLoader + GLTFExporter in Chromium with files served from disk.
//   node scripts/assets/usd_to_glb.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(".");
const ORIGIN = "http://convert.local";
const types = { ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif", ".usdc": "application/octet-stream", ".html": "text/html" };
const html = `<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { USDLoader } from "three/addons/loaders/USDLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
const model = await new USDLoader().loadAsync("/assets/iPhone_Duo_Render.usdc");
// wait for every texture image
const imgs = [];
model.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) for (const k in m) { const t = m[k]; if (t && t.isTexture && t.image === undefined) imgs.push(t); } });
await new Promise((r) => setTimeout(r, 1500));
let meshes = 0; model.traverse((o) => { if (o.isMesh) meshes++; });
// keep JPEG sources as JPEG (exporter defaults to PNG → 4× larger); PNG only where alpha is used
model.traverse((o) => {
  if (!o.isMesh) return;
  for (const m of [].concat(o.material)) for (const k in m) {
    const t = m[k];
    if (!t || !t.isTexture) continue;
    const src = (t.image && (t.image.currentSrc || t.image.src)) || t.name || "";
    const alpha = k === "alphaMap" || (k === "map" && m.transparent);
    t.userData.mimeType = !alpha && !/\.png/i.test(src) ? "image/jpeg" : "image/png";
  }
});
const glb = await new GLTFExporter().parseAsync(model, { binary: true, maxTextureSize: 2048, onlyVisible: false });
window.__done = { meshes, bytes: glb.byteLength };
window.__glb = new Uint8Array(glb);
</script>`;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.route(`${ORIGIN}/**`, (route) => {
  const p = new URL(route.request().url()).pathname;
  let file;
  if (p === "/") return route.fulfill({ body: html, contentType: "text/html" });
  if (p.startsWith("/three/")) file = join(root, "node_modules/three", p.slice(7));
  else if (p.startsWith("/assets/")) file = join(root, "public/sites/roco-bank/iphone-duo", p.slice(8));
  if (!file || !existsSync(file)) return route.fulfill({ status: 404, body: "nf " + p });
  route.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? "application/octet-stream" });
});
await page.goto(`${ORIGIN}/`);
await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
const info = await page.evaluate(() => window.__done);
const bytes = await page.evaluate(() => Array.from(window.__glb));
const out = join(root, "public/sites/roco-bank/iphone-duo/iPhone_Duo.glb");
writeFileSync(out, Buffer.from(bytes));
console.log("meshes", info.meshes, "glb bytes", info.bytes, "->", out);
await browser.close();
