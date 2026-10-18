"use client";

import Image from "next/image";

import { HERO_COPY, PARTNERS, TILES } from "@/lib/roco-bank/content";
import { CARD_STACK, type TileId } from "@/lib/roco-bank/geometry";

import { LogoMark } from "../brand/LogoMark";
import { Wordmark } from "../brand/Wordmark";
import { BankCard } from "../hero/BankCard";
import { PARTNER_MARKS } from "../hero/partner-logos";
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
          <a className={styles.brand} href="#top" aria-label="Roco.bank home">
            <LogoMark size={32} />
            <Wordmark />
          </a>
        </header>

        <main id="top">
          <section className={styles.hero} aria-labelledby="hero-title-r">
            <div className={styles.cards} aria-label="Roco.bank card designs" role="group">
              {[...CARD_STACK].map((id, i) => (
                <div key={id} className={styles.cardSlot} data-i={i}>
                  <BankCard id={id} layout="flow" />
                </div>
              ))}
            </div>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{HERO_COPY.eyebrow}</p>
              <h1 id="hero-title-r" className={styles.headline}>
                <span>
                  <b>Roco</b>.bank
                </span>{" "}
                <span>
                  Professional <b>bank</b> card
                </span>
              </h1>
              <p className={styles.paragraph}>{HERO_COPY.paragraph.map((l) => l.text).join(" ")}</p>
            </div>
            <div className={styles.partners} aria-label="Trusted by" role="list">
              <div className={styles.partnerTrack}>
                {[...PARTNERS, ...PARTNERS].map((id, i) => {
                  const m = PARTNER_MARKS[id];
                  return (
                    <div key={i} className={styles.partner} role="listitem" aria-hidden={i >= PARTNERS.length || undefined}>
                      <svg viewBox={`0 0 ${m.w} 22`} width={m.w} height={22} fill="currentColor" role="img" aria-label={m.title}>
                        {m.body}
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={styles.bento} aria-label="Features" id="features">
            {TILE_ORDER.map((id) => {
              const t = TILES[id];
              return (
                <a key={id} href={t.href} className={`${styles.tile} ${styles[`t_${id}`]}`} aria-label={t.label}>
                  <Image
                    className={styles.tileArt}
                    src={`/sites/roco-bank/bento/${id}.webp`}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 50vw"
                    unoptimized
                  />
                  <span className={styles.tileText} aria-hidden>
                    {t.text.map((line, i) => (
                      <span key={i} className={styles[`r_${line.kind}`]}>
                        {line.kind === "eyebrow"
                          ? line.text
                          : line.parts.map((p, j) => (
                              <span key={j} className={p.weight === "medium" ? styles.medium : undefined}>
                                {p.text}
                              </span>
                            ))}
                      </span>
                    ))}
                  </span>
                </a>
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
