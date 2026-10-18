"use client";

import { HERO_COPY } from "@/lib/roco-bank/content";

import { useAnim } from "../motion-context";
import styles from "./hero.module.css";

/** BUY CARD (black) and DISCOVER (light gray) pills — real anchors, measured 132×32 each. */
export function HeroActions() {
  const anim = useAnim();
  return (
    <div className={styles.actions}>
      {HERO_COPY.ctas.map((c) => (
        <a key={c.id} ref={anim(`cta.${c.id}`)} href={c.href} className={`${styles.cta} ${styles[`cta_${c.variant}`]}`}>
          {c.label}
        </a>
      ))}
    </div>
  );
}
