#!/usr/bin/env node
// Builds docs/implementation/carte/source-manifest.json from the crawl (affectui-crawl.json) plus the
// Carte selection below. Every crawled item gets an entry; only selected ones get a role / files.
//   node scripts/carte/build-manifest.mjs
import { readFileSync, writeFileSync } from "node:fs";

const crawl = JSON.parse(readFileSync("docs/implementation/carte/affectui-crawl.json", "utf8"));
const EV = "artifacts/visual-audit/carte/source"; // ignored evidence folder
const REF = "src/components/references/affectui";
const SEC = "src/components/sites/carte/security";

/** id → Carte usage. sourceStatus: official-source (free registry, code read + vendored) or
 *  reference-only (Pro: preview / docs inspected, source not available to us). */
const SELECTED = {
  "segmented-control": {
    carteRole: "bento credit — Freeze in a tap (Active / Frozen switch for the demo card)",
    fitReason: "Binary state with a gliding indicator, radiogroup semantics, arrow / Home / End keys and drag already designed.",
    limitations: "Used as-is through props; the frozen state itself lives in the shared demo model.",
    destinationFiles: [`${REF}/segmented-control.tsx`, `${SEC}/CardAccessDemo.tsx`],
    states: ["idle", "option 2 selected (action)"],
  },
  button: {
    carteRole: "reference for action buttons (Reset demo, Run check) — styles adapted into security.module.css",
    fitReason: "Same primary / secondary / ghost hierarchy as the other Affect UI parts.",
    limitations: "Not imported: a 12 KB component for two buttons; its sizes / radii are mirrored in CSS.",
    destinationFiles: [`${REF}/button.tsx`, `${SEC}/security.module.css`],
    states: ["docs read"],
  },
  "layer-stack": {
    carteRole: "bento trust — Protection, in layers (five checkpoints around a payment)",
    fitReason: "Five selectable layers, auto-cycle that stops after user input, hover/focus pause, ↑/↓ keys.",
    limitations: "Forked: Carte icons (the source only ships bolt/database/plug/spark/pulse), controlled index for the shared model, compact list-under-stack layout for the 358 px column.",
    destinationFiles: [`${REF}/layer-stack.tsx`, `${SEC}/SecurityLayersScene.tsx`],
    states: ["idle (auto-cycle)", "third entry picked"],
  },
  "integration-beam": {
    carteRole: "bento customers — A safer route for every payment (Card · Device · Merchant → Carte → Checks · Approval · Receipt)",
    fitReason: "Measured beams, sequenced pulses, hover focus, click to pause with live status — explains a payment route without fake partner logos.",
    limitations: "Used through props with Carte glyphs; no third-party logos. Font / spacing overridden from the adapter scope.",
    destinationFiles: [`${REF}/integration-beam.tsx`, `${SEC}/PaymentRouteScene.tsx`],
    states: ["idle (syncing)", "first node paused"],
  },
  "enrichment-orbit": {
    carteRole: "bento ai — Signals in focus (device, amount, location orbiting the Carte shield)",
    fitReason: "Small SVG illustration with two counter-rotating comets; nodes stay upright.",
    limitations: "Forked: Grok mark replaced by a shield, nodes get Device / Amount / Location glyphs, animation pauses off-screen. Illustration only — no claim of a live fraud model.",
    destinationFiles: [`${REF}/enrichment-orbit.tsx`, `${SEC}/RiskSignalsScene.tsx`],
    states: ["idle"],
  },
  "thinking-loader": {
    carteRole: "bento easy + phone step 05 — Verify the moment (Checking → Verified, simulated)",
    fitReason: "Phase labels roll through and settle on a drawn check; reduced-motion aware.",
    limitations: "Driven with controlled `done` and custom phases / done label.",
    destinationFiles: [`${REF}/thinking-loader.tsx`, `${SEC}/VerificationDemo.tsx`],
    states: ["idle (cycling)"],
  },
  "otp-input": {
    carteRole: "reference for the verification sandbox — not shipped (no code entry needed: the check is simulated)",
    fitReason: "Documents verified / error states the Carte copy mirrors.",
    limitations: "Not imported; six code boxes do not fit a 168 px tile and we never ask for a real code.",
    destinationFiles: [`${REF}/otp-input.tsx`],
    states: ["idle"],
  },
  "decision-inbox": {
    carteRole: "bento payment + phone step 04 — Review before you approve (Recognize / Freeze demo card)",
    fitReason: "Two quick answers per decision, confirm then fold away — exactly a payment review.",
    limitations: "Forked: one fixed demo transaction, two different outcomes (approved vs card frozen), Reset demo, state from the shared model so the phone matches.",
    destinationFiles: [`${REF}/decision-inbox.tsx`, `${SEC}/PaymentDecisionDemo.tsx`],
    states: ["idle", "primary answered"],
  },
  "notification-stack": {
    carteRole: "bento invested + phone step 06 — Alerts that matter",
    fitReason: "Only the front notice is readable; dismiss reveals the next.",
    limitations: "Used through props; the adapter moves focus to the next notice / Reset and remounts on reset.",
    destinationFiles: [`${REF}/notification-stack.tsx`, `${SEC}/SecurityAlertsDemo.tsx`],
    states: ["idle", "front dismissed"],
  },
  "progress-tracker": {
    carteRole: "phone section — six-checkpoint progress in the process column",
    fitReason: "Bar + ticks that draw themselves; reads as a checklist of the demo.",
    limitations: "Rebuilt as a controlled tracker (the source owns its own ticks); look and motion mirrored.",
    destinationFiles: [`${REF}/progress-tracker.tsx`, `${SEC}/CheckpointTracker.tsx`],
    states: ["idle"],
  },
  "change-summary": {
    carteRole: "phone cover screen + process column — remote overview of card / alert status",
    fitReason: "One metric per row with a toned trend: fits a remote status panel.",
    limitations: "Rows are demo state (frozen / active, open reviews, alerts), never invented business metrics.",
    destinationFiles: [`${REF}/change-summary.tsx`, `${SEC}/RemoteStatus.tsx`],
    states: ["idle"],
  },
  "number-ticker": {
    carteRole: "amount roll-in on the review panel ($32.10 demo charge)",
    fitReason: "Odometer digits for the single demo amount.",
    limitations: "Only the demo fixture amount is animated.",
    destinationFiles: [`${REF}/number-ticker.tsx`, `${SEC}/PaymentDecisionDemo.tsx`],
    states: ["idle"],
  },
  "tool-call-card": {
    carteRole: "reference for the signals disclosure (step 03/04 detail rows)",
    fitReason: "Fold-open details with status pill — mirrored for the signal rows.",
    limitations: "Not imported (AI tool arguments / results do not apply); disclosure pattern reimplemented.",
    destinationFiles: [`${REF}/tool-call-card.tsx`, `${SEC}/SignalDetails.tsx`],
    states: ["idle"],
  },
  "approval-card": {
    carteRole: "Pro option for step 04 — not used",
    fitReason: "Risk badge + approve / deny fits, but Pro source cannot ship in this public repo.",
    limitations: "preview inspected; source unavailable — fallback: Decision Inbox (free).",
    destinationFiles: [],
    states: ["idle (preview)"],
  },
  "agent-gallery": { carteRole: "Pro option — not used", fitReason: "Panel-to-screen layout for a future Control / Verify / Review / Alerts section.", limitations: "preview inspected; source unavailable.", destinationFiles: [], states: [] },
  "integration-settings": { carteRole: "Pro option — not used", fitReason: "Rule settings panel reference.", limitations: "preview inspected; source unavailable; would imply a real connected bank.", destinationFiles: [], states: [] },
  "settings-billing": { carteRole: "Pro option — not used", fitReason: "Security-control dashboard layout reference for a later route.", limitations: "preview inspected; source unavailable; billing content out of scope.", destinationFiles: [], states: [] },
};

