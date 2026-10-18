"use client";

import { CAPABILITIES } from "@/lib/roco-bank/content";

import { useAnim } from "../motion-context";
import { CapabilityMark } from "./capability-marks";
import styles from "./hero.module.css";

/** Muted capability strip (motion ids `logoStrip` / `partner.<i>` kept from the first build). Every
 *  label is its own item in a 147.5 px slot; the strip travels right with a decaying boost
 *  (measured, §7.7) and is masked by a soft fade on both ends. */
export function PartnerMarquee() {
  const anim = useAnim();
  return (
    <div ref={anim("logoStrip")} className={styles.partners} role="list" aria-label="What the Carte demo covers">
      {CAPABILITIES.map((c, i) => (
        <div key={c.id} ref={anim(`partner.${i}`)} className={styles.partner} role="listitem">
          <CapabilityMark id={c.id} label={c.label} />
        </div>
      ))}
    </div>
  );
}
