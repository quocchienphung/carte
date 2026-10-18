"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { MorphGroup, TileId } from "@/lib/roco-bank/geometry";
import { StyleApplier } from "@/lib/roco-bank/motion/applier";
import { groupProgressInteractive } from "@/lib/roco-bank/motion/bento";
import { evaluate, REPLAY_DURATION } from "@/lib/roco-bank/motion/timeline";

import { anchors, mapScroll, scrollLength, SEG, type AnchorId } from "@/lib/roco-bank/scroll-map";
import { subscribeViewport, viewportSize } from "@/lib/roco-bank/viewport";

import { BentoScene } from "./bento/BentoScene";
import { FoldScene, type FoldSceneHandle } from "./fold/FoldScene";
import { HeroCards } from "./hero/HeroCards";
import { HeroScene } from "./hero/HeroScene";
import { AnimProvider } from "./motion-context";
import { MorphNav } from "./navigation/MorphNav";
import { SiteHeader } from "./navigation/SiteHeader";
import { ReplayControls } from "./replay/ReplayControls";
import { ResponsiveSite } from "./responsive/ResponsiveSite";
import { frameFor, FullscreenStage } from "./stage/FullscreenStage";
import { ReferenceStage } from "./stage/ReferenceStage";
import { SceneTransition } from "./transition/SceneTransition";
import stageStyles from "./stage/stage.module.css";
import styles from "./experience.module.css";

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
];

export type ReplayApi = {
  seek: (t: number) => Promise<void>;
  play: () => void;
  pause: () => void;
  reset: () => void;
  time: () => number;
  duration: number;
  ready: Promise<void>;
};

declare global {
  interface Window {
    __rocoReplay?: ReplayApi;
  }
}

type Mode = { kind: "replay"; t: number | null; controls: boolean; loop: boolean } | { kind: "interactive" };

let cachedMode: Mode | null = null;
function readMode(): Mode {
  if (cachedMode) return cachedMode;
  const q = new URLSearchParams(window.location.search);
  if (q.get("demo") === "1" || q.has("t")) {
    const t = q.has("t") ? Number(q.get("t")) : null;
    cachedMode = { kind: "replay", t: t !== null && Number.isFinite(t) ? t : null, controls: q.get("controls") === "1", loop: q.get("loop") !== "0" };
  } else {
    cachedMode = { kind: "interactive" };
  }
  return cachedMode;
}
const noSubscribe = () => () => undefined;

/** stage scale that fits 1600×1200 into the viewport (exactly 1 at the reference capture) */
function useStageScale() {
  return useSyncExternalStore(
    subscribeViewport,
    () => {
      const vp = viewportSize();
      return Math.min(vp.w / 1600, vp.h / 1200);
    },
    () => 1,
  );
}

/** viewport size (scrollbars excluded, see viewport.ts) as a stable string snapshot ("w×h") */
function useViewportKey() {
  return useSyncExternalStore(
    subscribeViewport,
    () => {
      const vp = viewportSize();
      return `${vp.w}x${vp.h}`;
    },
    () => "1440x1024",
  );
}

function useWideEnough() {
  const mq = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(mq);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(mq).matches,
    () => true,
  );
}

