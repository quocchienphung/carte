"""Reconstruct each hero card face from video frames (Prompt 02 asset forensics).

Card poses come from the fitted per-property motion model
(references/reference-metrics-cards.json, rms <= 0.6 px against SIFT tracks).  For every
frame f011..f106 the frame is warped into a canonical card space (440x272 card units,
rendered at SCALE x) and its *valid* region is computed: inside the frame and the card's
rounded rect, >= MARGIN px from any card above it (plus that card's down-left drop-shadow
band, plus 2x blur for the defocused orange card) and outside the header buttons.

Composition = greedy set cover (few large coherent patches instead of many thin strips):
  1. start from the static rest frame f085;
  2. repeatedly add the frame whose valid region adds the most uncovered area (>= MIN_GAIN
     px); each candidate is ECC-aligned (Euclidean) to the current composite on their
     overlap, and its new region is feather-blended across a BLEND px band;
  3. pixels never valid in any frame are filled with OpenCV xphoto FSR (texture based) and
     reported in docs/research/roco-bank/card-coverage.json + coverage PNGs (red tint).

Outputs public/sites/roco-bank/cards/<name>-face-raw.png (RGBA, rounded alpha).
Usage: .venv-tools/bin/python -I scripts/assets/composite_cards.py FRAMES_DIR
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
FR = Path(sys.argv[1])
OUT = ROOT / "public/sites/roco-bank/cards"
RES = ROOT / "docs/research/roco-bank"
OUT.mkdir(parents=True, exist_ok=True)
RES.mkdir(parents=True, exist_ok=True)

W, H = 440, 272
SCALE = 2
RADIUS = 18
MARGIN = 40
SHADOW_DX, SHADOW_DY, SHADOW_GROW = -14, 26, 21
BLEND = 14
MIN_GAIN = 1500
MAX_FRAMES = 6
ORDER = ["orange", "green", "black", "brown"]
HEADER_BOX = (1252, 128, 1472, 186)

model = json.load(open(ROOT / "references/reference-metrics-cards.json"))
early = model.get("orange_early_blur_opacity", {})


def bez(u: float, x1: float, y1: float, x2: float, y2: float) -> float:
    s = min(max(u, 0.0), 1.0)
    for _ in range(30):
        bx = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
        dbx = 3 * (1 - s) ** 2 * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s ** 2 * (1 - x2)
        s = min(max(s - (bx - u) / (dbx if abs(dbx) > 1e-6 else 1e-6), 0.0), 1.0)
    return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3


def pose(name: str, t: float) -> dict:
    p = {}
    for prop, f in model["fits"][name].items():
        u = (t - f["start"]) / f["duration"]
        p[prop] = f["to"] + (f["from"] - f["to"]) * (1 - bez(u, *f["bezier"])) if u > 0 else f["from"]
    return p


FIRST = {"orange": 19, "green": 11, "black": 20, "brown": 28}  # first sharp, tracked frame


def matrix(p: dict) -> np.ndarray:
    th = np.radians(p["rot"])
    R = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]]) * p["scale"]
    t = np.array([p["cx"], p["cy"]]) - R @ np.array([W / 2, H / 2])
    return np.hstack([R, t[:, None]]).astype(np.float32)


def rounded_mask(w: int, h: int, r: int) -> np.ndarray:
    m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(m, (0, r), (w - 1, h - r - 1), 255, -1)
    for cx, cy in [(r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)]:
        cv2.circle(m, (cx, cy), r, 255, -1)
    return m


RM = rounded_mask(W, H, RADIUS)
CW, CH = W * SCALE, H * SCALE
SINV = np.array([[1 / SCALE, 0, 0], [0, 1 / SCALE, 0], [0, 0, 1]], np.float32)
FACE = rounded_mask(CW, CH, RADIUS * SCALE) > 0


def candidate(name: str, ci: int, n: int, shadow: bool = True) -> tuple[np.ndarray, np.ndarray, np.ndarray] | None:
    t = n / 30
    img = cv2.imread(str(FR / f"f{n:03d}.png"))
    fh, fw = img.shape[:2]
    occ = np.zeros((fh, fw), np.uint8)
    for above in ORDER[:ci]:
        m = cv2.warpAffine(RM, matrix(pose(above, t)), (fw, fh), flags=cv2.INTER_NEAREST)
        blur = early.get(str(n), {}).get("blur", 0.0) if above == "orange" else 0.0
        if blur > 0:
            m = cv2.dilate(m, np.ones((int(4 * blur) * 2 + 1,) * 2, np.uint8))
        occ |= m
        if shadow:
            sh = cv2.warpAffine(m, np.float32([[1, 0, SHADOW_DX], [0, 1, SHADOW_DY]]), (fw, fh))
            occ |= cv2.dilate(sh, np.ones((SHADOW_GROW, SHADOW_GROW), np.uint8))
    x0, y0, x1, y1 = HEADER_BOX
    occ[y0:y1, x0:x1] = 255
    free = (occ == 0).astype(np.uint8)
    free[:2, :] = 0; free[-2:, :] = 0; free[:, :2] = 0; free[:, -2:] = 0
    dist = cv2.distanceTransform(free, cv2.DIST_L2, 5)
    Mc = (np.vstack([matrix(pose(name, t)), [0, 0, 1]]) @ SINV)[:2]
    Minv = cv2.invertAffineTransform(Mc)
    return img, dist, Minv


def warp_valid(img, dist, Minv):
    warped = cv2.warpAffine(img, Minv, (CW, CH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    dwarp = cv2.warpAffine(dist, Minv, (CW, CH), flags=cv2.INTER_LINEAR, borderValue=0)
    return warped.astype(np.float32), (dwarp >= MARGIN) & FACE


def ecc_refine(ref: np.ndarray, cur_img, dist, Minv, mask: np.ndarray):
    if mask.sum() < 3000:
        return Minv
    warped, _ = warp_valid(cur_img, dist, Minv)
    rg = cv2.cvtColor(ref.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    cg = cv2.cvtColor(warped.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(rg, cg, warp, cv2.MOTION_EUCLIDEAN,
                                       (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 80, 1e-6),
                                       mask.astype(np.uint8), 5)
    except cv2.error:
        return Minv
    if np.hypot(warp[0, 2], warp[1, 2]) > 10:
        return Minv
    # warped(x) = img(Minv^-1 x); we want img(Minv^-1 (warp x))  -> new forward map = Minv^-1 o warp
    fwd = np.vstack([cv2.invertAffineTransform(Minv), [0, 0, 1]]) @ np.vstack([warp, [0, 0, 1]])
    return cv2.invertAffineTransform(fwd[:2].astype(np.float32))


def main() -> None:
    report = {}
    for ci, name in enumerate(ORDER):
        rest = candidate(name, ci, 85)
        comp, valid = warp_valid(*rest)
        covered = valid.copy()
        picks = [85]
        pool = [n for n in range(FIRST[name], 107) if n != 85]
        cache = {}
        for _ in range(MAX_FRAMES):
            best = (0, None)
            for n in pool:
                if n not in cache:
                    cache[n] = candidate(name, ci, n)
                _, v = warp_valid(*cache[n])
                gain = int((v & ~covered).sum())
                if gain > best[0]:
                    best = (gain, n)
            if best[1] is None or best[0] < MIN_GAIN:
                break
            n = best[1]
            img, dist, Minv = cache[n]
            _, v0 = warp_valid(img, dist, Minv)
            Minv = ecc_refine(comp, img, dist, Minv, v0 & covered)
            warped, v = warp_valid(img, dist, Minv)
            new = v & ~covered
            # photometric match: per-channel linear fit warped->comp on the overlap (shadow/fade/exposure)
            ov = v & covered
            if ov.sum() > 2000:
                for c in range(3):
                    g, o = np.polyfit(warped[..., c][ov], comp[..., c][ov], 1)
                    if 0.6 < g < 1.6:
                        warped[..., c] = warped[..., c] * g + o
            # feather the seam: inside the overlap band blend towards the new frame
            dcov = cv2.distanceTransform(covered.astype(np.uint8), cv2.DIST_L2, 5)
            band = ov & (dcov < BLEND)
            a_band = 0.5 * (1 - np.clip(dcov / BLEND, 0, 1))
            comp[new] = warped[new]
            comp[band] = comp[band] * (1 - a_band[band, None]) + warped[band] * a_band[band, None]
            covered |= new
            picks.append(n)
            pool.remove(n)
        # ---- tier 2: rest-frame pixels near occluders (baked shadow divided out) ----
        img_r, dist_r, Minv_r = candidate(name, ci, 85, shadow=False)
        rest_w = cv2.warpAffine(img_r, Minv_r, (CW, CH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
        d_r = cv2.warpAffine(dist_r, Minv_r, (CW, CH), flags=cv2.INTER_LINEAR, borderValue=0)  # video px from occluder
        k2 = (d_r >= 2.5) & FACE
        band2 = k2 & ~covered
        atten = {}
        if band2.any():
            ov = covered & k2 & (d_r < 70)
            lr = rest_w.mean(axis=2); lc = comp.mean(axis=2)
            bins = np.arange(2, 72, 4)
            ratio = np.ones_like(bins, dtype=np.float64)
            for i, b0 in enumerate(bins):
                sel = ov & (d_r >= b0) & (d_r < b0 + 4) & (lr > 12)
                if sel.sum() > 80:
                    ratio[i] = float(np.median(lc[sel] / lr[sel]))
            ratio = np.clip(ratio, 1.0, 2.5)
            atten = {int(b): round(float(r), 3) for b, r in zip(bins, ratio)}
            corr = np.interp(d_r, bins + 2, ratio)
            comp[band2] = np.clip(rest_w[band2] * corr[band2, None], 0, 255)
            covered |= band2
        missing = FACE & ~covered
        pct = 100.0 * missing.sum() / FACE.sum()
        out = np.clip(comp, 0, 255).astype(np.uint8)
        out[~covered] = 0
        if missing.any():
            filled = np.zeros_like(out)
            cv2.xphoto.inpaint(out, covered.astype(np.uint8), filled, cv2.xphoto.INPAINT_FSR_FAST)
            out = np.where(missing[..., None], filled, out)
        alpha = FACE.astype(np.uint8) * 255
        cv2.imwrite(str(RES / "raw" / f"{name}-face-raw.png"), np.dstack([out, alpha]))
        vis = out.copy()
        vis[missing] = (vis[missing] * 0.4 + np.array([0, 0, 255]) * 0.6).astype(np.uint8)
        cv2.imwrite(str(RES / f"card-coverage-{name}.png"), vis)
        report[name] = {"source_frames": picks, "never_visible_pct": round(pct, 2), "fill": "xphoto FSR_FAST",
                        "rest_shadow_compensation_by_distance_px": atten}
        print(f"{name}: frames {picks}  never-visible {pct:.2f}%  shadow gain by dist {atten}")
    json.dump(report, open(RES / "card-coverage.json", "w"), indent=1)


if __name__ == "__main__":
    main()
