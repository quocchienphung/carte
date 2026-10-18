"use client";

import { HERO_COPY } from "@/lib/roco-bank/content";

import { useAnim } from "../motion-context";
import styles from "./hero.module.css";

/** Eyebrow (typewriter), two-line headline (asterisk scramble → word, measured per word) and the
 *  four-line paragraph (blur-rise per line). Each word slot reserves the final text width so the
 *  reveal never reflows the line. */
export function HeroCopy() {
  const anim = useAnim();
  const words = HERO_COPY.headline;
  const line = (n: 1 | 2) => words.map((w, i) => ({ w, i })).filter(({ w }) => w.line === n);
  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow} aria-label="Create your own">
        {[...HERO_COPY.eyebrow].map((ch, i) => (
          <span key={i} ref={anim(`eyebrow.${i}`)} aria-hidden className={styles.eyebrowChar}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </p>
      <h1 id="hero-title" className={styles.headline}>
        {([1, 2] as const).map((n) => (
          <span key={n} ref={anim(`headline.${n}`)} className={`${styles.headLine} ${styles[`headLine${n}`]}`}>
            {line(n).map(({ w, i }, k, arr) => (
              <span key={i} className={styles.wordSlot}>
                <span
                  ref={anim(`word.${i}`)}
                  className={`${styles.word} ${w.weight === "medium" ? styles.medium : styles.light}`}
                >
                  {w.text}
                </span>
                <span ref={anim(`ph.${i}`)} aria-hidden className={styles.placeholder}>
                  {w.placeholder}
                </span>
                {!w.joinNext && k < arr.length - 1 ? " " : null}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <p className={styles.paragraph}>
        {HERO_COPY.paragraph.map((l, i) => (
          <span key={i} ref={anim(`para.${i}`)} className={`${styles.paraLine} ${styles[l.tone]}`}>
            {l.text}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
