"use client";

import { useAnim } from "../motion-context";
import { HeroCopy } from "./HeroCopy";
import { PartnerMarquee } from "./PartnerMarquee";
import { ScrollArrows } from "./ScrollArrows";
import styles from "./hero.module.css";

/** White hero scene (canvas px). The whole scene translates with the page scroll `S`. */
export function HeroScene({ onNext }: { onNext?: () => void }) {
  const anim = useAnim();
  return (
    <section ref={anim("heroScroll")} className={styles.scene} aria-labelledby="hero-title" id="top">
      <ScrollArrows onNext={onNext} />
      <HeroCopy />
      <span ref={anim("divider")} className={styles.divider} aria-hidden />
      <PartnerMarquee />
    </section>
  );
}