async function assetsReady() {
  await document.fonts.ready;
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("[data-roco-stage] img"));
  await Promise.all(imgs.map((i) => (i.complete && i.naturalWidth ? i.decode().catch(() => undefined) : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))));
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function RocoBankExperience() {
  const applier = useMemo(() => new StyleApplier(), []);
  const mode = useSyncExternalStore<Mode | null>(noSubscribe, readMode, () => null);
  const scale = useStageScale();
  const wide = useWideEnough();
  const vpKey = useViewportKey();
  const frame = useMemo(() => {
    const [w, h] = vpKey.split("x").map(Number);
    return frameFor(w, h);
  }, [vpKey]);
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const morph = useRef<{ towardsB: boolean; start: number; from: Record<MorphGroup, number> } | null>(null);
  const morphNow = useRef<Record<MorphGroup, number>>({ bottom: 0, middle: 0, left: 0 });
  const handingOff = useRef(false);
  const foldRef = useRef<FoldSceneHandle>(null);
  const handoffWrapRef = useRef<HTMLDivElement>(null);
  const lastHandoff = useRef<{ element: HTMLDivElement; key: string } | null>(null);
  /** "packaging": keeps the DOM bento glued to the device's inner screen while it shrinks */
  const onHandoff = useCallback((domScale: number, domShowing: boolean) => {
    const el = handoffWrapRef.current;
    if (!el) return;
    // Use the rendered precision for both the cache and the phase. A scale such as
    // 0.99999999 renders as 1 but used to leave the black handoff background behind:
    // the subsequent reset to exactly 1 had the same cache key and was skipped.
    const scale = Number(domScale.toFixed(5));
    const key = `${scale}|${domShowing}`;
    if (lastHandoff.current?.element === el && lastHandoff.current.key === key) return;
    // A responsive remount or Fast Refresh can replace the node while retaining this ref.
    lastHandoff.current = { element: el, key };
    el.style.transform = scale === 1 ? "" : `scale(${scale})`;
    // the area the scaled stage no longer covers must stay bento-black (no visible frame edge)
    if (el.parentElement) el.parentElement.style.background = scale === 1 ? "" : "#111111";
    el.style.visibility = domShowing ? "" : "hidden"; // covered by the night layer + WebGL screen
    el.dataset.handoff = scale === 1 ? "" : "dom";
  }, []);

  // ------------------------------------------------------------------ replay mode
  useEffect(() => {
    if (!mode || mode.kind !== "replay") return;
    let t = mode.t ?? 0;
    let playing = mode.t === null;
    let raf = 0;
    let last = performance.now();
    const render = (time: number) => applier.apply(evaluate({ t: time }));
    const tick = (now: number) => {
      if (playing) {
        t += (now - last) / 1000;
        if (t >= REPLAY_DURATION) t = mode.loop ? t % REPLAY_DURATION : REPLAY_DURATION;
        render(t);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((r) => (resolveReady = r));
    const api: ReplayApi = {
      duration: REPLAY_DURATION,
      ready,
      time: () => t,
      seek: async (s) => {
        t = Math.max(0, Math.min(REPLAY_DURATION, s));
        render(t);
        await nextFrame();
      },
      play: () => {
        playing = true;
        last = performance.now();
      },
      pause: () => {
        playing = false;
      },
      reset: () => {
        t = 0;
        render(0);
      },
    };
    window.__rocoReplay = api;
    render(t);
    (async () => {
      await assetsReady();
      render(t);
      await nextFrame();
      document.documentElement.dataset.replayReady = "true";
      resolveReady();
      last = performance.now();
      raf = requestAnimationFrame(tick);
    })();
    return () => {
      cancelAnimationFrame(raf);
      delete window.__rocoReplay;
    };
  }, [mode, applier]);

  // ------------------------------------------------------------------ interactive desktop mode
  useEffect(() => {
    if (!mode || mode.kind !== "interactive" || !wide) return;
    let raf = 0;
    let last = performance.now();
    let smoothY = window.scrollY;
    // intro clock: held on the first intro frame until fonts + every hero image are decoded, then
    // advanced by real frame time with each step capped at 1/30 s — a dropped frame can slow the
    // intro for an instant but never makes it jump ahead
    let introReady = false;
    let clock = 2 / 30;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (introReady) clock += Math.min(dt, 1 / 30);
      // critically damped follow of the native scroll position → buttery scrubbing on wheels/trackpads
      const y = window.scrollY;
      smoothY += (y - smoothY) * (1 - Math.exp(-dt * 9));
      if (Math.abs(y - smoothY) < 0.25) smoothY = y;
      const sm = mapScroll(smoothY);
      if (smoothY > 300) foldRef.current?.warm(); // user is heading down: load the device now
      const m = morph.current;
      if (m) {
        const tau = (now - m.start) / 1000;
        (["bottom", "middle", "left"] as MorphGroup[]).forEach((g) => {
          morphNow.current[g] = groupProgressInteractive(g, tau, m.towardsB, m.from[g]);
        });
      }
      applier.apply(
        evaluate({
          t: 99,
          heroT: Math.min(clock, 3.4),
          scrollT: sm.scrollT,
          marqueeT: clock,
          morph: { ...morphNow.current },
          frameH: frameRef.current.h,
        }),
      );
      // while the bento is handed to the device the A/B morph holds where it is (hover ignored), so
      // the DOM and the device texture show the same layout
      handingOff.current = sm.pull > 0;
      const mn = morphNow.current;
      foldRef.current?.update({
        pull: sm.pull,
        fold: sm.fold,
        after: sm.after,
        processPx: sm.processPx,
        visible: sm.foldVisible,
        bentoShown: smoothY >= SEG.TRANSITION - 2,
        layoutKey: `${mn.bottom.toFixed(2)}|${mn.middle.toFixed(2)}|${mn.left.toFixed(2)}`,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    assetsReady()
      .then(nextFrame)
      .then(() => {
        introReady = true;
        document.documentElement.dataset.replayReady = "true";
      });
    return () => cancelAnimationFrame(raf);
  }, [mode, wide, applier]);

  /** inferred interaction (not in the film): hovering / focusing the Customers tile shows layout B */
  const onTileFocus = useCallback((id: TileId, focused: boolean) => {
    if (id !== "customers" || handingOff.current) return;
    const cur = morph.current;
    if (cur && cur.towardsB === focused) return;
    morph.current = { towardsB: focused, start: performance.now(), from: { ...morphNow.current } };
  }, []);

  const scrollToFeatures = useCallback(() => {
    window.scrollTo({ top: anchors(viewportSize().h).explore, behavior: "smooth" });
  }, []);
  const navItems = useMemo(
    () =>
      (["home", "explore", "about", "contact"] as AnchorId[]).map((id) => ({
        id,
        label: id[0].toUpperCase() + id.slice(1),
        onSelect: () => window.scrollTo({ top: anchors(viewportSize().h)[id], behavior: "smooth" }),
      })),
    [],
  );

  if (!mode) return <div className={styles.boot} aria-busy="true" />;

  if (mode.kind === "interactive" && !wide) return <ResponsiveSite />;

  const interactive = mode.kind === "interactive";
  const canvas = (
    <>
      <HeroScene onNext={interactive ? scrollToFeatures : undefined} />
      <SceneTransition>
        <BentoScene onTileFocus={interactive ? onTileFocus : undefined} />
      </SceneTransition>
    </>
  );
  const header = (
    <>
      <SiteHeader theme="light" />
      <SiteHeader theme="dark" decorative />
    </>
  );
  const stage = (
    <AnimProvider applier={applier}>
      <div data-roco-stage className={interactive ? styles.stickyStage : styles.replayRoot}>
        {interactive ? (
          // the website: full-bleed frame, no presentation mat
          <>
            <div ref={handoffWrapRef} className={styles.handoffWrap}>
              <FullscreenStage frame={frame} canvas={canvas} cards={<HeroCards />} header={header} />
            </div>
            <FoldScene ref={foldRef} contentW={1440 * frame.scale} contentH={1024 * frame.scale} onHandoff={onHandoff} />
          </>
        ) : (
          // reference capture: 1600×1200 presentation stage, 1:1 with the video for visual tests
          <ReferenceStage
            scale={scale}
            canvas={canvas}
            overlay={
              <>
                <HeroCards />
                <div className={stageStyles.headerLayer}>{header}</div>
              </>
            }
          />
        )}
      </div>
      {mode.kind === "replay" && mode.controls ? <ReplayControls /> : null}
    </AnimProvider>
  );

  if (mode.kind === "replay") return stage;
  return (
    <div ref={scrollRef} className={styles.scrollTrack} style={{ height: `calc(100vh + ${scrollLength(frame.h * frame.scale)}px)` }}>
      {stage}
      <MorphNav items={navItems} socials={SOCIALS} />
    </div>
  );
}
