import type { ReactNode } from "react";

import type { CapabilityId } from "@/lib/roco-bank/content";

import styles from "./hero.module.css";

// 16 px stroke glyphs for the capability strip (Carte's own marks — no third-party logos).
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const GLYPHS: Record<CapabilityId, ReactNode> = {
  freeze: <path {...P} d="M8 1.5v13M2.4 4.75l11.2 6.5M2.4 11.25l11.2-6.5M6 2.6 8 4l2-1.4M6 13.4 8 12l2 1.4" />,
  freeze2: <path {...P} d="M4.5 7V5a3.5 3.5 0 0 1 6.6-1.6M3 7h10v7H3zM8 9.8v1.6" />,
  layers: <path {...P} d="m8 1.8 6 3.2-6 3.2L2 5zM2 8l6 3.2L14 8M2 11l6 3.2 6-3.2" />,
  route: <path {...P} d="M3 13.5a1.5 1.5 0 1 0 0-.01M13 2.5a1.5 1.5 0 1 0 0-.01M4.5 13H9a2.5 2.5 0 0 0 0-5H7a2.5 2.5 0 0 1 0-5h4.5" />,
  signals: <path {...P} d="M8 9.2a1.2 1.2 0 1 0 0-.01M5.2 11.8a4 4 0 0 1 0-5.6M10.8 6.2a4 4 0 0 1 0 5.6M3 14a7 7 0 0 1 0-10M13 4a7 7 0 0 1 0 10" />,
  verify: <path {...P} d="M8 1.5 13.5 3.5v4.2c0 3.2-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.6-5.5-6.8V3.5zM5.6 8.2l1.7 1.7 3.2-3.4" />,
  review: <path {...P} d="M2.5 2.5h11v8h-5L5.5 13.5v-3h-3zM5.5 5.5h5M5.5 7.8h3" />,
  alerts: <path {...P} d="M4 11V7.2a4 4 0 0 1 8 0V11l1.2 1.5H2.8zM6.6 14.2a1.6 1.6 0 0 0 2.8 0" />,
  record: <path {...P} d="M3.5 1.8h6.5l2.5 2.6v9.8h-9zM5.8 7h4.4M5.8 9.4h4.4M5.8 11.8h2.6" />,
  remote: <path {...P} d="M5 1.8h6v12.4H5zM7.2 12h1.6M1.8 5.5a6 6 0 0 0 0 5M14.2 5.5a6 6 0 0 1 0 5" />,
  decline: <path {...P} d="M8 1.6a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 8 1.6zM3.5 3.5l9 9" />,
  demo: <path {...P} d="M2 4h12v8H2zM2 6.6h12M4.4 9.6h2.4M2 2l12 12" />,
};

/** One capability label as it sits in a 147.5 px marquee slot. */
export function CapabilityMark({ id, label }: { id: CapabilityId; label: string }) {
  return (
    <span className={styles.capability}>
      <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden>
        {GLYPHS[id]}
      </svg>
      <span>{label}</span>
    </span>
  );
}
