import { HERO_COPY } from "@/lib/roco-bank/content";

import styles from "./hero.module.css";

/** Oversized, near-white vertical lettering on the right canvas edge ("Personal" outlined,
 *  "+ Business" solid), reading bottom → top. Purely decorative. */
export function HeroDecorativeType() {
  const d = HERO_COPY.deco;
  return (
    <div className={styles.deco} aria-hidden>
      <span className={styles.decoInner}>
        <span className={styles.decoOutline}>{d.lead}</span>
        <span className={styles.decoSolid}>
          {" "}
          {d.plus} {d.tail}
        </span>
      </span>
    </div>
  );
}
