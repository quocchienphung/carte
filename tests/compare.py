"""Reference-vs-app visual comparison (Prompt 06). Whole frames are compared — nothing is masked.

For every app screenshot `app_t<T>_f<N>.png` in RUN_DIR it pairs references/keyframes frame N
(extracting it with ffmpeg if missing) and writes into RUN_DIR/compare/:
  <N>_side.png     reference | app
  <N>_overlay.png  50/50 alpha blend
  <N>_diff.png     |ref − app| × 2 (difference-enhanced)
  <N>_edges.png    edge maps (ref red, app cyan)
and RUN_DIR/scores.json with whole-frame and region SSIM / mean-abs-diff / edge-F1 per frame.

Usage: .venv-tools/bin/python -I tests/compare.py RUN_DIR
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

ROOT = Path(__file__).resolve().parents[1]
KEY = ROOT / "references/keyframes"
VIDEO = ROOT / "references/roco-bank-reference.mp4"

# regions in stage px (x, y, w, h) — hero and bento layouts
REGIONS_HERO = {
    "header": (80, 110, 1440, 90),
    "hero_copy": (160, 430, 660, 420),
    "ctas": (160, 860, 320, 60),
    "cards": (520, 20, 900, 760),
    "pills": (960, 840, 520, 230),
    "logos": (80, 980, 860, 70),
    "deco": (1330, 88, 190, 1024),
}
REGIONS_BENTO = {
    "header": (80, 110, 1440, 90),
    "credit": (176, 240, 358, 424),
    "trust": (176, 488, 358, 544),
    "customers": (558, 240, 866, 312),
    "ai": (558, 576, 458, 168),
    "easy": (940, 576, 484, 168),
    "payment": (558, 766, 484, 266),
    "invested": (916, 766, 508, 266),
}


def ref_frame(n: int) -> np.ndarray:
    hits = list(KEY.glob(f"ref_t*_f{n:03d}.png"))
    if not hits:
        out = KEY / f"ref_t{n / 30:.3f}_f{n:03d}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(VIDEO), "-vf", f"select='eq(n\\,{n})'", "-fps_mode",
                        "passthrough", "-frames:v", "1", str(out)], check=True)
        hits = [out]
    return cv2.imread(str(hits[0]))


def edge_f1(a: np.ndarray, b: np.ndarray, tol: int = 2) -> float:
    ea = cv2.Canny(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), 60, 140) > 0
    eb = cv2.Canny(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), 60, 140) > 0
    if ea.sum() == 0 and eb.sum() == 0:
        return 1.0
    k = np.ones((2 * tol + 1, 2 * tol + 1), np.uint8)
    da, db = cv2.dilate(ea.astype(np.uint8), k) > 0, cv2.dilate(eb.astype(np.uint8), k) > 0
    precision = (eb & da).sum() / max(eb.sum(), 1)
    recall = (ea & db).sum() / max(ea.sum(), 1)
    return float(2 * precision * recall / max(precision + recall, 1e-9))


def scores(a: np.ndarray, b: np.ndarray) -> dict:
    ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    return {
        "ssim": round(float(ssim(ga, gb, data_range=255)), 4),
        "mad": round(float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean()), 2),
        "edge_f1": round(edge_f1(a, b), 4),
    }


def main() -> None:
    run = Path(sys.argv[1])
    out = run / "compare"
    out.mkdir(parents=True, exist_ok=True)
    report = []
    for f in sorted(run.glob("app_t*_f*.png")):
        n = int(re.search(r"_f(\d+)\.png", f.name).group(1))
        app = cv2.imread(str(f))
        ref = ref_frame(n)
        if app.shape != ref.shape:
            app = cv2.resize(app, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(out / f"{n:03d}_side.png"), np.hstack([ref, app]))
        cv2.imwrite(str(out / f"{n:03d}_overlay.png"), cv2.addWeighted(ref, 0.5, app, 0.5, 0))
        diff = np.clip(np.abs(ref.astype(np.int16) - app.astype(np.int16)) * 2, 0, 255).astype(np.uint8)
        cv2.imwrite(str(out / f"{n:03d}_diff.png"), diff)
        ea = cv2.Canny(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), 60, 140)
        eb = cv2.Canny(cv2.cvtColor(app, cv2.COLOR_BGR2GRAY), 60, 140)
        edges = np.zeros_like(ref)
        edges[..., 2] = ea
        edges[..., 0] = eb
        edges[..., 1] = eb
        cv2.imwrite(str(out / f"{n:03d}_edges.png"), edges)
        regions = REGIONS_BENTO if n >= 150 else REGIONS_HERO
        reg = {k: scores(ref[y:y + h, x:x + w], app[y:y + h, x:x + w]) for k, (x, y, w, h) in regions.items()}
        row = {"frame": n, "t": round(n / 30, 3), "whole": scores(ref, app), "regions": reg}
        report.append(row)
        w = row["whole"]
        worst = sorted(reg.items(), key=lambda kv: kv[1]["ssim"])[:3]
        print(f"f{n:03d} t={n / 30:5.2f}  SSIM {w['ssim']:.4f}  MAD {w['mad']:5.2f}  edgeF1 {w['edge_f1']:.3f}  "
              f"worst: " + ", ".join(f"{k} {v['ssim']:.3f}" for k, v in worst))
    json.dump(report, open(run / "scores.json", "w"), indent=1)


if __name__ == "__main__":
    main()
