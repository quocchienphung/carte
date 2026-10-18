"use client";

import { BRAND, CAPABILITIES, HERO_COPY } from "@/lib/roco-bank/content";
import { CARD_STACK, type TileId } from "@/lib/roco-bank/geometry";

import { SecurityScope } from "../../carte/security/parts";
import { BENTO_SCENES } from "../../carte/security/scenes";
import { LogoMark } from "../brand/LogoMark";
import { Wordmark } from "../brand/Wordmark";
import { BankCard } from "../hero/BankCard";
import { CapabilityMark } from "../hero/capability-marks";
import { MorphNav } from "../navigation/MorphNav";
import styles from "./responsive.module.css";

const TILE_ORDER: TileId[] = ["credit", "customers", "trust", "ai", "easy", "payment", "invested"];

/** Intentional responsive layout for viewports < 1024 px and for reduced motion. The video only
 *  shows a desktop composition, so this is a reflow of the same components and content — not a
 *  pixel comparison target. Motion: CSS entrance + marquee, disabled under prefers-reduced-motion. */
export function ResponsiveSite() {
  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <header className={styles.header}>
          <a className={styles.brand} href="#top" aria-label={`${BRAND.name} home`}>
            <LogoMark size={32} />
            <Wordmark />
          </a>
        </header>

        <main id="top">
          <section className={styles.hero} aria-labelledby="hero-title-r">
            <div className={styles.cards} aria-label="Demo card designs" role="group">
              {[...CARD_STACK].map((id, i) => (
                <div key={id} className={styles.cardSlot} data-i={i}>
                  <BankCard id={id} layout="flow" />
                </div>
              ))}
            </div>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{HERO_COPY.eyebrow}</p>
              <h1 id="hero-title-r" className={styles.headline}>
                {([1, 2] as const).map((n) => (
                  <span key={n}>
                    {HERO_COPY.headline
                      .filter((w) => w.line === n)
                      .map((w, i, arr) => (
                        <span key={w.text}>
                          {w.weight === "medium" ? <b>{w.text}</b> : w.text}
                          {i < arr.length - 1 ? " " : null}
                        </span>
                      ))}{" "}
                  </span>
                ))}
              </h1>
              <p className={styles.paragraph}>{HERO_COPY.paragraph.map((l) => l.text).join(" ")}</p>
            </div>
            <div className={styles.partners} aria-label="What the Carte demo covers" role="list">
              <div className={styles.partnerTrack}>
                {[...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
                  <div key={i} className={styles.partner} role="listitem" aria-hidden={i >= CAPABILITIES.length || undefined}>
                    <CapabilityMark id={c.id} label={c.label} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.bento} aria-labelledby="features-title-r" id="features">
            <h2 id="features-title-r" className={styles.srOnly}>
              How {BRAND.name} keeps your cards in your hands
            </h2>
            {TILE_ORDER.map((id) => {
              const Scene = BENTO_SCENES[id];
              return (
                <div key={id} className={`${styles.tile} ${styles[`t_${id}`]}`}>
                  <SecurityScope className={styles.tileScope}>
                    <Scene />
                  </SecurityScope>
                </div>
              );
            })}
          </section>
        </main>
      </div>
      <MorphNav
        items={[
          { id: "top", label: "Home" },
          { id: "features", label: "Explore" },
          { id: "features", label: "About", href: "#features" },
          { id: "contact", label: "Contact", href: "#top" },
        ].map((it, i) => ({ ...it, id: `${it.id}-${i}`, href: it.href ?? `#${it.id}` }))}
        socials={[
          { label: "LinkedIn", href: "https://www.linkedin.com/" },
          { label: "Instagram", href: "https://www.instagram.com/" },
        ]}
      />
    </div>
  );
}
