"use client";

import type { ReactNode } from "react";

import { DecisionInbox } from "@/components/references/affectui/decision-inbox";
import { EnrichmentOrbit } from "@/components/references/affectui/enrichment-orbit";
import { IntegrationBeam } from "@/components/references/affectui/integration-beam";
import { LayerStack } from "@/components/references/affectui/layer-stack";
import { NotificationStack } from "@/components/references/affectui/notification-stack";
import { SegmentedControl } from "@/components/references/affectui/segmented-control";
import { ThinkingLoader } from "@/components/references/affectui/thinking-loader";
import { demoStore } from "@/lib/carte/security-demo";
import { BENTO_A, BENTO_B, type TileId } from "@/lib/roco-bank/geometry";

import { BENTO_SCENES } from "../security/scenes";
import styles from "./lab.module.css";

/** Dev-only reference lab: each Affect UI source untouched (light + dark), then the Carte adapter
 *  at its bento sizes (state A and B) on the dark bento surface. */
export function ReferenceLab() {
  return (
    <main className={styles.lab}>
      <header className={styles.top}>
        <h1>Carte reference lab</h1>
        <p>Dev only. Left: Affect UI official source (unmodified). Right: Carte adapter at bento state A and B.</p>
        <button type="button" onClick={() => demoStore.resetAll()}>
          Reset demo model
        </button>
      </header>

      <Pair
        id="credit"
        title="Segmented Control → CardAccessDemo"
        source={<SegmentedControl options={[{ value: "a", label: "Overview" }, { value: "b", label: "Activity" }, { value: "c", label: "Settings" }]} />}
      />
      <Pair id="trust" title="Layer Stack → SecurityLayersScene" source={<LayerStack />} wide />
      <Pair id="customers" title="Integration Beam → PaymentRouteScene" source={<IntegrationBeam />} wide />
      <Pair id="ai" title="Enrichment Orbit → RiskSignalsScene" source={<EnrichmentOrbit />} />
      <Pair id="easy" title="Thinking Loader → VerificationDemo" source={<ThinkingLoader />} />
      <Pair
        id="payment"
        title="Decision Inbox → PaymentDecisionDemo"
        source={
          <DecisionInbox
            decisions={[
              { id: "a", title: "Renew Figma for the design team?", detail: "12 seats · $1,800 per year · renews in 5 days", primary: "Renew", secondary: "Change seats" },
            ]}
          />
        }
      />
      <Pair
        id="invested"
        title="Notification Stack → SecurityAlertsDemo"
        source={
          <NotificationStack
            notices={[
              { id: "n1", badge: "Notice", title: "Scheduled maintenance", text: "Some features may be unavailable on Sunday." },
              { id: "n2", badge: "Update", title: "New export options", text: "Export reports as CSV or PDF." },
              { id: "n3", badge: "Tip", title: "Keyboard shortcuts", text: "Press ? to see all shortcuts." },
            ]}
          />
        }
      />
    </main>
  );
}

function Pair({ id, title, source, wide = false }: { id: TileId; title: string; source: ReactNode; wide?: boolean }) {
  const Scene = BENTO_SCENES[id];
  return (
    <section className={styles.pair} data-wide={wide || undefined}>
      <h2>{title}</h2>
      <div className={styles.sources}>
        <div className={styles.light}>{source}</div>
        <div className={styles.dark} data-theme="dark">
          {source}
        </div>
      </div>
      <div className={styles.adapters}>
        {(["A", "B"] as const).map((k) => {
          const r = (k === "A" ? BENTO_A : BENTO_B)[id];
          return (
            <figure key={k} className={styles.slot}>
              <figcaption>
                {k} · {Math.round(r.w)}×{Math.round(r.h)}
              </figcaption>
              <div className={styles.tileBox} style={{ width: r.w, height: r.h }}>
                <Scene />
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
