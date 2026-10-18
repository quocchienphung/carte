"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

import type { StyleApplier } from "@/lib/roco-bank/motion/applier";

const AnimContext = createContext<StyleApplier | null>(null);

export function AnimProvider({ applier, children }: { applier: StyleApplier; children: ReactNode }) {
  return <AnimContext.Provider value={applier}>{children}</AnimContext.Provider>;
}

/** Returns a ref factory: `ref={anim("card.orange")}` registers the node with the style applier.
 *  Outside a provider (e.g. the responsive layout) it is a no-op, so components stay reusable. */
export function useAnim() {
  const applier = useContext(AnimContext);
  return useCallback(
    (key: string) => (el: HTMLElement | SVGElement | null) => {
      applier?.register(key, el as HTMLElement | null);
    },
    [applier],
  );
}
