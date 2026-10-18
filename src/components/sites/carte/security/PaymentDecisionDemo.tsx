"use client";

import { useEffect, useId, useState } from "react";

import { NumberTicker } from "@/components/references/affectui/number-ticker";
import { DEMO, decisionResult, demoStore, useDemo } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader, Glyph } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";

// Adapted from Affect UI Decision Inbox (official source, src/components/references/affectui/
// decision-inbox.tsx): gray tray with a status head, white (dark: #232326) card, dark-primary /
// light-secondary answers, a brief confirmation, then the row folds away (grid-template-rows 0fr,
// 460 ms ease-out-quint). Carte changes: one fixed demo payment (merchant, amount via Affect UI Number
// Ticker, card ending, device signal), the two answers lead to two different results — approved, or
// the demo card frozen everywhere it is shown — and a Reset demo action. State lives in the shared
// demo model so the device screens show the same decision.

const CONFIRM_MS = 1100;

export function PaymentDecisionDemo({ withHeader = true }: { withHeader?: boolean }) {
  const { decision, card } = useDemo();
  const h = useId();
  const [confirming, setConfirming] = useState<null | "recognize" | "freeze">(null);
  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(null), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [confirming]);

  const decide = (answer: "recognize" | "freeze") => {
    if (decision !== "pending" || confirming) return;
    setConfirming(answer);
    demoStore.decide(answer);
  };

  const result = decisionResult(decision);
  const open = decision === "pending" || confirming !== null;
  const frozenElsewhere = decision === "pending" && card === "frozen";

  const panel = (
    <div className={tiles.di} data-clear={!open || undefined} data-tone={result?.tone}>
      <p className={tiles.diHead} aria-live="polite">
        {open ? (
          <>
            <Glyph name="alert" size={15} />
            <span>Needs your review</span>
          </>
        ) : (
          <>
            <Glyph name={result?.tone === "ok" ? "check" : "lock"} size={15} />
            <span>{result?.tone === "ok" ? "Reviewed" : "Card frozen"}</span>
          </>
        )}
      </p>
      <div className={tiles.diCard}>
        <div className={tiles.diRow} data-gone={!open || undefined} inert={!open}>
          <div className={tiles.diRowInner}>
            <div className={tiles.diItem}>
              <p className={tiles.diTitle}>
                <span>{DEMO.merchant}</span>
                <NumberTicker value={DEMO.amount} format={{ style: "currency", currency: "USD" }} locale="en-US" className={tiles.diAmount} />
              </p>
              <p className={tiles.diDetail}>
                Card ending {DEMO.cardLast4} · <span className={tiles.diSignal}>{DEMO.device}</span>
              </p>
              <div className={tiles.diActions}>
                {confirming ? (
                  <span className={tiles.diDone} role="status">
                    <Glyph name={confirming === "recognize" ? "check" : "lock"} size={15} />
                    {confirming === "recognize" ? "Recognized" : "Freezing demo card"}
                  </span>
                ) : (
                  <>
                    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => decide("recognize")}>
                      Recognize
                    </button>
                    <button type="button" className={styles.btn} onClick={() => decide("freeze")}>
                      Freeze demo card
                    </button>
                  </>
                )}
              </div>
              {frozenElsewhere ? <p className={tiles.diNote}>Card {DEMO.cardLast4} is frozen — this payment would decline.</p> : null}
            </div>
          </div>
        </div>
        {!open && result ? (
          <div className={tiles.diResult} role="status">
            <p className={tiles.diResultTitle}>{result.title}</p>
            <p className={tiles.diResultText}>
              {DEMO.merchant} · {DEMO.amountLabel}. {result.text}
            </p>
            <button type="button" className={`${styles.btn} ${styles.btnGhost} ${tiles.diReset}`} onClick={() => demoStore.resetDecision()}>
              <Glyph name="reset" size={14} />
              Reset demo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!withHeader) return panel;
  return (
    <section className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.payment}`}>
        <FeatureHeader feature={FEATURES.payment} headingId={h} showBody={false} className={tiles.paymentHead} />
        {panel}
        <span className={`${styles.demoLabel} ${tiles.paymentFoot}`}>{DEMO.label}</span>
      </div>
    </section>
  );
}
