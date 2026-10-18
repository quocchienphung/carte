"use client";

import { useAnim } from "../motion-context";
import { HeroActions } from "./HeroActions";
import { HeroCopy } from "./HeroCopy";
import { HeroDecorativeType } from "./HeroDecorativeType";
import { PartnerMarquee } from "./PartnerMarquee";
import { ScrollArrows } from "./ScrollArrows";
import { SocialProofCluster } from "./SocialProofCluster";
import styles from "./hero.module.css";

/** White hero scene (canvas px). The whole scene translates with the page scroll `S`. */
export function HeroScene({ onNext }: { onNext?: () => void }) {
  const anim = useAnim();
  return (
    <section ref={anim("heroScroll")} className={styles.scene} aria-labelledby="hero-title" id="top">
      <HeroDecorativeType />
      <ScrollArrows onNext={onNext} />
      <HeroCopy />
      <HeroActions />
      <span ref={anim("divider")} className={styles.divider} aria-hidden />
      <PartnerMarquee />
      <SocialProofCluster />
    </section>
  );
}
