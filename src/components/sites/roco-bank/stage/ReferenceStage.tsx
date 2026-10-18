"use client";

import type { ReactNode } from "react";

import { useAnim } from "../motion-context";
import styles from "./stage.module.css";

type Props = {
  /** page content inside the inset canvas (zoomed together during the intro) */
  canvas: ReactNode;
  /** layers in stage space above the canvas (cards, header) */
  overlay: ReactNode;
  scale: number;
};

/** 1600×1200 presentation frame: pale mat + inset 1440×1024 web canvas (forensics §2). At the
 *  reference capture (1600×1200 viewport) `scale` is exactly 1. */
export function ReferenceStage({ canvas, overlay, scale }: Props) {
  const anim = useAnim();
  return (
    <div className={styles.viewport}>
      <div className={styles.stage} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div ref={anim("zoom")} className={styles.zoom}>
          <div className={styles.canvas}>{canvas}</div>
        </div>
        {overlay}
      </div>
    </div>
  );
}
