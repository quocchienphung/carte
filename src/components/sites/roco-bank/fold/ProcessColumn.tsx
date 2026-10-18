"use client";

import { forwardRef } from "react";

import { ChangeSummary } from "@/components/references/affectui/change-summary";
import { ThinkingLoader } from "@/components/references/affectui/thinking-loader";
import { DEMO, VERIFY_PHASES, decisionResult, demoStore, remoteRows, useDemo } from "@/lib/carte/security-demo";
import { SECURITY_STORY } from "@/lib/roco-bank/content";

import styles from "./process.module.css";

// Carte security story beside the device (Plinth process-column components: eyebrow, heading, lede,
// numbered cards with upcoming / active / passed states, activated at 48 % of the viewport). Six
// checkpoints mirror the cover screen's process time; the inline controls write the shared demo
// model, so the bento, the phone and this column always show the same demo card.

export const PROCESS_STEPS = SECURITY_STORY.steps;

type Props = { onRun: () => void; onReset: () => void };

export const ProcessColumn = forwardRef<HTMLDivElement, Props>(function ProcessColumn({ onRun, onReset }, ref) {
  const demo = useDemo();
  const result = decisionResult(demo.decision);
  const rows = remoteRows(demo);
  return (
    <div ref={ref} className={styles.column} data-active="-1">
      <p className={styles.eyebrow}>{SECURITY_STORY.eyebrow}</p>
      <h2 className={styles.heading}>
        What happens <br />
        before you approve.
      </h2>
      <p className={styles.lede}>{SECURITY_STORY.lede}</p>
      <div className={styles.cta}>
        <button type="button" className={styles.run} onClick={onRun}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
          </svg>
          {SECURITY_STORY.cta}
        </button>
        <button type="button" className={styles.reset} onClick={onReset}>
          {SECURITY_STORY.reset}
        </button>
        <span className={styles.demoLabel}>{DEMO.label}</span>
      </div>
      <ol className={styles.steps}>
        {PROCESS_STEPS.map((s, i) => (
          <li key={s.title} className={styles.step} data-step={i}>
            <div className={styles.card}>
              <p className={styles.num}>{String(i + 1).padStart(2, "0")}</p>
              <p className={styles.title}>{s.title}</p>
              <p className={styles.body}>{s.body}</p>
              {i === 2 ? (
                <p className={styles.facts}>
                  <span>{DEMO.merchant}</span>
                  <span>{DEMO.amountLabel}</span>
                  <span>Card ending {DEMO.cardLast4}</span>
                </p>
              ) : null}
              {i === 3 ? (
                demo.decision === "pending" ? (
                  <div className={styles.inline}>
                    <span className={styles.flag}>{DEMO.device} · {DEMO.verdict}</span>
                    <button type="button" className={styles.pay} onClick={() => demoStore.decide("recognize")}>
                      Recognize
                    </button>
                    <button type="button" className={styles.ghost} onClick={() => demoStore.decide("freeze")}>
                      Freeze demo card
                    </button>
                  </div>
                ) : (
                  <p className={styles.outcome} data-tone={result?.tone} role="status">
                    {result?.title}. {result?.text}
                  </p>
                )
              ) : null}
              {i === 4 && demo.verification !== "idle" ? (
                <div className={styles.inline}>
                  <ThinkingLoader phases={[...VERIFY_PHASES]} interval={950} done={demo.verification === "verified"} doneLabel="Verified · demo" size="sm" />
                </div>
              ) : null}
              {i === 5 ? (
                <p className={styles.outcome} data-tone={demo.decision === "frozen" || demo.card === "frozen" ? "warn" : "ok"} data-paid-only>
                  {demo.decision === "frozen" || demo.card === "frozen" ? `Card ending ${DEMO.cardLast4} frozen · payment declined` : "Approved · demo payment, no real charge"}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.remote}>
        <ChangeSummary
          title="Remote overview"
          period="Demo"
          changes={rows.map((r) => ({
            label: r.label,
            change: r.value,
            tone: r.tone === "good" ? "good" : r.tone === "bad" ? "bad" : "neutral",
            direction: r.tone === "bad" ? "up" : undefined,
          }))}
        />
        <p className={styles.remoteNote}>
          The same demo card, managed from the cover screen: freeze it in the bento above, review the payment, run the check.
        </p>
      </div>
    </div>
  );
});
