"use client";

import type { TileId } from "@/lib/roco-bank/geometry";

import { BentoTile } from "./BentoTile";
import styles from "./bento.module.css";

/** Order = reading order (left column, then right column rows); positions are measured rects. */
const ORDER: TileId[] = ["credit", "trust", "customers", "ai", "easy", "payment", "invested"];

/** Deterministic seven-tile asymmetric layout (A ↔ B geometry interpolation, not a CSS grid).
 *  `data-carte-bento` marks the grid the device's inner-screen texture is painted from. */
export function BentoGrid({ onTileFocus }: { onTileFocus?: (id: TileId, focused: boolean) => void }) {
  return (
    <div className={styles.grid} role="list" aria-label="Carte security features" data-carte-bento>
      {ORDER.map((id) => (
        <div key={id} role="listitem" className={styles.item}>
          <BentoTile id={id} onFocusChange={onTileFocus} />
        </div>
      ))}
    </div>
  );
}
