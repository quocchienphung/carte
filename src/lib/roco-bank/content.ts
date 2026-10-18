import type { CardId, TileId } from "./geometry";

// Copy transcribed from the reference video (VIDEO_FORENSICS.md §5). Keep presentation out of here.

export const BRAND = { name: "Roco.bank", nameLead: "Roco", nameTail: ".bank" } as const;

export const HERO_COPY = {
  eyebrow: "CREATE YOUR OWN",
  /** words in reveal order; `weight` selects light / medium cut, `line` the headline line */
  headline: [
    { text: "Roco", weight: "medium", line: 1, joinNext: true, placeholder: "****" },
    { text: ".bank", weight: "light", line: 1, joinNext: false, placeholder: "****" },
    { text: "Professional", weight: "light", line: 2, joinNext: false, placeholder: "*********" },
    { text: "bank", weight: "medium", line: 2, joinNext: false, placeholder: "****" },
    { text: "card", weight: "light", line: 2, joinNext: false, placeholder: "****" },
  ],
  paragraph: [
    { text: "Roco.bank Introduces A Bank Card Crafted For Professionals Who Demand", tone: "ink" },
    { text: "Excellence. Built With Innovative Features, From Real-Time Controls To Secure", tone: "ink" },
    { text: "Digital Payments, This Card Is The Perfect Companion For Your Fast-Paced", tone: "mid" },
    { text: "Lifestyle With Modern Tools, Contactless Payments.", tone: "soft" },
  ],
} as const;

export type HeadlineWord = (typeof HERO_COPY.headline)[number];

/** Partner marquee, left → right as observed (third-party marks, approximated as simplified wordmarks). */
export const PARTNERS = [
  "mercury", "retool", "remote", "arc", "raycast", "runway",
  "ramp", "hex", "vercel", "descript", "cashapp", "supercell",
] as const;
export type PartnerId = (typeof PARTNERS)[number];

/** Hero stack, top → bottom (slot ids are the measured motion tracks of the reference cards).
 *  Faces: polished 1595×986 card textures; preserve their native detail without image recompression.
 *  Third-party bank/Visa marks — demo use only. */
export const CARD_ART: Record<CardId, { face: string; label: string }> = {
  orange: { face: "/sites/roco-bank/cards/vietcombank.webp?v=polished-2", label: "Vietcombank Priority Visa Signature card" },
  green: { face: "/sites/roco-bank/cards/techcombank.webp?v=polished-2", label: "Techcombank Priority Visa Signature card" },
  black: { face: "/sites/roco-bank/cards/vib.webp?v=polished-2", label: "VIB One Visa Signature card" },
  brown: { face: "/sites/roco-bank/cards/vietinbank.webp?v=polished-2", label: "VietinBank Visa Signature card" },
};

export type TileText =
  | { kind: "eyebrow"; text: string }
  | { kind: "title"; parts: { text: string; weight: "light" | "medium" }[]; size: "xl" | "lg" | "md" }
  | { kind: "sub"; parts: { text: string; weight: "light" | "medium" }[] };

export const TILES: Record<TileId, { label: string; href: string; text: TileText[] }> = {
  credit: {
    label: "Credit for you",
    href: "#credit",
    text: [
      { kind: "title", size: "lg", parts: [{ text: "Credit", weight: "medium" }] },
      { kind: "sub", parts: [{ text: "for you", weight: "light" }, { text: "!", weight: "medium" }] },
    ],
  },
  customers: {
    label: "390 thousand customers",
    href: "#customers",
    text: [
      { kind: "eyebrow", text: "ROCO.BANK" },
      { kind: "title", size: "lg", parts: [{ text: "+390k", weight: "light" }] },
      { kind: "sub", parts: [{ text: "Customer to our ", weight: "light" }, { text: "bank", weight: "medium" }, { text: " card", weight: "light" }] },
    ],
  },
  trust: {
    label: "Over 300 companies trusted",
    href: "#companies",
    text: [
      { kind: "eyebrow", text: "OVER 300" },
      { kind: "sub", parts: [{ text: "Companies", weight: "light" }] },
      { kind: "sub", parts: [{ text: "trusted", weight: "medium" }] },
    ],
  },
  ai: {
    label: "AI bank",
    href: "#ai-bank",
    text: [{ kind: "title", size: "md", parts: [{ text: "AI ", weight: "light" }, { text: "bank", weight: "medium" }] }],
  },
  easy: {
    label: "Easy pay",
    href: "#easy-pay",
    text: [{ kind: "title", size: "md", parts: [{ text: "Easy ", weight: "light" }, { text: "pay", weight: "medium" }] }],
  },
  payment: {
    label: "Payment with over 10 methods",
    href: "#payment",
    text: [
      { kind: "eyebrow", text: "PAY METHODS" },
      { kind: "title", size: "lg", parts: [{ text: "Payment", weight: "medium" }] },
      { kind: "sub", parts: [{ text: "with over 10 methods", weight: "light" }] },
    ],
  },
  invested: {
    label: "5.9 million invested",
    href: "#invested",
    text: [
      { kind: "sub", parts: [{ text: "Invested", weight: "light" }] },
      { kind: "title", size: "lg", parts: [{ text: "$5.9m", weight: "medium" }] },
    ],
  },
};
