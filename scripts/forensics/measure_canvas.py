"""Measure the inset web-canvas rectangle and per-region motion energy per frame.

Canvas detection: the stage mat is pale gray (~#efefef..#e0e0e0, vertical gradient);
the hero canvas is pure white (>= 252) and the bento canvas near-black (<= 30).
We scan a horizontal line and a vertical line for the longest run of
"canvas-coloured" pixels.  Output: references/reference-metrics-canvas.json

Usage: .venv-tools/bin/python -I scripts/forensics/measure_canvas.py FRAMES_DIR OUT_JSON
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

FPS = 30


def longest_run(mask: np.ndarray) -> tuple[int, int]:
    best = (0, -1)
    start = None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start > best[1] - best[0] + 1:
                best = (start, i - 1)
            start = None
    return best


def measure(gray: np.ndarray, kind: str, row: int, col: int) -> dict:
    if kind == "white":
        line_h = gray[row, :] >= 251
        line_v = gray[:, col] >= 251
    else:
        line_h = gray[row, :] <= 28
        line_v = gray[:, col] <= 28
    x0, x1 = longest_run(line_h)
    y0, y1 = longest_run(line_v)
    return {"x": int(x0), "y": int(y0), "w": int(x1 - x0 + 1), "h": int(y1 - y0 + 1)}


def main() -> None:
    frames = sorted(Path(sys.argv[1]).glob("f*.png"))
    out = Path(sys.argv[2])
    prev = None
    rows = []
    regions = {
        "header": (0, 0, 1600, 230),
        "hero_copy": (100, 420, 760, 520),
        "cards": (520, 0, 900, 780),
        "pills": (960, 840, 520, 240),
        "logos": (60, 980, 900, 70),
        "bottom": (0, 1050, 1600, 150),
    }
    for f in frames:
        n = int(f.stem[1:])
        im = np.asarray(Image.open(f).convert("L"), dtype=np.int16)
        # decide which canvas type dominates the center column
        center = im[300:1000, 60]
        kind = "white" if np.mean(center >= 251) > 0.4 else "dark"
        # Header row is mostly free of artwork; use row 260 and column 100 (left margin)
        rect_w = measure(im, "white", 260, 110)
        rect_d = measure(im, "dark", 1100, 110)
        motion = {}
        if prev is not None:
            d = np.abs(im - prev)
            for k, (x, y, w, h) in regions.items():
                motion[k] = round(float(d[y : y + h, x : x + w].mean()), 3)
            motion["all"] = round(float(d.mean()), 3)
        rows.append({"frame": n, "t": round(n / FPS, 4), "white": rect_w, "dark": rect_d, "motion": motion})
        prev = im
    out.write_text(json.dumps(rows, indent=1))
    for r in rows:
        w, d, m = r["white"], r["dark"], r["motion"]
        print(
            f"f{r['frame']:03d} t={r['t']:.3f} white x={w['x']:4d} y={w['y']:4d} w={w['w']:4d} h={w['h']:4d} | "
            f"dark x={d['x']:4d} y={d['y']:4d} w={d['w']:4d} h={d['h']:4d} | "
            + " ".join(f"{k}={v:5.2f}" for k, v in m.items())
        )


if __name__ == "__main__":
    main()
