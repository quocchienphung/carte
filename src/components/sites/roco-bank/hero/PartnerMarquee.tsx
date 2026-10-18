"use client";

import { PARTNERS } from "@/lib/roco-bank/content";

import { useAnim } from "../motion-context";
import { PARTNER_MARKS } from "./partner-logos";
import styles from "./hero.module.css";

/** Muted partner strip. Every mark is its own item in a 147.5 px slot; the strip travels right with
 *  a decaying boost (measured, §7.7) and is masked by a soft fade on both ends. */
export function PartnerMarquee() {
  const anim = useAnim();
  return (
    <div ref={anim("logoStrip")} className={styles.partners} role="list" aria-label="Trusted by">
      {PARTNERS.map((id, i) => {
        const m = PARTNER_MARKS[id];
        return (
          <div key={id} ref={anim(`partner.${i}`)} className={styles.partner} role="listitem">
            <svg viewBox={`0 0 ${m.w} 22`} width={m.w} height={22} fill="currentColor" role="img" aria-label={m.title}>
              {m.body}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
