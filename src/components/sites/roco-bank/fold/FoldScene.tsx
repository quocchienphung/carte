"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { decorGate, demoStore } from "@/lib/carte/security-demo";
import type { FoldEngine } from "@/lib/roco-bank/fold/engine";
import type { WalletScreen, drawInnerScreen } from "@/lib/roco-bank/fold/screens";
import { ACTIVE_LINE } from "@/lib/roco-bank/scroll-map";
import { subscribeViewport, viewportSize } from "@/lib/roco-bank/viewport";

import { ProcessColumn } from "./ProcessColumn";
import styles from "./fold.module.css";

export type FoldUpdate = {
  pull: number;
  fold: number;
  after: number;
  processPx: number;
  visible: boolean;
  /** the bento is on screen (transition done) — the inner-screen texture may be refreshed */
  bentoShown: boolean;
  /** A <-> B morph progress of the bento, rounded (a change re-paints the inner-screen texture) */
  layoutKey: string;
};
export type FoldSceneHandle = { update: (state: FoldUpdate) => void; warm: () => void };

type Props = {
  contentW: number;
  contentH: number;
  /** "packaging" hand-off: CSS scale that glues the DOM bento onto the device's inner screen, and
   *  whether the DOM is still what the user sees there */
  onHandoff?: (domScale: number, domShowing: boolean) => void;
};
/** bezel fades in while the zoom-out starts; the WebGL screen replaces the DOM once the device is small */
const HANDOFF = { bezelIn: 0.12, glFrom: 0.32, glTo: 0.5 } as const;
const smoothstep = (a: number, b: number, v: number) => {
  const u = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

// Apple's iPhone Duo AR model (same asset as jadon7/iphone-duo), committed as a meshopt GLB so
// deploys have it; rebuild with `npm run assets:iphone-duo -- --force` (macOS + Windows). The
// flattened USDC that step leaves next to it (gitignored) is the local fallback (≈1.7 s parse).
const MODEL_URL = "/sites/roco-bank/iphone-duo/iPhone_Duo.glb";
const MODEL_FALLBACK_URL = "/sites/roco-bank/iphone-duo/iPhone_Duo_Render.usdc";
/** never compete with the hero intro: start after it (≈3.4 s) in idle time, or earlier on demand */
const WARM_AFTER_MS = 3600;
/** "Run security demo": one process-time unit (one checkpoint) per RUN_STEP seconds */
const RUN_STEP = 1.15;

/** soft two-tone "ting" for the approved demo result */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new Ctx();
    const now = ac.currentTime;
    [1318.5, 1975.5].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = now + i * 0.11;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g).connect(ac.destination);
      o.start(t0);
      o.stop(t0 + 1);
    });
    setTimeout(() => ac.close(), 1500);
  } catch {
    /* audio unavailable */
  }
}

/** After the bento: the page hands the live Carte bento to the inner screen of a 3D foldable (Apple's
 *  iPhone Duo AR model, fold engine from jadon7/iphone-duo), the device pops in and closes, slides
 *  left, and the cover screen runs the Carte security demo — six checkpoints and a remote overview —
 *  while the process column scrolls by. Bento, column and both screens read one demo model. */
