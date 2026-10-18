"use client";

import type { CSSProperties, ReactNode } from "react";

import { useAnim } from "../motion-context";
import styles from "./stage.module.css";

export type FrameGeometry = { scale: number; w: number; h: number; offX: number; offY: number };

/** Fit the measured 1440×1024 composition into the viewport and extend the frame to every edge. */
export function frameFor(vw: number, vh: number): FrameGeometry {
  const scale = Math.min(vw / 1440, vh / 1024);
  const w = vw / scale;
  const h = vh / scale;
  return { scale, w, h, offX: (w - 1440) / 2, offY: (h - 1024) / 2 };
}

type Props = { frame: FrameGeometry; canvas: ReactNode; cards: ReactNode; header: ReactNode };

/** Full-bleed website frame (interactive mode): no presentation mat — white hero / near-black
 *  bento backgrounds reach the viewport edges, the measured layout stays centred. */
export function FullscreenStage({ frame, canvas, cards, header }: Props) {
  const anim = useAnim();
  const vars = {
    width: frame.w,
    height: frame.h,
    transform: `scale(${frame.scale})`,
    "--off-x": `${frame.offX}px`,
    "--off-y": `${frame.offY}px`,
    "--frame-w": `${frame.w}px`,
    "--frame-h": `${frame.h}px`,
    // website mode has no mat above the canvas: keep the overhanging top card fully on screen
    "--cards-dy": `${Math.max(0, 72 - frame.offY)}px`,
  } as CSSProperties;
  return (
    <div className={styles.fsViewport}>
      <div className={styles.fsFrame} style={vars}>
        <div ref={anim("zoom")} className={styles.fsZoom}>
          <div className={styles.fsCanvas}>{canvas}</div>
        </div>
        {cards}
        <div className={styles.fsHeaderLayer}>{header}</div>
      </div>
    </div>
  );
}
