"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import type { FoldEngine } from "@/lib/roco-bank/fold/engine";
import type { WalletScreen } from "@/lib/roco-bank/fold/screens";
import { ACTIVE_LINE } from "@/lib/roco-bank/scroll-map";

import { ProcessColumn } from "./ProcessColumn";
import styles from "./fold.module.css";

export type FoldUpdate = { pull: number; fold: number; after: number; processPx: number; visible: boolean };
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

const MODEL_URL = "/sites/roco-bank/iphone-duo/iPhone_Duo.glb";
/** never compete with the hero intro: start after it (≈3.4 s) in idle time, or earlier on demand */
const WARM_AFTER_MS = 3600;
const PAY_DURATION = 2.6; // s, click-to-pay: Pay press → Face ID → green check

/** soft two-tone "ting" (Apple Pay–like success chime) */
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

/** After the bento: the page hands the bento to the inner screen of a 3D foldable (Apple's iPhone
 *  Duo AR model, fold engine from jadon7/iphone-duo), the device pops in and closes, slides left,
 *  and the cover screen runs the Apple Pay flow while the Plinth-style process column scrolls by. */
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
  const stateRef = useRef<FoldUpdate>({ pull: 0, fold: 0, after: 0, processPx: 0, visible: false });
  const sizeRef = useRef({ contentW, contentH });
  const payRef = useRef<{ start: number; from: number; chimed: boolean } | null>(null);
  const activeRef = useRef(-2);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  /** process time from the column: active card index + progress through it (-1 before the first) */
  const processTime = useCallback((processPx: number) => {
    const col = columnRef.current;
    if (!col) return -1;
    const vh = window.innerHeight;
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
    if (active !== activeRef.current) {
      activeRef.current = active;
      steps.forEach((el, i) => {
        el.dataset.state = i === active ? "active" : i < active ? "passed" : "upcoming";
      });
    }
    // before the first card is active, keep the lock screen; then 1 unit of time per card
    return active < 0 ? -1 : active + sub;
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
    let t = processTime(st.processPx);
    const pay = payRef.current;
    if (pay) {
      if (t < 2.5) payRef.current = null; // scrolled back above the Pay step → reset
      else {
        const k = Math.min(1, (performance.now() - pay.start) / 1000 / PAY_DURATION);
        const tp = pay.from + (6 - pay.from) * k;
        t = Math.max(t, tp);
        if (!pay.chimed && tp >= 5.25) {
          pay.chimed = true;
          chime();
        }
      }
    }
    if (columnRef.current) columnRef.current.dataset.paid = t >= 5.4 ? "true" : "false";
    const engine = engineRef.current;
    const wallet = walletRef.current;
    if (engine && st.visible) {
      // the combined status icon plays in over the last 22 % of the close (cover screen just lit)
      const intro = Math.min(1, Math.max(0, (st.fold - 0.78) / 0.22));
      if (wallet && st.fold > 0.5 && wallet.draw(t, intro)) engine.refreshOuter();
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
  }, [processTime]);

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

  const onPay = useCallback(() => {
    const t = processTime(stateRef.current.processPx);
    payRef.current = { start: performance.now(), from: Math.max(3, Math.min(t, 5.9)), chimed: false };
    // keep the play running even if the user stops scrolling
    const tick = () => {
      renderFrame();
      const p = payRef.current;
      if (p && performance.now() - p.start < PAY_DURATION * 1000 + 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [processTime, renderFrame]);

  useEffect(() => {
    sizeRef.current = { contentW, contentH };
    engineRef.current?.resize(window.innerWidth, window.innerHeight, contentW, contentH);
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
      try {
        const [{ FoldEngine }, screens] = await Promise.all([import("@/lib/roco-bank/fold/engine"), import("@/lib/roco-bank/fold/screens")]);
        const inner = document.createElement("canvas");
        const outer = document.createElement("canvas");
        const wallet = new screens.WalletScreen(outer);
        // inner texture at the device-pixel size the bento is shown at (crisp text at the hand-off)
        const res = Math.min(2.4, Math.max(1, (sizeRef.current.contentH * Math.min(window.devicePixelRatio, 2)) / 1125));
        await Promise.all([screens.drawInnerScreen(inner, res), wallet.load()]);
        if (cancelled) return;
        const engine = new FoldEngine(host, inner, outer);
        engine.resize(window.innerWidth, window.innerHeight, sizeRef.current.contentW, sizeRef.current.contentH);
        await engine.load(MODEL_URL);
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
        console.error("fold scene failed to load", err);
        if (!cancelled) setStatus("error");
      }
    };
    warmRef.current = () => void begin();
    const ric = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1));
    const timer = window.setTimeout(() => {
      idleId = ric(() => void begin(), { timeout: 1500 });
    }, WARM_AFTER_MS);
    const onResize = () => engineRef.current?.resize(window.innerWidth, window.innerHeight, sizeRef.current.contentW, sizeRef.current.contentH);
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      window.removeEventListener("resize", onResize);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [renderFrame]);

  return (
    <div ref={rootRef} className={styles.root} data-visible="false" data-status={status}>
      <div className={styles.night} />
      <div className={styles.paper} />
      <div ref={hostRef} className={styles.canvas} aria-hidden />
      <button type="button" className={styles.phoneHit} onClick={onPay} aria-label="Pay with Face ID" tabIndex={-1} />
      <section className={styles.process} id="duo" aria-label="Apple Pay process">
        <ProcessColumn ref={columnRef} onPay={onPay} />
      </section>
    </div>
  );
});