export const FoldScene = forwardRef<FoldSceneHandle, Props>(function FoldScene({ contentW, contentH, onHandoff }, ref) {
  const handoffRef = useRef(onHandoff);
  useEffect(() => {
    handoffRef.current = onHandoff;
  }, [onHandoff]);
  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FoldEngine | null>(null);
  const walletRef = useRef<WalletScreen | null>(null);
  const stateRef = useRef<FoldUpdate>({ pull: 0, fold: 0, after: 0, processPx: 0, visible: false, bentoShown: false, layoutKey: "" });
  const sizeRef = useRef({ contentW, contentH });
  const runRef = useRef<{ start: number; from: number; chimed: boolean } | null>(null);
  /** inner-screen texture: its canvas, resolution and painter (loaded with the engine) */
  const innerRef = useRef<{ canvas: HTMLCanvasElement; res: number; paint: typeof drawInnerScreen } | null>(null);
  /** what the texture was last painted from, and whether a paint is running */
  const snapRef = useRef({ version: -1, layoutKey: "", busy: false });
  const activeRef = useRef(-2);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  /** process time from the column: active card index + progress through it (-1 before the first) */
  const processTime = useCallback((processPx: number) => {
    const col = columnRef.current;
    if (!col) return -1;
    const vh = viewportSize().h;
    const top = vh - processPx;
    col.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0)`;
    const steps = col.querySelectorAll<HTMLElement>("[data-step]");
    const line = ACTIVE_LINE * vh;
    let active = -1;
    let sub = 0;
    steps.forEach((el, i) => {
      const y = top + el.offsetTop + (el.offsetParent === col ? 0 : (el.offsetParent as HTMLElement).offsetTop);
      if (y <= line) {
        active = i;
        sub = Math.min(1, (line - y) / el.offsetHeight);
      }
    });
    // before the first card is active, keep the lock screen; then 1 unit of time per card
    return active < 0 ? -1 : active + sub;
  }, []);

  /** card states follow the effective process time (scroll, or a running demo ahead of it) */
  const applyStates = useCallback((t: number) => {
    const col = columnRef.current;
    if (!col) return;
    const active = t < 0 ? -1 : Math.min(5, Math.floor(t));
    if (active === activeRef.current) return;
    activeRef.current = active;
    col.querySelectorAll<HTMLElement>("[data-step]").forEach((el, i) => {
      el.dataset.state = i === active ? "active" : i < active ? "passed" : "upcoming";
    });
  }, []);

  /** re-paint the inner-screen texture from the live bento when the demo state or the morph changed */
  const maybeSnapshot = useCallback(() => {
    const inner = innerRef.current;
    const st = stateRef.current;
    const snap = snapRef.current;
    if (!inner || !engineRef.current || snap.busy || !st.bentoShown) return;
    const version = demoStore.get().version;
    if (version === snap.version && st.layoutKey === snap.layoutKey) return;
    const bento = document.querySelector<HTMLElement>("[data-carte-bento]");
    if (!bento) return;
    snap.busy = true;
    const target = { version, layoutKey: st.layoutKey };
    inner
      .paint(inner.canvas, inner.res, bento)
      .then(() => {
        snap.version = target.version;
        snap.layoutKey = target.layoutKey;
        engineRef.current?.refreshInner();
      })
      .catch((e) => console.warn("inner screen paint failed", e))
      .finally(() => {
        snap.busy = false;
      });
  }, []);

  const renderFrame = useCallback(() => {
    const st = stateRef.current;
    const root = rootRef.current;
    if (root) {
      root.style.setProperty("--pull", st.pull.toFixed(4));
      root.style.setProperty("--fold", st.fold.toFixed(4));
      root.style.setProperty("--after", st.after.toFixed(4));
      root.dataset.visible = st.visible ? "true" : "false";
      root.dataset.settled = st.after > 0.6 ? "true" : "false";
    }
    const tScroll = processTime(st.processPx);
    let t = tScroll;
    const run = runRef.current;
    if (run) {
      // a run keeps going without more scrolling; scrolling back above the first checkpoint (or
      // Reset demo) ends it
      if (tScroll < 0 && st.after < 1) runRef.current = null;
      else {
        const tr = Math.min(6, run.from + (performance.now() - run.start) / 1000 / RUN_STEP);
        t = Math.max(t, tr);
        const demo = demoStore.get();
        if (tr >= 4 && demo.verification === "idle") demoStore.setVerification("checking");
        if (tr >= 5 && demo.verification !== "verified") demoStore.setVerification("verified");
        if (!run.chimed && tr >= 5.25) {
          run.chimed = true;
          if (demo.decision !== "frozen" && demo.card !== "frozen") chime();
        }
      }
    }
    applyStates(t);
    if (columnRef.current) columnRef.current.dataset.paid = t >= 5.4 ? "true" : "false";
    // decorative bento loops hold still while the bento is being handed to the device
    decorGate.set(st.visible && st.pull > 0);
    maybeSnapshot();
    const engine = engineRef.current;
    const wallet = walletRef.current;
    if (engine && st.visible) {
      // the combined status icon plays in over the last 22 % of the close (cover screen just lit)
      const intro = Math.min(1, Math.max(0, (st.fold - 0.78) / 0.22));
      if (wallet && st.fold > 0.5 && wallet.draw(t, intro, demoStore.get())) engine.refreshOuter();
      const glScreen = smoothstep(HANDOFF.glFrom, HANDOFF.glTo, st.pull);
      engine.set({ pull: st.pull, fold: st.fold, after: st.after });
      engine.setInnerScreenAlpha(glScreen);
      engine.render();
      if (root) root.dataset.handoff = glScreen < 1 ? "dom" : "gl";
      handoffRef.current?.(glScreen < 1 ? engine.innerScreenScale : 1, glScreen < 1);
    } else {
      // device not loaded yet: keep the DOM bento as is
      if (root) root.dataset.handoff = "dom";
      handoffRef.current?.(1, true);
    }
  }, [processTime, applyStates, maybeSnapshot]);

  const warmRef = useRef<() => void>(() => undefined);
  useImperativeHandle(ref, () => ({
    update(state) {
      stateRef.current = state;
      renderFrame();
    },
    warm() {
      warmRef.current();
    },
  }));

  /** "Run security demo": plays the checkpoints from where the reader is (at least from the start)
   *  to the result without more scrolling or clicks; the outcome follows the demo model */
  const onRun = useCallback(() => {
    const t = processTime(stateRef.current.processPx);
    runRef.current = { start: performance.now(), from: Math.max(0, Math.min(t, 5.9)), chimed: false };
    const tick = () => {
      renderFrame();
      const r = runRef.current;
      if (r && performance.now() - r.start < (6 - r.from) * RUN_STEP * 1000 + 150) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [processTime, renderFrame]);

  const onReset = useCallback(() => {
    runRef.current = null;
    demoStore.resetAll();
  }, []);

  // demo changes made outside the scroll loop (column / bento buttons) still repaint the screens
  useEffect(() => demoStore.subscribe(() => requestAnimationFrame(() => renderFrame())), [renderFrame]);

  useEffect(() => {
    sizeRef.current = { contentW, contentH };
    const vp = viewportSize();
    engineRef.current?.resize(vp.w, vp.h, contentW, contentH);
  }, [contentW, contentH]);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    let started = false;
    let idleId = 0;
    const begin = async () => {
      if (started || cancelled) return;
      started = true;
      setStatus("loading");
      let engine: FoldEngine | null = null;
      try {
        const [{ FoldEngine }, screens] = await Promise.all([import("@/lib/roco-bank/fold/engine"), import("@/lib/roco-bank/fold/screens")]);
        const inner = document.createElement("canvas");
        const outer = document.createElement("canvas");
        const wallet = new screens.WalletScreen(outer);
        // inner texture at the device-pixel size the bento is shown at (crisp text at the hand-off);
        // DPR is 2 on Retina MacBooks, 1 / 1.25 / 1.5 on typical Windows displays. It is painted from
        // the live bento DOM once that is on screen (maybeSnapshot); until then a blank dark frame.
        const res = Math.min(2.4, Math.max(1, (sizeRef.current.contentH * Math.min(window.devicePixelRatio, 2)) / 1125));
        await Promise.all([screens.drawInnerScreen(inner, res, null), wallet.load(demoStore.get())]);
        innerRef.current = { canvas: inner, res, paint: screens.drawInnerScreen };
        if (cancelled) return;
        engine = new FoldEngine(host, inner, outer);
        const vp = viewportSize();
        engine.resize(vp.w, vp.h, sizeRef.current.contentW, sizeRef.current.contentH);
        try {
          await engine.load(MODEL_URL);
        } catch (glbError) {
          if (!(await fetch(MODEL_FALLBACK_URL, { method: "HEAD" }).then((r) => r.ok, () => false))) throw glbError;
          console.warn("iPhone_Duo.glb unavailable, loading the USDC fallback", glbError);
          await engine.load(MODEL_FALLBACK_URL);
        }
        if (cancelled) {
          engine.dispose();
          return;
        }
        engine.refreshScreens();
        // upload the textures to the GPU one per idle slice instead of in the first visible frame
        await engine.uploadTexturesIdle();
        if (cancelled) {
          engine.dispose();
          return;
        }
        engineRef.current = engine;
        walletRef.current = wallet;
        renderFrame();
        engine.render(true);
        setStatus("ready");
        document.documentElement.dataset.foldReady = "true";
      } catch (err) {
        console.error(`fold scene failed to load — missing model? run \`npm run assets:iphone-duo\``, err);
        // release the WebGL context and its canvas (the bento stays as the DOM version)
        if (engine && engineRef.current !== engine) engine.dispose();
        if (!cancelled) {
          setStatus("error");
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    warmRef.current = () => void begin();
    const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1));
    const timer = window.setTimeout(() => {
      idleId = ric(() => void begin(), { timeout: 1500 });
    }, WARM_AFTER_MS);
    const unsubscribe = subscribeViewport(() => {
      const vp = viewportSize();
      engineRef.current?.resize(vp.w, vp.h, sizeRef.current.contentW, sizeRef.current.contentH);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      unsubscribe();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [renderFrame]);

  return (
    <div ref={rootRef} className={styles.root} data-visible="false" data-status={status}>
      <div className={styles.night} />
      <div className={styles.paper} />
      <div ref={hostRef} className={styles.canvas} aria-hidden />
      <button type="button" className={styles.phoneHit} onClick={onRun} aria-label="Run the security demo on the phone" tabIndex={-1} />
      <section className={styles.process} id="security-demo" aria-label="Carte security demo">
        <ProcessColumn ref={columnRef} onRun={onRun} onReset={onReset} />
      </section>
      {status === "error" && process.env.NODE_ENV !== "production" ? (
        <p className={styles.devError} role="status">
          iPhone Duo model failed to load ({loadError}). Run <code>npm run assets:iphone-duo</code>, then reload.
        </p>
      ) : null}
    </div>
  );
});
