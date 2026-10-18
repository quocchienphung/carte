"use client";

import { useEffect, useState } from "react";

import styles from "./replay.module.css";

/** Developer playback controls, only rendered with `?demo=1&controls=1`. */
export function ReplayControls() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const api = window.__rocoReplay;
      if (api) setT(api.time());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const api = () => window.__rocoReplay;
  return (
    <div className={styles.controls} role="group" aria-label="Replay controls">
      <button
        type="button"
        onClick={() => {
          if (playing) api()?.pause();
          else api()?.play();
          setPlaying(!playing);
        }}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={() => api()?.reset()}>
        Reset
      </button>
      <input
        aria-label="Seek"
        type="range"
        min={0}
        max={9.8}
        step={1 / 30}
        value={t}
        onChange={(e) => {
          api()?.pause();
          setPlaying(false);
          void api()?.seek(Number(e.target.value));
        }}
      />
      <output>{t.toFixed(3)} s · f{String(Math.round(t * 30)).padStart(3, "0")}</output>
    </div>
  );
}
