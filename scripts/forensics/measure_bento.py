"""Measure bento tile rectangles per frame (video pixels) via connected components.

Background (#111 dark canvas and its soft tile shadows) = all channels in [8, 22] with
low chroma.  Everything else inside the dark canvas is tile content.  Components are
labelled and the 7 largest are matched to tile ids by their centre in the resting layout.

Usage: .venv-tools/bin/python -I scripts/forensics/measure_bento.py FRAMES_DIR OUT_JSON [first last]
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

FPS = 30
# resting layout A centres (from f160) used only to name components
NAMES = {
    "credit": (354, 351),
    "trust": (354, 760),
    "customers": (991, 396),
    "ai": (736, 660),
    "easy": (1181, 660),
    "payment": (800, 899),
    "invested": (1245, 899),
}


def tiles_in(img: np.ndarray, top: int) -> list[dict]:
    sub = img[top:1112, 80:1520].astype(np.int16)
    lo, hi = sub.min(axis=2), sub.max(axis=2)
    bg = (lo >= 8) & (hi <= 22) & ((hi - lo) <= 4)
    mask = (~bg).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, 8)
    out = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if a < 4000 or w < 60 or h < 60:
            continue
        out.append({"x": int(x + 80), "y": int(y + top), "w": int(w), "h": int(h), "area": int(a),
                    "fill": round(a / (w * h), 3)})
    return out


def name_tiles(found: list[dict]) -> dict:
    named = {}
    for name, (cx, cy) in NAMES.items():
        best = None
        for t in found:
            if t["x"] <= cx <= t["x"] + t["w"] and t["y"] <= cy <= t["y"] + t["h"]:
                if best is None or t["area"] < best["area"]:
                    best = t
        if best is not None:
            named[name] = best
    return named


def main() -> None:
    frames_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    first = int(sys.argv[3]) if len(sys.argv) > 3 else 150
    last = int(sys.argv[4]) if len(sys.argv) > 4 else 293
    rows = []
    for n in range(first, last + 1):
        img = cv2.imread(str(frames_dir / f"f{n:03d}.png"))[:, :, ::-1]
        found = tiles_in(img, 200)
        named = name_tiles(found)
        rows.append({"frame": n, "t": round(n / FPS, 4), "tiles": named, "raw": found})
        print(f"f{n:03d} t={n / FPS:.3f} " + " ".join(
            f"{k}=({v['x']},{v['y']},{v['w']},{v['h']})" for k, v in named.items()))
    out.write_text(json.dumps(rows, indent=1))


if __name__ == "__main__":
    main()
