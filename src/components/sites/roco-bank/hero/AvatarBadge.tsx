import Image from "next/image";

import styles from "./hero.module.css";

/** 40 px portrait, cropped from the reference rest frame (1× source, upsampled 2×). */
export function AvatarBadge({ id, name }: { id: string; name: string }) {
  return (
    <Image
      className={styles.avatar}
      src={`/sites/roco-bank/avatars/${id}.webp`}
      alt=""
      title={name}
      width={40}
      height={40}
      unoptimized
      loading="eager"
      decoding="sync"
      draggable={false}
    />
  );
}
