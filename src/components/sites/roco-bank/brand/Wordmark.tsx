import { BRAND } from "@/lib/roco-bank/content";

import styles from "./brand.module.css";

/** "Roco.bank" as live text (never rasterised). */
export function Wordmark({ className }: { className?: string }) {
  return <span className={`${styles.wordmark} ${className ?? ""}`}>{BRAND.name}</span>;
}
