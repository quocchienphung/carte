"use client";

import Image from "next/image";

import { CARD_ART } from "@/lib/roco-bank/content";
import type { CardId } from "@/lib/roco-bank/geometry";
import { SHADOW_PAIRS } from "@/lib/roco-bank/motion/cards";

import { useAnim } from "../motion-context";
import styles from "./cards.module.css";

/** One physical card: its own face image, received cast shadows and rounded mask. Pose (x, y, rotation, scale, focus) is owned by
 *  the replay applier through `card.<id>`. */
export function BankCard({ id, layout = "stage" }: { id: CardId; layout?: "stage" | "flow" }) {
  const anim = useAnim();
  const art = CARD_ART[id];
  return (
    <figure
      ref={layout === "stage" ? anim(`card.${id}`) : undefined}
      className={`${styles.card} ${layout === "flow" ? styles.flow : ""}`}
      data-card={id}
      aria-label={art.label}
    >
      <Image
        className={styles.face}
        src={art.face}
        alt=""
        width={440}
        height={272}
        unoptimized
        loading="eager"
        decoding="sync"
        draggable={false}
      />
      {layout === "stage"
        ? SHADOW_PAIRS.filter(([lower]) => lower === id).map(([, upper]) => (
            <span key={upper} ref={anim(`shadow.${id}.${upper}`)} className={styles.received} aria-hidden />
          ))
        : null}
    </figure>
  );
}
