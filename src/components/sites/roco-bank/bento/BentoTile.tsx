"use client";

import { BENTO_A, type TileId } from "@/lib/roco-bank/geometry";

import { SecurityScope } from "../../carte/security/parts";
import { BENTO_SCENES } from "../../carte/security/scenes";
import { useAnim } from "../motion-context";
import styles from "./bento.module.css";

type Props = {
  id: TileId;
  onFocusChange?: (id: TileId, focused: boolean) => void;
};

/** One bento tile: the rounded box whose rect / scale the applier writes (`tile.<id>`), holding a
 *  live Carte security scene. Not a link — the scenes contain their own buttons and tabs, so the box
 *  is a plain container (no nested interactive elements). Hover and focus-within report to the
 *  A ↔ B morph; moving focus between controls of the same tile does not reset it. */
export function BentoTile({ id, onFocusChange }: Props) {
  const anim = useAnim();
  const a = BENTO_A[id];
  const Scene = BENTO_SCENES[id];
  return (
    <div
      ref={anim(`tile.${id}`)}
      className={`${styles.tile} ${styles[`tile_${id}`]}`}
      data-tile={id}
      style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
      onPointerEnter={() => onFocusChange?.(id, true)}
      onPointerLeave={() => onFocusChange?.(id, false)}
      onFocus={() => onFocusChange?.(id, true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onFocusChange?.(id, false);
      }}
    >
      <SecurityScope className={styles.scope}>
        <Scene />
      </SecurityScope>
    </div>
  );
}
