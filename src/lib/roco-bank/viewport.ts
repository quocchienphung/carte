// Layout viewport in CSS px, excluding classic scrollbars. macOS overlay scrollbars take no space
// (innerWidth == clientWidth), but Windows — and macOS with "Show scroll bars: Always" or a mouse
// attached — reserves ~15 px for them. Sizing the full-bleed layers from innerWidth then pushed the
// WebGL canvas past the right edge (a horizontal scrollbar appeared, stealing 15 px of height) and
// put the device ~8 px off the centre of the DOM bento it takes over from.

export type Viewport = { w: number; h: number };

export function viewportSize(): Viewport {
  const el = document.documentElement;
  return { w: el.clientWidth || window.innerWidth, h: el.clientHeight || window.innerHeight };
}

/** Fires on window resize, on scrollbars appearing / disappearing (no resize event for that) and on
 *  devicePixelRatio changes (window dragged between a Retina and a 100 % / 125 % / 150 % display). */
export function subscribeViewport(cb: () => void) {
  window.addEventListener("resize", cb);
  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => cb());
  ro?.observe(document.documentElement);
  // a resolution query only matches one DPR: re-arm it at the new value after every change
  let mq: MediaQueryList | null = null;
  const watchDpr = () => {
    mq?.removeEventListener("change", onDpr);
    mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener("change", onDpr);
  };
  const onDpr = () => {
    watchDpr();
    cb();
  };
  watchDpr();
  return () => {
    window.removeEventListener("resize", cb);
    ro?.disconnect();
    mq?.removeEventListener("change", onDpr);
  };
}
