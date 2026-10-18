"use client";

import { useId } from "react";

import { IntegrationBeam, type BeamTool } from "@/components/references/affectui/integration-beam";
import type { GlyphName } from "@/lib/carte/glyphs";
import { ROUTE, type RouteNodeId } from "@/lib/carte/security-demo";
import { BRAND, FEATURES } from "@/lib/roco-bank/content";

import { LogoMark } from "../../roco-bank/brand/LogoMark";
import { FeatureHeader, Glyph } from "./parts";
import styles from "./security.module.css";
import tiles from "./tiles.module.css";

/** node → glyph (also used by the canvas painter) */
export const ROUTE_GLYPH: Record<RouteNodeId, GlyphName> = {
  card: "card",
  device: "device",
  merchant: "store",
  checks: "shieldCheck",
  approval: "check",
  receipt: "receipt",
};

const tool = (n: { id: RouteNodeId; name: string }): BeamTool => ({ name: n.name, logo: <Glyph name={ROUTE_GLYPH[n.id]} size={28} /> });
const LEFT = ROUTE.in.map(tool);
const RIGHT = ROUTE.out.map(tool);
const CENTER = { name: BRAND.name, logo: <LogoMark size={36} /> };

/** Bento `customers` — A safer route for every payment. Affect UI Integration Beam (official source,
 *  used through its props): pulses travel Card · Device · Merchant → Carte → Checks · Approval ·
 *  Receipt; hover focuses a step, click pauses it with a live "n connected" status. */
export function PaymentRouteScene() {
  const h = useId();
  return (
    <section className={styles.tile} aria-labelledby={h}>
      <div className={`${styles.tileInner} ${tiles.route}`}>
        <FeatureHeader feature={FEATURES.customers} headingId={h} className={tiles.routeHead} />
        <div className={tiles.routeBeam}>
          <IntegrationBeam
            left={LEFT}
            right={RIGHT}
            center={CENTER}
            label="A demo payment travels from card, device and merchant through Carte to checks, your approval and the receipt"
          />
        </div>
      </div>
    </section>
  );
}
