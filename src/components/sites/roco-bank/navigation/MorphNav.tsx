"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import styles from "./morph-nav.module.css";

// Morphing bottom navigation — reconstructed from the details.so "Morphing Navigation" reference
// (references/navigation/morphing-nav-reference.mp4, 720×720 @30fps, measured frame by frame):
//  • closed: dark bar, pebble mark bottom-left, white "Menu" pill bottom-right (gray on hover)
//  • open:   width expands first (≈0.12 s), then height rises with a fast ease-out (≈0.45 s);
//            mark + pill stay pinned to the bottom corners; "Menu" rolls up to "Close";
//            items rise out of line masks with a 0.06 s stagger, divider draws, socials follow
//  • hover:  siblings dim, a dash slides in before the hovered item
//  • close:  content fades fast, height collapses first, width last
// Every property is a CSS transition, so rapid clicks retarget smoothly from the current value.

export type NavItem = { id: string; label: string; onSelect?: () => void; href?: string };

type Props = {
  items: NavItem[];
  socials: { label: string; href: string }[];
};

export function MorphNav({ items, socials }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setHover(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        toggleRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={styles.root} data-state={open ? "open" : "closed"} data-hovering={hover ? "true" : undefined}>
      <nav className={styles.shell} aria-label="Primary">
        <div id={panelId} className={styles.panel} aria-hidden={!open} inert={!open}>
          <ul className={styles.items} onPointerLeave={() => setHover(null)}>
            {items.map((it, i) => (
              <li key={it.id} className={styles.itemRow} style={{ ["--i" as string]: i }}>
                <span className={styles.mask}>
                  <a
                    href={it.href ?? `#${it.id}`}
                    className={`${styles.item} ${hover === it.id ? styles.itemActive : ""}`}
                    onPointerEnter={() => setHover(it.id)}
                    onFocus={() => setHover(it.id)}
                    onBlur={() => setHover(null)}
                    onClick={(e) => {
                      if (it.onSelect) {
                        e.preventDefault();
                        it.onSelect();
                      }
                      close();
                    }}
                  >
                    <span className={styles.dash} aria-hidden>
                      –
                    </span>
                    <span className={styles.itemLabel}>{it.label}</span>
                  </a>
                </span>
              </li>
            ))}
          </ul>
          <span className={styles.divider} aria-hidden />
          <ul className={styles.socials}>
            {socials.map((s, i) => (
              <li key={s.label} className={styles.socialRow} style={{ ["--i" as string]: i }}>
                <a href={s.href} className={styles.social} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a href="#top" className={styles.mark} aria-label="Home" onClick={close}>
          <svg viewBox="0 0 26 18" width="26" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M11.8 1.2C16.9.3 22.6 2.6 24.6 7.2c1.6 3.8-.6 8.4-5.6 9.6-4.4 1.1-9.3.3-12.7-1.6L1 16.9l2.6-4.3C1.8 10.6 1.4 7.9 2.9 5.6 4.6 3.1 7.8 1.9 11.8 1.2Z"
            />
          </svg>
        </a>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close() : setOpen(true))}
        >
          <span className={styles.roll} aria-hidden>
            <span>Menu</span>
            <span>Close</span>
          </span>
          <span className={styles.srOnly}>{open ? "Close menu" : "Open menu"}</span>
        </button>
      </nav>
    </div>
  );
}
