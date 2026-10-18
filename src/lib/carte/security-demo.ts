// Carte security demo — one model shared by the bento tiles (DOM), the device's inner screen (canvas
// texture), the cover screen / process column and the responsive page. All data is an illustrative
// fixture: no real card, merchant, payment or verification is involved.
import { useSyncExternalStore } from "react";

import type { GlyphName } from "./glyphs";

// ---------------------------------------------------------------- fixture
export const DEMO = {
  merchant: "Northstar Coffee",
  amount: 32.1,
  amountLabel: "$32.10",
  cardLast4: "4242",
  cardName: "Demo card",
  device: "New device",
  verdict: "Review suggested",
  label: "Interactive demo · No real payment",
} as const;

export type CardStatus = "active" | "frozen";
export type Decision = "pending" | "recognized" | "frozen";
export type Verification = "idle" | "checking" | "verified";

/** Five checkpoints around a payment (Layer Stack), top layer first. */
export const LAYERS = [
  { title: "Card controls", hint: "Freeze", icon: "lock", detail: "Freeze or unfreeze the card at any time." },
  { title: "Device check", hint: "Device", icon: "device", detail: "A new device can ask for a step-up check." },
  { title: "Merchant review", hint: "Merchant", icon: "store", detail: "See who is charging before you continue." },
  { title: "Amount signals", hint: "Amount", icon: "pulse", detail: "Unusual amounts are flagged for review." },
  { title: "Your approval", hint: "You", icon: "check", detail: "Nothing unfamiliar goes through without you." },
] as const;
export type LayerIcon = (typeof LAYERS)[number]["icon"];

/** Payment route nodes (Integration Beam): senders → Carte → receivers. */
export const ROUTE = {
  in: [
    { id: "card", name: "Card" },
    { id: "device", name: "Device" },
    { id: "merchant", name: "Merchant" },
  ],
  out: [
    { id: "checks", name: "Checks" },
    { id: "approval", name: "Approval" },
    { id: "receipt", name: "Receipt" },
  ],
} as const;
export type RouteNodeId = (typeof ROUTE.in)[number]["id"] | (typeof ROUTE.out)[number]["id"];

/** Signals orbiting the shield (Enrichment Orbit). Illustrative, not a live model. */
export const SIGNALS = [
  { id: "device", label: "Device", value: "New", tone: "warn" },
  { id: "amount", label: "Amount", value: "Typical", tone: "ok" },
  { id: "location", label: "Location", value: "Familiar", tone: "ok" },
] as const;

export const VERIFY_PHASES = ["Checking device", "Matching card ending 4242", "Confirming it's you"] as const;

/** Demo alerts (Notification Stack), front first. */
export const ALERTS = [
  {
    id: "device",
    badge: "Review",
    title: "Unfamiliar device",
    text: `${DEMO.merchant} · ${DEMO.amountLabel} on card ending ${DEMO.cardLast4} from a new device.`,
    pattern: "orbit",
  },
  {
    id: "saved",
    badge: "Activity",
    title: "Card saved by a merchant",
    text: `A demo merchant stored card ending ${DEMO.cardLast4} for future payments.`,
    pattern: "grid",
  },
  {
    id: "check",
    badge: "Security",
    title: "Step-up check available",
    text: "Run the simulated identity check before approving unfamiliar payments.",
    pattern: "rays",
  },
] as const;
export type AlertId = (typeof ALERTS)[number]["id"];

// ---------------------------------------------------------------- state
export type DemoState = {
  card: CardStatus;
  layer: number;
  decision: Decision;
  verification: Verification;
  dismissed: readonly AlertId[];
  /** bumped on every change (canvas textures redraw on a new version) */
  version: number;
};

const INITIAL: DemoState = { card: "active", layer: 0, decision: "pending", verification: "idle", dismissed: [], version: 0 };

let state: DemoState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<DemoState>) {
  state = { ...state, ...patch, version: state.version + 1 };
  listeners.forEach((l) => l());
}

export const demoStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  setCard(card: CardStatus) {
    if (card !== state.card) set({ card });
  },
  selectLayer(layer: number) {
    if (layer !== state.layer) set({ layer });
  },
  /** Recognize → approved; Freeze → the same demo card is frozen everywhere it is shown */
  decide(answer: "recognize" | "freeze") {
    if (state.decision !== "pending") return;
    set(answer === "recognize" ? { decision: "recognized" } : { decision: "frozen", card: "frozen" });
  },
  setVerification(verification: Verification) {
    if (verification !== state.verification) set({ verification });
  },
  dismissAlert(id: AlertId) {
    if (!state.dismissed.includes(id)) set({ dismissed: [...state.dismissed, id] });
  },
  resetAlerts() {
    set({ dismissed: [] });
  },
  resetDecision() {
    set({ decision: "pending", card: "active" });
  },
  resetAll() {
    set({ ...INITIAL });
  },
};

const getServer = () => INITIAL;

export function useDemo(): DemoState {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get, getServer);
}

// ---------------------------------------------------------------- motion gate
// Decorative loops (layer auto-cycle, orbit, route pulses) pause while the bento is being handed
// to the device screen, so the DOM and the canvas texture never show two different moments.
let decorPaused = false;
const decorListeners = new Set<() => void>();
export const decorGate = {
  get: () => decorPaused,
  set(paused: boolean) {
    if (paused === decorPaused) return;
    decorPaused = paused;
    decorListeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    decorListeners.add(l);
    return () => {
      decorListeners.delete(l);
    };
  },
};
const decorServer = () => false;
export function useDecorPaused() {
  return useSyncExternalStore(decorGate.subscribe, decorGate.get, decorServer);
}

// ---------------------------------------------------------------- derived copy (DOM + canvas)
export const cardStatusLabel = (s: CardStatus) => (s === "active" ? "Active" : "Frozen");
export const cardStatusDetail = (s: CardStatus) =>
  s === "active" ? "Payments and card details are available." : "New payments are declined until you unfreeze.";

export function decisionResult(d: Decision) {
  if (d === "recognized") return { tone: "ok" as const, title: "Payment approved", text: "Added to your activity record." };
  if (d === "frozen") return { tone: "warn" as const, title: `Card ending ${DEMO.cardLast4} frozen`, text: "The demo payment was declined." };
  return null;
}

/** Remote overview rows — the demo card's state as the phone's cover screen and the process column
 *  show it (Affect UI Change Summary rows). Demo state only, never invented metrics. */
export type RemoteRow = { label: string; value: string; tone: "good" | "bad" | "neutral" | "frost"; glyph: GlyphName };
export function remoteRows(demo: DemoState): RemoteRow[] {
  const open = ALERTS.length - demo.dismissed.length;
  const frozen = demo.card === "frozen";
  return [
    { label: `Card ending ${DEMO.cardLast4}`, value: frozen ? "Frozen" : "Active", tone: frozen ? "frost" : "good", glyph: frozen ? "snowflake" : "card" },
    {
      label: "Payment review",
      value: demo.decision === "recognized" ? "Approved" : demo.decision === "frozen" ? "Declined" : "Open",
      tone: demo.decision === "recognized" ? "good" : demo.decision === "frozen" ? "frost" : "bad",
      glyph: "receipt",
    },
    {
      label: "Step-up check",
      value: demo.verification === "verified" ? "Verified" : demo.verification === "checking" ? "Checking" : "Not run",
      tone: demo.verification === "verified" ? "good" : "neutral",
      glyph: "shieldCheck",
    },
    { label: "Alerts", value: open ? `${open} to review` : "All clear", tone: open ? "bad" : "good", glyph: "bell" },
  ];
}
