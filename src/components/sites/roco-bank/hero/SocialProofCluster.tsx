"use client";

import { PILL_CONTENT, PILL_ORDER } from "@/lib/roco-bank/content";

import { useAnim } from "../motion-context";
import { AvatarBadge } from "./AvatarBadge";
import styles from "./hero.module.css";

/** Five independent avatar + amount pills (positions measured on f085, staggered blur-rise). */
export function SocialProofCluster() {
  const anim = useAnim();
  return (
    <ul className={styles.proof} aria-label="Recent card holders">
      {PILL_ORDER.map((id) => {
        const p = PILL_CONTENT[id];
        return (
          <li key={id} ref={anim(`pill.${id}`)} className={`${styles.pill} ${styles[`pill_${id}`]} ${styles[`tone_${p.tone}`]}`}>
            <AvatarBadge id={id} name={p.name} />
            <span className={styles.pillName}>{p.name}</span>
            <span className={styles.pillAmount}>{p.amount}</span>
          </li>
        );
      })}
    </ul>
  );
}
