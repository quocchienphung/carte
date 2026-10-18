import type { CardId, TileId } from "./geometry";

// Carte product copy (English). Single source for the DOM hero, the responsive page, the bento
// tiles and the canvas screens of the device. Keep presentation out of here.
// The `roco-bank` folder / motion ids are a technical namespace kept from the first build.

export const BRAND = { name: "Carte" } as const;

export const META = {
  title: "Carte — Credit card security",
  description:
    "Carte brings card controls, payment reviews and security alerts into one clear view. Explore the interactive demo — no real card details or payments involved.",
} as const;

export const HERO_COPY = {
  eyebrow: "CREDIT CARD SECURITY",
  /** words in reveal order; `weight` selects light / medium cut, `line` the headline line */
  headline: [
    { text: "Your", weight: "light", line: 1, joinNext: false, placeholder: "****" },
    { text: "cards.", weight: "medium", line: 1, joinNext: false, placeholder: "*****" },
    { text: "Under", weight: "light", line: 2, joinNext: false, placeholder: "*****" },
    { text: "your", weight: "light", line: 2, joinNext: false, placeholder: "****" },
    { text: "control.", weight: "medium", line: 2, joinNext: false, placeholder: "*******" },
  ],
  paragraph: [
    { text: "Carte brings card controls, payment reviews and security alerts into", tone: "ink" },
    { text: "one clear view. Explore the demo, review unfamiliar activity, and keep", tone: "ink" },
    { text: "decisions about your cards in your hands.", tone: "mid" },
  ],
} as const;

export type HeadlineWord = (typeof HERO_COPY.headline)[number];

/** Capability strip under the hero copy (replaces the third-party "trusted by" logos: no social
 *  proof we cannot back). Each label names something the demo below actually shows. */
export const CAPABILITIES = [
  { id: "freeze", label: "Card freeze" },
  { id: "layers", label: "Layered checks" },
  { id: "route", label: "Payment route" },
  { id: "signals", label: "Device signals" },
  { id: "verify", label: "Step-up check" },
  { id: "review", label: "Payment review" },
  { id: "alerts", label: "Activity alerts" },
  { id: "record", label: "Activity record" },
  { id: "remote", label: "Remote controls" },
  { id: "freeze2", label: "Instant unfreeze" },
  { id: "decline", label: "Decline & lock" },
  { id: "demo", label: "No real payment" },
] as const;
export type CapabilityId = (typeof CAPABILITIES)[number]["id"];

/** Hero stack, top → bottom (slot ids are the measured motion tracks of the reference cards).
 *  Faces: polished 1595×986 card textures; preserve their native detail without image recompression.
 *  Third-party bank/Visa marks — demo use only. */
export const CARD_ART: Record<CardId, { face: string; label: string }> = {
  orange: { face: "/sites/roco-bank/cards/vietcombank.webp?v=polished-2", label: "Vietcombank Priority Visa Signature card" },
  green: { face: "/sites/roco-bank/cards/techcombank.webp?v=polished-2", label: "Techcombank Priority Visa Signature card" },
  black: { face: "/sites/roco-bank/cards/vib.webp?v=polished-2", label: "VIB One Visa Signature card" },
  brown: { face: "/sites/roco-bank/cards/vietinbank.webp?v=polished-2", label: "VietinBank Visa Signature card" },
};

/** Bento feature copy (Carte). One source for the DOM tiles, the device's inner-screen texture
 *  and the responsive page. `title` runs alternate light / medium like the hero headline. */
export type TitleRun = { text: string; weight: "light" | "medium" };
export type Feature = { label: string; eyebrow: string; title: TitleRun[]; body: string };

export const FEATURES: Record<TileId, Feature> = {
  credit: {
    label: "Freeze in a tap",
    eyebrow: "CARD CONTROLS",
    title: [{ text: "Freeze", weight: "medium" }, { text: " in a tap.", weight: "light" }],
    body: "Switch card access on your terms.",
  },
  trust: {
    label: "Protection, in layers",
    eyebrow: "FIVE CHECKPOINTS",
    title: [{ text: "Protection,", weight: "light" }, { text: " in layers.", weight: "medium" }],
    body: "Explore five checkpoints around a payment.",
  },
  customers: {
    label: "A safer route for every payment",
    eyebrow: "PAYMENT ROUTE",
    title: [{ text: "A safer route", weight: "medium" }, { text: " for every payment.", weight: "light" }],
    body: "Follow a payment through the Carte demo. Hover a step to focus it, click to pause it.",
  },
  ai: {
    label: "Signals in focus",
    eyebrow: "SIGNALS",
    title: [{ text: "Signals", weight: "medium" }, { text: " in focus.", weight: "light" }],
    body: "Device, amount and location.",
  },
  easy: {
    label: "Verify the moment",
    eyebrow: "STEP-UP CHECK",
    title: [{ text: "Verify", weight: "medium" }, { text: " the moment.", weight: "light" }],
    body: "A simulated check. No code needed.",
  },
  payment: {
    label: "Review before you approve",
    eyebrow: "PAYMENT REVIEW",
    title: [{ text: "Review", weight: "medium" }, { text: " before you approve.", weight: "light" }],
    body: "Does this payment look familiar?",
  },
  invested: {
    label: "Alerts that matter",
    eyebrow: "ALERTS",
    title: [{ text: "Alerts", weight: "medium" }, { text: " that matter.", weight: "light" }],
    body: "Review unfamiliar activity in one place.",
  },
};

export const featureTitle = (f: Feature) => f.title.map((r) => r.text).join("");

/** Phone section (after the bento): six checkpoints of the security demo, in order. */
export const SECURITY_STORY = {
  eyebrow: "CARTE SECURITY DEMO",
  heading: "What happens before you approve.",
  lede: "Explore six checkpoints in an interactive payment demo.",
  cta: "Run security demo",
  reset: "Reset demo",
  steps: [
    { title: "Open your wallet", body: "Start with a demo wallet. Your real card details are not required." },
    { title: "Select a card", body: "Choose the demo card you want to review." },
    { title: "Review the details", body: "Check the merchant, amount and card before you continue." },
    { title: "Check the signals", body: "Explore how an unfamiliar device or amount could change the next step." },
    { title: "Confirm the demo", body: "Run a simulated identity check. No real verification code is needed." },
    { title: "Get a clear result", body: "See the demo result and review the activity record." },
  ],
} as const;
