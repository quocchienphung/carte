"use client";

import { useId, useRef } from "react";

import { GLYPHS, type GlyphName } from "@/lib/carte/glyphs";
import { SIGNALS, useDecorPaused } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";
import { useInView } from "./use-in-view";

// Adapted from Affect UI Enrichment Orbit (official source, src/components/references/affectui/
// enrichment-orbit.tsx): same 320 × 240 artboard, rings (r 56 / 80), comet gradient, 7 s comets in
// opposite directions and 22 s node orbit with upright counter-rotation. Carte changes: a shield in
// the centre tile instead of the Grok mark, Device / Amount / Location glyphs on the nodes, the art is
// cropped to the rings for a 168 px tile, and the loops pause off screen and during the hand-off.
// Illustration only — it does not claim a live fraud model.

export const SIGNAL_GLYPH: Record<(typeof SIGNALS)[number]["id"], GlyphName> = { device: "device", amount: "amount", location: "pin" };
const DELAYS = ["0s", "-7.33s", "-14.66s"];

export function RiskSignalsScene() {
  const h = useId();
  const uid = "c-eo" + h.replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root);
  const paused = useDecorPaused() || !visible;
  return (
    <section ref={root} className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.signals}`}>
        <FeatureHeader feature={FEATURES.ai} headingId={h} className={tiles.signalsHead} />
        <svg
          className={tiles.orbit}
          viewBox="62 22 196 196"
          role="img"
          aria-label="Device, amount and location signals orbiting a shield"
          data-paused={paused || undefined}
        >
          <defs>
            <linearGradient id={`${uid}-comet`}>
              <stop offset="0%" stopColor="#FF6B5C" stopOpacity="0" />
              <stop offset="22%" stopColor="#FFB89E" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#C8A8E5" stopOpacity="0.9" />
              <stop offset="78%" stopColor="#A8B5FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A8B5FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className={tiles.orbitRings} fill="none" strokeWidth="1.2">
            <circle cx="160" cy="120" r="56" strokeOpacity="0.55" />
            <circle cx="160" cy="120" r="80" />
          </g>
          <g className={tiles.orbitSpin}>
            <path fill="none" stroke={`url(#${uid}-comet)`} strokeWidth="1.6" strokeLinecap="round" d="M114.1 54.5 A80 80 0 0 1 205.9 54.5" />
          </g>
          <g className={`${tiles.orbitSpin} ${tiles.orbitReverse}`}>
            <path fill="none" stroke={`url(#${uid}-comet)`} strokeWidth="1.6" strokeLinecap="round" d="M120.4 80.4 A56 56 0 0 1 199.6 80.4" />
          </g>
          <rect className={tiles.orbitTile} x="134" y="94" width="52" height="52" rx="12" />
          <g transform="translate(145 105) scale(1.25)" className={tiles.orbitMark}>
            <path d={GLYPHS.shieldCheck} />
          </g>
          {SIGNALS.map((s, i) => (
            <g key={s.id} className={tiles.orbitNode} style={{ animationDelay: DELAYS[i] }}>
              <g className={tiles.orbitUpright} style={{ animationDelay: DELAYS[i] }}>
                <circle className={tiles.orbitTile} cx="160" cy="40" r="17" />
                <g transform="translate(151 31) scale(0.75)" className={tiles.orbitIcon} data-tone={s.tone}>
                  <path d={GLYPHS[SIGNAL_GLYPH[s.id]]} />
                </g>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
