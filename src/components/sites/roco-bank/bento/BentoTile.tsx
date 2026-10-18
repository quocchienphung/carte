"use client";

import Image from "next/image";

import { TILES } from "@/lib/roco-bank/content";
import { BENTO_A, TILE_ART, TILE_BACKING, type TileId } from "@/lib/roco-bank/geometry";

import { useAnim } from "../motion-context";
import styles from "./bento.module.css";

type Props = {
  id: TileId;
  onFocusChange?: (id: TileId, focused: boolean) => void;
};

/** One editorial tile: rounded mask → page-anchored artwork layer → dim layer → live text layer.
 *  Geometry (rect, scale), artwork offset, dim and text offset are written by the applier. */
export function BentoTile({ id, onFocusChange }: Props) {
  const anim = useAnim();
  const tile = TILES[id];
  const a = BENTO_A[id];
  const art = TILE_ART[id];
  return (
    <a
      ref={anim(`tile.${id}`)}
      href={tile.href}
      aria-label={tile.label}
      className={`${styles.tile} ${styles[`tile_${id}`]}`}
      data-tile={id}
      style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
      onPointerEnter={() => onFocusChange?.(id, true)}
      onPointerLeave={() => onFocusChange?.(id, false)}
      onFocus={() => onFocusChange?.(id, true)}
      onBlur={() => onFocusChange?.(id, false)}
    >
      <span className={styles.mask}>
        <Image
          ref={anim(`tile.${id}.art`)}
          className={styles.art}
          src={`/sites/roco-bank/bento/${id}.webp`}
          alt=""
          width={art.w}
          height={art.h}
          style={{ width: art.w, height: art.h, transform: `translate3d(${art.x - a.x}px, ${art.y - a.y}px, 0)` }}
          unoptimized
          loading="eager"
          decoding="sync"
          draggable={false}
        />
        <span ref={anim(`tile.${id}.dim`)} className={styles.dim} style={{ background: TILE_BACKING[id] }} />
      </span>
      <span ref={anim(`tile.${id}.text`)} className={styles.text} aria-hidden>
        {tile.text.map((line, i) => (
          <span key={i} className={`${styles.line} ${styles[`k_${line.kind}`]} ${styles[`l_${id}_${i}`]}`}>
            {line.kind === "eyebrow"
              ? line.text
              : line.parts.map((p, j) => (
                  <span key={j} className={p.weight === "medium" ? styles.medium : styles.light}>
                    {p.text}
                  </span>
                ))}
          </span>
        ))}
      </span>
    </a>
  );
}
