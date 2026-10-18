"""Extract the seven bento tile artworks (text-free, un-dimmed) from frames f150..f293.

The artwork is fixed in page space (forensics 7.6), so every frame is a direct page-space
sample.  Per frame and tile:
  * tile rect r(t) = lerp(A, B, p_group(t)) from the measured edge trajectories;
  * valid = inside r(t) (3 px AA inset, rounded corners) minus live-text glyph pixels
    (white top-hat inside the text box shifted by p(t), dilated 3 px);
  * un-dim: A = (B - d*C) / (1 - d) with the measured per-frame dim d(t) and backing C;
  * keep, per page pixel, the sample with the lowest dim (least noise amplification).
Holes (always under glyphs, or outside every rect) are filled: thin -> Telea, wide -> FSR.

Writes public/sites/roco-bank/bento/<tile>.webp (page-space crop of the union rect) and
public/sites/roco-bank/bento/art.json (crop origin/size in canvas px), plus coverage maps.
Usage: .venv-tools/bin/python -I scripts/assets/extract_bento.py FRAMES_DIR
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from bento_spec import BACKING, GROUP, RADIUS, RECT_A, RECT_B, TEXT_A, TEXT_SHIFT_B  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FR = Path(sys.argv[1])
OUT = ROOT / "public/sites/roco-bank/bento"
RES = ROOT / "docs/research/roco-bank"
OUT.mkdir(parents=True, exist_ok=True)

traj = json.load(open(ROOT / "references/reference-metrics-bento-trajectories.json"))
dims = {r["frame"]: r for r in json.load(open(ROOT / "references/reference-metrics-bento-dim.json"))}
A, B = traj["A"], traj["B"]


def progress(fr: dict) -> dict:
    pl = np.clip(((fr["credit_bottom"] - A["credit_bottom"]) / (B["credit_bottom"] - A["credit_bottom"]) +
                  (fr["trust_top"] - A["trust_top"]) / (B["trust_top"] - A["trust_top"])) / 2, 0, 1)
    pm = np.clip((fr["ai_right"] - A["ai_right"]) / (B["ai_right"] - A["ai_right"]), 0, 1)
    pb = np.clip(((fr["payment_right"] - A["payment_right"]) / (B["payment_right"] - A["payment_right"]) +
                  (fr["invested_left"] - A["invested_left"]) / (B["invested_left"] - A["invested_left"])) / 2, 0, 1)
    return {"left": float(pl), "middle": float(pm), "bottom": float(pb), None: 0.0}


def lerp_rect(k: str, p: float) -> tuple[float, float, float, float]:
    a, b = RECT_A[k], RECT_B[k]
    return tuple(a[i] + (b[i] - a[i]) * p for i in range(4))


def rect_mask(shape, r, inset=6, radius=RADIUS) -> np.ndarray:
    x, y, w, h = r
    x0, y0, x1, y1 = int(round(x + inset)), int(round(y + inset)), int(round(x + w - inset)), int(round(y + h - inset))
    m = np.zeros(shape, np.uint8)
    rr = max(radius - inset, 1)
    cv2.rectangle(m, (x0 + rr, y0), (x1 - rr, y1), 255, -1)
    cv2.rectangle(m, (x0, y0 + rr), (x1, y1 - rr), 255, -1)
    for cx, cy in [(x0 + rr, y0 + rr), (x1 - rr, y0 + rr), (x0 + rr, y1 - rr), (x1 - rr, y1 - rr)]:
        cv2.circle(m, (cx, cy), rr, 255, -1)
    return m > 0


def glyph_mask(img: np.ndarray, box: tuple[int, int, int, int], loose: bool = False) -> np.ndarray:
    x0, y0, x1, y1 = box
    g = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    top = cv2.morphologyEx(g, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    chroma = img[y0:y1, x0:x1].max(axis=2).astype(int) - img[y0:y1, x0:x1].min(axis=2)
    m = ((top > 18) & (chroma < 40)) | (g > 236)
    if loose:  # white text antialiased over saturated art (AI bank on orange)
        m |= (top > 10) & (chroma < 120)
    m = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    full = np.zeros(img.shape[:2], bool)
    full[y0:y1, x0:x1] = m
    return full


def main() -> None:
    frames = [f for f in traj["frames"] if 150 <= f["frame"] <= 293]
    shape = (1200, 1600)
    meta = {}
    for k in RECT_A:
        ax, ay, aw, ah = RECT_A[k]
        bx, by, bw, bh = RECT_B[k]
        ux0, uy0 = min(ax, bx), min(ay, by)
        ux1, uy1 = max(ax + aw, bx + bw), max(ay + ah, by + bh)
        hh, ww = uy1 - uy0, ux1 - ux0
        samples, sdims, svalid = [], [], []
        best_d = np.full((hh, ww), 9.0, np.float32)
        for fr in frames:
            n = fr["frame"]
            p = progress(fr)[GROUP[k]]
            d = float(np.clip(dims[n][k], 0, 0.6)) if n in dims else 0.0
            img = cv2.imread(str(FR / f"f{n:03d}.png"))
            valid = rect_mask(shape, lerp_rect(k, p))
            sx, sy = TEXT_SHIFT_B[k]
            for (x0, y0, x1, y1) in TEXT_A[k]:
                box = (int(x0 + sx * p), int(y0 + sy * p), int(x1 + sx * p), int(y1 + sy * p))
                valid &= ~glyph_mask(img, box, loose=(k == "ai"))
            v = valid[uy0:uy1, ux0:ux1]
            crop = img[uy0:uy1, ux0:ux1].astype(np.float32)
            und = np.clip((crop - d * BACKING[k]) / (1 - d), 0, 255).astype(np.uint8)
            samples.append(und); sdims.append(d); svalid.append(v)
            best_d = np.where(v & (d < best_d), d, best_d)
        # robust: median over samples within TOL of the least-dimmed sample for that pixel
        TOL = 0.06
        stack = np.stack(samples).astype(np.float16)
        keep = np.stack([v & (d <= best_d + TOL) for v, d in zip(svalid, sdims)])
        stack[~keep] = np.nan
        out = np.nan_to_num(np.nanmedian(stack, axis=0)).astype(np.uint8)
        del stack
        hole = best_d > 1.0
        out = cv2.inpaint(out, hole.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)
        cv2.imwrite(str(OUT / f"{k}.webp"), out, [cv2.IMWRITE_WEBP_QUALITY, 92])
        vis = out.copy()
        vis[hole] = (vis[hole] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
        dvis = (np.clip(best_d, 0, 0.6) / 0.6 * 255).astype(np.uint8)
        cv2.imwrite(str(RES / f"bento-coverage-{k}.png"), np.hstack([vis, cv2.cvtColor(dvis, cv2.COLOR_GRAY2BGR)]))
        # canvas coordinates (video - (80, 88))
        meta[k] = {"x": ux0 - 80, "y": uy0 - 88, "w": ux1 - ux0, "h": uy1 - uy0,
                   "hole_pct": round(100 * float(hole.mean()), 2),
                   "max_undim": round(float(best_d[~hole].max()) if (~hole).any() else 0, 3)}
        print(k, meta[k])
    json.dump(meta, open(OUT / "art.json", "w"), indent=1)


if __name__ == "__main__":
    main()
