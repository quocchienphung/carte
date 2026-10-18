#!/usr/bin/env node
// Renders src/lib/roco-bank/fold/status-bar.ts at the reference scale (R = 109.7 px, centre
// (639.8, 359.0) on 1280×720) in Chromium and overlays it on video frame f090.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const outPng = process.argv[3] ?? process.argv[2];
let src = stripTypeScriptTypes(readFileSync("src/lib/roco-bank/fold/status-bar.ts", "utf8"));
src = src.replace(/export /g, "");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.setContent(`<style>html,body{margin:0}</style><canvas id=c width=1280 height=720 style="display:block"></canvas>`);
await p.addScriptTag({ content: `${src}
const ctx = document.getElementById('c').getContext('2d');
ctx.fillStyle = 'rgb(229,229,229)'; ctx.fillRect(0,0,1280,720);
// draw at reference scale: transform cover-space so the ring lands on (639.8, 359), R = 109.7
const k = 109.7 / STATUS_LAYOUT.R;
ctx.translate(639.8 - COVER_CAMERA.x * k, 359.0 - STATUS_LAYOUT.ringY * k);
ctx.scale(k, k);
drawStatusBlock(ctx, { battery: 1, signal: 4, wifi: 3, intro: 1, showTime: false, color: '#000' }, () => {});
` });
await p.screenshot({ path: outPng });
await b.close();
