"use client";

import { useEffect, useId } from "react";

import { ThinkingLoader } from "@/components/references/affectui/thinking-loader";
import { DEMO, VERIFY_PHASES, demoStore, useDemo } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader, Glyph } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";

const PHASE_MS = 950;

/** Runs the simulated step-up check: checking (phases) → verified. Shared by the bento tile and the
 *  phone section's step 05, so both show the same state. */
export function useVerificationRun() {
  const { verification } = useDemo();
  useEffect(() => {
    if (verification !== "checking") return;
    const t = window.setTimeout(() => demoStore.setVerification("verified"), PHASE_MS * VERIFY_PHASES.length);
    return () => window.clearTimeout(t);
  }, [verification]);
  return verification;
}

/** Bento `easy` — Verify the moment. Affect UI Thinking Loader (official source, controlled `done`)
 *  walks through the check phases and settles on a drawn check. Never asks for a real code. */
export function VerificationDemo() {
  const verification = useVerificationRun();
  const h = useId();
  return (
    <section className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.verify}`}>
        <FeatureHeader feature={FEATURES.easy} headingId={h} className={tiles.verifyHead} />
        <div className={tiles.verifyRow}>
          {verification === "idle" ? (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => demoStore.setVerification("checking")}>
              <Glyph name="shieldCheck" size={14} />
              Run check
            </button>
          ) : (
            <>
              <ThinkingLoader
                phases={[...VERIFY_PHASES]}
                interval={PHASE_MS}
                done={verification === "verified"}
                doneLabel="Verified · demo"
                size="sm"
              />
              {verification === "verified" ? (
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => demoStore.setVerification("idle")}>
                  <Glyph name="reset" size={14} />
                  Reset
                </button>
              ) : null}
            </>
          )}
          <span className={`${styles.demoLabel} ${tiles.verifyLabel}`}>{DEMO.label}</span>
        </div>
      </div>
    </section>
  );
}
