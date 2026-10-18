"""Per-frame trajectories of the moving bento edges (frames 150..293).

Probes (video px):
  credit_bottom   : col 450, end of first run starting near y=240
  trust_top       : col 450, start of the next run
  ai_right        : row 700, end of the run starting near x=556
  easy_left       : row 700, start of the following run
  payment_right   : row 1000, end of the run starting near x=558
  invested_left   : row 1000, start of following run

Progress p = (v - vA) / (vB - vA) using resting A (f160) and B (f205).
Usage: bento_trajectories.py FRAMES_DIR OUT_JSON
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

FPS = 30


def runs(line: np.ndarray, offset: int, th: int = 9) -> list[tuple[int, int]]:
    lo, hi = line.min(axis=1), line.max(axis=1)
    bg = (lo >= 17 - th) & (hi <= 17 + th) & ((hi - lo) <= 4)
    out, start = [], None
    for i, v in enumerate(list(~bg) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= 4:
                out.append((offset + start, offset + i - 1))
            start = None
    return out


def gap_after(rs: list[tuple[int, int]], first_start_near: int, min_gap: int = 14) -> tuple[int, int]:
    """Return (end of tile run that starts near X, start of next tile after a >=min_gap bg gap)."""
    i = next(k for k, r in enumerate(rs) if abs(r[0] - first_start_near) <= 6)
    end = rs[i][1]
    for r in rs[i + 1 :]:
        if r[0] - end >= min_gap:
            return end, r[0]
        end = r[1]
    return end, -1


def main() -> None:
    frames_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    data = []
    for n in range(150, 294):
        im = np.asarray(Image.open(frames_dir / f"f{n:03d}.png").convert("RGB")).astype(int)
        col450 = runs(im[200:1080, 450], 200)
        row700 = runs(im[700, 100:1500], 100)
        row1000 = runs(im[1000, 100:1500], 100)
        cb, tt = gap_after(col450, 240)
        ar, el = gap_after(row700, 556)
        pr, il = gap_after(row1000, 558)
        data.append({"frame": n, "t": round(n / FPS, 4), "credit_bottom": cb, "trust_top": tt,
                     "ai_right": ar, "easy_left": el, "payment_right": pr, "invested_left": il})
    a = next(d for d in data if d["frame"] == 160)
    b = next(d for d in data if d["frame"] == 205)
    keys = ["credit_bottom", "trust_top", "ai_right", "easy_left", "payment_right", "invested_left"]
    for d in data:
        d["p"] = {k: round((d[k] - a[k]) / (b[k] - a[k]), 3) for k in keys}
    out.write_text(json.dumps({"A": a, "B": b, "frames": data}, indent=1))
    print("A", {k: a[k] for k in keys})
    print("B", {k: b[k] for k in keys})
    for d in data:
        print(f"f{d['frame']:03d} t={d['t']:.3f} " + " ".join(f"{k}={d[k]:4d}({d['p'][k]:+.2f})" for k in keys))


if __name__ == "__main__":
    main()
