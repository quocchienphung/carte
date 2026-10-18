#!/usr/bin/env node
// Carte research evidence: screenshot the live Affect UI preview of each shortlisted item (default
// state, then one interaction where the docs describe one) into the ignored artifacts folder.
//   node scripts/carte/capture-sources.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = "artifacts/visual-audit/carte/source";
mkdirSync(out, { recursive: true });
const ONLY = process.argv.slice(2);
const ITEMS = [
  ["illustrations", "layer-stack", async (p) => p.getByRole("tab").nth(2).click()],
  ["illustrations", "integration-beam", async (p) => p.locator(".ui-ib__tool").first().click()],
  ["illustrations", "enrichment-orbit", null],
  ["components", "segmented-control", async (p) => p.getByRole("radio").nth(1).click()],
  ["components", "decision-inbox", async (p) => p.locator(".ui-di__btn--primary:visible").first().click()],
  ["components", "notification-stack", async (p) => p.locator(".ui-ns__card[data-depth=\"0\"] .ui-ns__close:visible").first().click()],
  ["components", "thinking-loader", null],
  ["components", "progress-tracker", null],
  ["components", "change-summary", null],
  ["components", "tool-call-card", null],
  ["components", "otp-input", null],
  ["motion", "number-ticker", null],
  ["components", "approval-card", null],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
for (const [cat, id, act] of ITEMS.filter(([, id]) => !ONLY.length || ONLY.includes(id))) {
  try {
    await p.goto(`https://www.affectui.com/${cat}/${id}`, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${id}_idle.png`, clip: { x: 0, y: 0, width: 1440, height: 760 } });
    if (act) {
      await act(p);
      await p.waitForTimeout(1600);
      await p.screenshot({ path: `${out}/${id}_action.png`, clip: { x: 0, y: 0, width: 1440, height: 760 } });
    }
    console.log("ok", id);
  } catch (e) {
    console.log("fail", id, String(e.message).split("\n")[0]);
  }
}
await b.close();
