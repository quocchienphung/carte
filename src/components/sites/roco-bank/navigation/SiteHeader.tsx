"use client";

import { NAV } from "@/lib/roco-bank/content";

import { LogoMark } from "../brand/LogoMark";
import { Wordmark } from "../brand/Wordmark";
import { useAnim } from "../motion-context";
import { PillNavButton } from "./PillNavButton";
import styles from "./navigation.module.css";

type Props = {
  theme: "light" | "dark";
  /** the dark copy is a visual duplicate for the split-inversion; it is hidden from AT and tab order */
  decorative?: boolean;
  layout?: "stage" | "flow";
};

/** Fixed site header. In the reference stage two copies are stacked and clipped along the rising
 *  dark section edge (forensics §7.4: per-pixel split, f137–f139). */
export function SiteHeader({ theme, decorative = false, layout = "stage" }: Props) {
  const anim = useAnim();
  const clipKey = theme === "light" ? "headerLight" : "headerDark";
  const innerKey = theme === "light" ? "headerInner" : "headerDarkInner";
  return (
    <div
      ref={layout === "stage" ? anim(clipKey) : undefined}
      className={`${styles.clip} ${layout === "flow" ? styles.flowClip : ""}`}
      aria-hidden={decorative || undefined}
    >
      <header ref={layout === "stage" ? anim(innerKey) : undefined} className={`${styles.header} ${styles[theme]}`}>
        <a className={styles.brand} href="#top" tabIndex={decorative ? -1 : undefined} aria-label="Roco.bank home">
          <LogoMark className={styles.mark} size={40} />
          <Wordmark className={styles.word} />
        </a>
        <nav className={styles.nav} aria-label="Account">
          {NAV.map((n) => (
            <PillNavButton
              key={n.id}
              label={n.label}
              href={n.href}
              variant={n.variant}
              theme={theme}
              tabIndex={decorative ? -1 : undefined}
            />
          ))}
        </nav>
      </header>
    </div>
  );
}
