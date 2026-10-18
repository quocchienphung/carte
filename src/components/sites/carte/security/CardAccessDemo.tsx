"use client";

import Image from "next/image";
import { useId } from "react";

import { SegmentedControl } from "@/components/references/affectui/segmented-control";
import { DEMO, cardStatusDetail, cardStatusLabel, demoStore, useDemo, type CardStatus } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader, Glyph } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";

const OPTIONS = [
  { value: "active" as const, label: "Active", icon: <Glyph name="unlock" size={14} /> },
  { value: "frozen" as const, label: "Frozen", icon: <Glyph name="snowflake" size={14} /> },
];

/** Bento `credit` — Freeze in a tap. Affect UI Segmented Control drives the demo card's access;
 *  the same state shows on the payment review, the phone screens and the responsive page. */
export function CardAccessDemo() {
  const { card } = useDemo();
  const h = useId();
  const frozen = card === "frozen";
  return (
    <section className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.credit}`}>
        <FeatureHeader feature={FEATURES.credit} headingId={h} className={tiles.creditHead} />
        <div className={tiles.creditCard} data-frozen={frozen || undefined}>
          {/* polished card face, the same file as the hero stack */}
          <Image src="/sites/roco-bank/cards/vietcombank.webp?v=polished-2" alt="" width={1595} height={986} unoptimized draggable={false} />
          <span className={tiles.frost} aria-hidden>
            <Glyph name="snowflake" size={22} />
          </span>
          <span className={tiles.last4}>•••• {DEMO.cardLast4}</span>
        </div>
        <div className={tiles.creditControls}>
          <SegmentedControl<CardStatus>
            options={OPTIONS}
            value={card}
            onChange={(v) => demoStore.setCard(v)}
            size="sm"
            aria-label={`Card ending ${DEMO.cardLast4} access`}
          />
          <p className={tiles.creditStatus} data-frozen={frozen || undefined} aria-live="polite">
            <strong>{cardStatusLabel(card)}.</strong> <span className={tiles.creditDetail}>{cardStatusDetail(card)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
