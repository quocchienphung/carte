"use client";

import { CARD_STACK } from "@/lib/roco-bank/geometry";

import { useAnim } from "../motion-context";
import { BankCard } from "./BankCard";
import styles from "./cards.module.css";

/** The four layered cards (z: brown < black < green < orange). Lives in stage space so the stack
 *  can overhang the canvas onto the mat, exactly as in the reference. */
export function HeroCards() {
  const anim = useAnim();
  return (
    <div ref={anim("cardsLayer")} className={styles.layer} aria-label="Roco.bank card designs" role="group">
      {CARD_STACK.map((id) => (
        <BankCard key={id} id={id} />
      ))}
    </div>
  );
}
