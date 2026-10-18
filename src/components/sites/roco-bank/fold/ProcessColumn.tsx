"use client";

import { forwardRef } from "react";

import styles from "./process.module.css";

// Clone of the Plinth "What actually happens to a request." section components (eyebrow, heading,
// lede, numbered step cards with active / upcoming / passed states), measured on
// plinthdev.framer.website. The isometric block stack is intentionally removed; the device beside
// this column plays its role. Copy adapted to the Apple Pay flow shown on the cover screen.

export const PROCESS_STEPS = [
  { title: "Wake", body: "Double-click the side button. Wallet opens on the cover screen, no unlock needed." },
  { title: "Cards", body: "Your Roco.bank cards rise into the stack, the one you used last on top." },
  { title: "Choose", body: "Vietcombank Priority is your default. Swipe the stack to pay with another card." },
  { title: "Pay", body: "Tap Pay. The merchant and the exact amount are shown before anything is sent." },
  { title: "Face ID", body: "Face ID confirms it is you in under a second. Your card number is never shared." },
  { title: "Done", body: "A green check and a soft chime. The receipt lands in Roco.bank instantly." },
] as const;

type Props = { onPay: () => void };

export const ProcessColumn = forwardRef<HTMLDivElement, Props>(function ProcessColumn({ onPay }, ref) {
  return (
    <div ref={ref} className={styles.column} data-active="-1">
      <p className={styles.eyebrow}>Apple Pay</p>
      <h2 className={styles.heading}>
        What actually happens <br />
        when you pay.
      </h2>
      <p className={styles.lede}>Six steps, and the only one you notice takes under a second.</p>
      <ol className={styles.steps}>
        {PROCESS_STEPS.map((s, i) => (
          <li key={s.title} className={styles.step} data-step={i}>
            <div className={styles.card}>
              <p className={styles.num}>{String(i + 1).padStart(2, "0")}</p>
              <p className={styles.title}>{s.title}</p>
              <p className={styles.body}>{s.body}</p>
              {i === 3 ? (
                <button type="button" className={styles.pay} onClick={onPay}>
                  <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
                    <path
                      d="M2 6V4a2 2 0 0 1 2-2h2M14 2h2a2 2 0 0 1 2 2v2M18 14v2a2 2 0 0 1-2 2h-2M6 18H4a2 2 0 0 1-2-2v-2M7 7v1.5M13 7v1.5M10 7v4H9M7.2 13.4a4 4 0 0 0 5.6 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Click to pay
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
});
