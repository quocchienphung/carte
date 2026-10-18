"use client";

import { useEffect, useId, useRef, useState } from "react";

import { GLYPHS } from "@/lib/carte/glyphs";
import { LAYERS, demoStore, useDecorPaused, useDemo } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";
import { prefersReducedMotion, useInView } from "./use-in-view";

// Adapted from Affect UI Layer Stack (official source, src/components/references/affectui/layer-stack.tsx):
// same isometric geometry (600 × 400 grid, 104 px layers, 26 px step, 34 / 24 px lift, 9 px thickness),
// same lift / tint / glow / pill motion and keyboard model. Carte changes: security glyphs instead of
// the five built-in icons, the chosen index lives in the shared demo model (the phone texture reads
// it), the stack is cropped to its own box and sits beside a px-sized list (the 358 px column would
// shrink the source's container-unit text to ~8 px), and auto-play also stops off screen / during the
// device hand-off.

const SIZE = 104;
const STEP = 26;
const GAP = 34;
const ABOVE = 24;
const THICK = 9;
const CX = 168;
const TOP = 109;
const INTERVAL = 2600;

export function SecurityLayersScene() {
  const { layer } = useDemo();
  const decorPaused = useDecorPaused();
  const h = useId();
  const uid = "c-lyr" + h.replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const visible = useInView(root);
  const [hovered, setHovered] = useState(false);
  const touched = useRef(false);
  const last = LAYERS.length - 1;

  // Steps through the layers until someone picks one; never with reduced motion, off screen,
  // while hovered / focused or while the bento is being handed to the device
  useEffect(() => {
    if (hovered || decorPaused || !visible || touched.current || prefersReducedMotion()) return;
    const t = window.setInterval(() => {
      if (touched.current) return;
      demoStore.selectLayer((demoStore.get().layer + 1) % LAYERS.length);
    }, INTERVAL);
    return () => window.clearInterval(t);
  }, [hovered, decorPaused, visible]);

  const pick = (i: number) => {
    touched.current = true;
    demoStore.selectLayer(i);
  };

  const yOf = (i: number) => TOP + i * STEP - (i < layer ? GAP + ABOVE : i === layer && layer < last ? GAP : 0);

  return (
    <section
      ref={root}
      className={styles.tile}
      aria-labelledby={h}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false);
      }}
    >
      <div className={`${styles.tileInner} ${tiles.trust}`}>
        <FeatureHeader feature={FEATURES.trust} headingId={h} className={tiles.trustHead} />
        <div className={tiles.trustRow}>
          <svg className={tiles.lyrStack} viewBox="56 40 224 300" aria-hidden>
            <defs>
              <filter id={`${uid}-glow`} x="-60%" y="-120%" width="220%" height="340%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>
            {LAYERS.map((item, i) => (
              <g
                key={item.title}
                className={tiles.lyrLayer}
                data-active={i === layer || undefined}
                data-above={i < layer || undefined}
                style={{ transform: `translate(${CX}px, ${yOf(i)}px)` }}
              >
                <ellipse className={tiles.lyrGlow} cx={0} cy={SIZE / 2 + THICK + 18} rx={70} ry={24} filter={`url(#${uid}-glow)`} />
                <g transform={`translate(0 ${THICK}) matrix(1 0.5 -1 0.5 0 0)`}>
                  <rect className={tiles.lyrSide} width={SIZE} height={SIZE} rx={9} />
                  <rect className={tiles.lyrSideOn} width={SIZE} height={SIZE} rx={9} />
                </g>
                <g transform="matrix(1 0.5 -1 0.5 0 0)">
                  <rect className={tiles.lyrFace} width={SIZE} height={SIZE} rx={9} />
                  <rect className={tiles.lyrFaceOn} width={SIZE} height={SIZE} rx={9} />
                  <g className={tiles.lyrIcon} transform={`translate(${SIZE / 2 - 18} ${SIZE / 2 - 18}) scale(1.5)`}>
                    <path d={GLYPHS[item.icon]} />
                  </g>
                </g>
              </g>
            )).reverse()}
          </svg>

          <div className={tiles.lyrMenu} role="tablist" aria-label="Security checkpoints" aria-orientation="vertical">
            <span className={tiles.lyrPill} aria-hidden style={{ transform: `translateY(calc(${layer} * var(--lyr-row)))` }} />
            {LAYERS.map((item, i) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={i === layer}
                tabIndex={i === layer ? 0 : -1}
                className={tiles.lyrRow}
                onClick={() => pick(i)}
                onKeyDown={(e) => {
                  const next = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
                  if (next === null) return;
                  e.preventDefault();
                  const n = (next + LAYERS.length) % LAYERS.length;
                  pick(n);
                  (e.currentTarget.parentElement?.children[n + 1] as HTMLElement | undefined)?.focus();
                }}
              >
                <span className={tiles.lyrNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={tiles.lyrTitle}>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
        <p className={tiles.lyrDetail} aria-live="polite">
          <b>{LAYERS[layer].title}.</b> {LAYERS[layer].detail}
        </p>
      </div>
    </section>
  );
}
