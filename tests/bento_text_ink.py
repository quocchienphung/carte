"""Bento text calibration: text ink = brightness above the extracted (text-free) tile artwork.

ink(img) = Σ max(0, img − art) over the line's box; ink boxes = pixels > art + 40.
Reports width/position deltas and ink ratios (weight proxy) app vs reference, state A.
Usage: .venv-tools/bin/python -I tests/bento_text_ink.py REF.png APP.png
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts/assets"))
from bento_spec import TEXT_A  # noqa: E402

LINES = {  # stage px boxes per text line (state A)
    "credit_0": (222, 306, 362, 350), "credit_1": (222, 354, 362, 400),
    "customers_0": (600, 288, 740, 312), "customers_1": (600, 406, 752, 460), "customers_2": (600, 466, 980, 506),
    "trust_0": (218, 536, 340, 560), "trust_1": (218, 576, 392, 616), "trust_2": (218, 616, 340, 650),
    "ai_0": (660, 640, 815, 683), "easy_0": (984, 638, 1150, 692),
    "payment_0": (600, 812, 770, 834), "payment_1": (600, 890, 800, 952), "payment_2": (598, 952, 902, 988),
    "invested_0": (1104, 798, 1262, 842), "invested_1": (1104, 842, 1230, 892),
}


def art_canvas() -> np.ndarray:
    meta = json.load(open(ROOT / "public/sites/roco-bank/bento/art.json"))
    out = np.full((1200, 1600, 3), 17, np.float32)
    for k, m in meta.items():
        img = cv2.imread(str(ROOT / f"public/sites/roco-bank/bento/{k}.webp")).astype(np.float32)
        x, y = m["x"] + 80, m["y"] + 88
        out[y:y + m["h"], x:x + m["w"]] = img
    return out


def main() -> None:
    ref = cv2.imread(sys.argv[1]).astype(np.float32)
    app = cv2.imread(sys.argv[2]).astype(np.float32)
    art = art_canvas()
    print(f"{'line':12s} {'ref x0..x1 (w)':>18s} {'app x0..x1 (w)':>18s}  dx0  dw   ink app/ref")
    for k, (x0, y0, x1, y1) in LINES.items():
        a = art[y0:y1, x0:x1].mean(axis=2)
        r = np.maximum(0, ref[y0:y1, x0:x1].mean(axis=2) - a)
        p = np.maximum(0, app[y0:y1, x0:x1].mean(axis=2) - a)

        def box(m):
            ys, xs = np.where(m > 40)
            return (int(xs.min() + x0), int(xs.max() + x0)) if len(xs) else None

        br, bp = box(r), box(p)
        ratio = p.sum() / max(r.sum(), 1)
        if br and bp:
            print(f"{k:12s} {br[0]:5d}..{br[1]:5d} ({br[1] - br[0]:3d}) {bp[0]:5d}..{bp[1]:5d} ({bp[1] - bp[0]:3d})"
                  f"  {bp[0] - br[0]:+3d} {(bp[1] - bp[0]) - (br[1] - br[0]):+4d}   {ratio:.3f}")
        else:
            print(f"{k:12s} {br} {bp}  ink {ratio:.3f}")


if __name__ == "__main__":
    main()