const items = crawl.items.map((it) => {
  const sel = SELECTED[it.id];
  const isPublic = it.access === "public-registry";
  return {
    id: it.id,
    name: it.name ?? it.id,
    category: it.category,
    canonicalUrl: it.canonicalUrl,
    access: it.access,
    inspectedAt: it.inspectedAt,
    previewStatesInspected: sel?.states ?? (it.status === "inspected" ? ["detail page rendered"] : []),
    sourceStatus: sel ? (isPublic && sel.destinationFiles.length ? "official-source" : isPublic ? "official-source (reference)" : "reference-only") : "not-selected",
    registryUrl: it.registryUrl,
    dependencies: isPublic ? [] : null,
    carteRole: sel?.carteRole ?? null,
    fitReason: sel?.fitReason ?? null,
    limitations: sel?.limitations ?? null,
    destinationFiles: sel?.destinationFiles ?? [],
    evidencePaths: sel ? [`${EV}/${it.id}_idle.png`, ...(sel.states.length > 1 ? [`${EV}/${it.id}_action.png`] : [])] : [],
  };
});
writeFileSync(
  "docs/implementation/carte/source-manifest.json",
  JSON.stringify({ generatedFrom: "affectui-crawl.json", crawledAt: crawl.crawledAt, counts: crawl.counts, selected: Object.keys(SELECTED).length, items }, null, 2),
);
console.log("items", items.length, "selected", items.filter((i) => i.carteRole).length);
