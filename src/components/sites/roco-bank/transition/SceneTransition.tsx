"use client";

import type { ReactNode } from "react";

import { useAnim } from "../motion-context";
import styles from "./transition.module.css";

/** The dark panel that rises from the canvas bottom by the page scroll S (it is a real scroll of
 *  one canvas height, not a mask — forensics §7.4). */
export function SceneTransition({ children }: { children: ReactNode }) {
  const anim = useAnim();
  return (
    <div ref={anim("dark")} className={styles.dark}>
      {children}
    </div>
  );
}
