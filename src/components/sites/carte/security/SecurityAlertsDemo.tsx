"use client";

import { useId, useRef, useState } from "react";

import { NotificationStack, type Notice } from "@/components/references/affectui/notification-stack";
import { ALERTS, demoStore, useDemo } from "@/lib/carte/security-demo";
import { FEATURES } from "@/lib/roco-bank/content";

import { FeatureHeader, Glyph } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";

/** Bento `invested` — Alerts that matter. Affect UI Notification Stack (official source, used through
 *  props): only the front demo alert is readable, dismissing it reveals the next. The adapter keeps
 *  the dismissed ids in the shared model (the phone shows the same count), moves focus to the next
 *  notice or to Reset, and remounts the stack on reset. */
export function SecurityAlertsDemo({ withHeader = true }: { withHeader?: boolean }) {
  const { dismissed } = useDemo();
  const h = useId();
  const box = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const notices: Notice[] = ALERTS.filter((a) => !dismissed.includes(a.id)).map((a) => ({ ...a }));
  const left = notices.length;

  const focusNext = () =>
    window.setTimeout(() => {
      const next = box.current?.querySelector<HTMLElement>('[data-depth="0"] button, [data-reset]');
      next?.focus();
    }, 360);

  const panel = (
    <div ref={box} className={tiles.alertsBox}>
      {left > 0 ? (
        <NotificationStack
          key={round}
          notices={notices}
          onDismiss={(n) => {
            demoStore.dismissAlert(n.id as (typeof ALERTS)[number]["id"]);
            focusNext();
          }}
        />
      ) : (
        <div className={tiles.alertsClear} role="status">
          <Glyph name="check" size={18} />
          <span>All clear in the demo.</span>
          <button
            type="button"
            data-reset
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              demoStore.resetAlerts();
              setRound((r) => r + 1);
            }}
          >
            <Glyph name="reset" size={14} />
            Reset alerts
          </button>
        </div>
      )}
      <p className={styles.srOnly} aria-live="polite">
        {left} demo {left === 1 ? "alert" : "alerts"} to review
      </p>
    </div>
  );

  if (!withHeader) return panel;
  return (
    <section className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.alerts}`}>
        <FeatureHeader feature={FEATURES.invested} headingId={h} showBody={false} className={tiles.alertsHead} />
        {panel}
      </div>
    </section>
  );
}
