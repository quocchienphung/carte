"use client";

import { useAnim } from "../motion-context";
import styles from "./hero.module.css";

const Arrow = ({ dir }: { dir: "up" | "down" }) => (
  <svg viewBox="0 0 16 18" width="16" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
    {dir === "down" ? (
      <path d="M8 1v15.2M1 9.4 8 16.2 15 9.4" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M8 15.6V1.6M1 8.4 8 1.6 15 8.4" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

/** The faint ↑ / bold ↓ pair above the eyebrow. Interactive mode: scrolls to the bento scene. */
export function ScrollArrows({ onNext }: { onNext?: () => void }) {
  const anim = useAnim();
  return (
    <button type="button" className={styles.arrows} onClick={onNext} aria-label="Scroll to features">
      <span ref={anim("arrowUp")} className={styles.arrowUp}>
        <Arrow dir="up" />
      </span>
      <span ref={anim("arrowDown")} className={styles.arrowDown}>
        <Arrow dir="down" />
      </span>
    </button>
  );
}
