"use client";

import type { TileId } from "@/lib/roco-bank/geometry";

import { BentoGrid } from "./BentoGrid";
import styles from "./bento.module.css";

/** Near-black feature scene that rises over the hero (content only — the motion wrapper is
 *  SceneTransition). */
export function BentoScene({ onTileFocus }: { onTileFocus?: (id: TileId, focused: boolean) => void }) {
  return (
    <section className={styles.scene} aria-label="Features" id="features">
      <h2 className={styles.srOnly}>Why Roco.bank</h2>
      <BentoGrid onTileFocus={onTileFocus} />
    </section>
  );
}
