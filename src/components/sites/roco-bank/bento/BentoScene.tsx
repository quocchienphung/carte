"use client";

import { useDecorPaused } from "@/lib/carte/security-demo";
import type { TileId } from "@/lib/roco-bank/geometry";

import { BentoGrid } from "./BentoGrid";
import styles from "./bento.module.css";

/** Near-black feature scene that rises over the hero (content only — the motion wrapper is
 *  SceneTransition). While the bento is handed to the device, decorative loops hold still. */
export function BentoScene({ onTileFocus }: { onTileFocus?: (id: TileId, focused: boolean) => void }) {
  const decorPaused = useDecorPaused();
  return (
    <section className={styles.scene} aria-labelledby="features-title" id="features" data-decor-paused={decorPaused || undefined}>
      <h2 id="features-title" className={styles.srOnly}>
        How Carte keeps your cards in your hands
      </h2>
      <BentoGrid onTileFocus={onTileFocus} />
    </section>
  );
}
