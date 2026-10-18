import type { ReactNode } from "react";

import { GLYPHS, type GlyphName } from "@/lib/carte/glyphs";
import type { Feature } from "@/lib/roco-bank/content";

import styles from "./security.module.css";

/** One Carte security glyph (shared path data with the canvas textures). */
export function Glyph({ name, size = 16, className }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={[styles.glyph, className].filter(Boolean).join(" ")} aria-hidden>
      <path d={GLYPHS[name]} />
    </svg>
  );
}

/** Eyebrow + two-weight title (+ optional body) of a bento feature, from the shared copy. */
export function FeatureHeader({ feature, headingId, showBody = true, className }: { feature: Feature; headingId: string; showBody?: boolean; className?: string }) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(" ")}>
      <p className={styles.eyebrow}>{feature.eyebrow}</p>
      <h3 id={headingId} className={styles.title}>
        {feature.title.map((r, i) => (r.weight === "medium" ? <b key={i}>{r.text}</b> : <span key={i}>{r.text}</span>))}
      </h3>
      {showBody ? <p className={styles.body}>{feature.body}</p> : null}
    </div>
  );
}

/** Dark Carte surface; Affect UI parts inside pick their dark tokens from data-theme. */
export function SecurityScope({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={[styles.scope, className].filter(Boolean).join(" ")} data-theme="dark">
      {children}
    </div>
  );
}
