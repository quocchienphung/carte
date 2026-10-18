"""Score candidate font renders against reference glyph crops (f085, 1:1 px).

Both images -> ink maps (1 - luminance), tight ink bbox, aligned at left edge + baseline
(bbox bottom), no rescaling (cap height and width were matched at render time, so
x-height / stroke / glyph-shape differences remain visible).  Scores:
  iou  = |A∩B| / |A∪B| on ink > 0.4
  corr = Pearson correlation of the ink maps
  dh   = bbox height difference (px) (ascender / overshoot mismatch)
Usage: font_score.py REST_FRAME renders.json
"""

import json
import sys

import numpy as np
from PIL import Image

REFS = {  # key: (x0, y0, x1, y1) on f085
    "professional": (176, 655, 494, 716),
    "roco": (176, 588, 330, 648),
    "para": (174, 746, 768, 768),
}


def ink(img: Image.Image) -> np.ndarray:
    a = np.asarray(img.convert("L"), dtype=np.float32) / 255.0
    return 1.0 - a


def tight(m: np.ndarray, th: float = 0.15) -> np.ndarray:
    ys, xs = np.where(m > th)
    return m[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]


def align(a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    h, w = max(a.shape[0], b.shape[0]), max(a.shape[1], b.shape[1])
    A = np.zeros((h, w), np.float32)
    B = np.zeros((h, w), np.float32)
    A[h - a.shape[0] :, : a.shape[1]] = a
    B[h - b.shape[0] :, : b.shape[1]] = b
    return A, B


def main() -> None:
    frame = Image.open(sys.argv[1])
    renders = json.load(open(sys.argv[2]))
    refs = {}
    for k, box in REFS.items():
        refs[k] = tight(ink(frame.crop(box)))
    # "Roco" reference: cut at the first wide gap (before the period)
    r = refs["roco"]
    cols = (r > 0.3).any(axis=0)
    gaps = [i for i in range(5, len(cols) - 3) if not cols[i:i + 3].any()]
    if gaps:
        refs["roco"] = tight(r[:, : gaps[0]])
    table = {}
    for rd in renders:
        k = rd["key"]
        if k not in refs:
            continue
        cand = tight(ink(Image.open(rd["file"])))
        A, B = align(refs[k], cand)
        ma, mb = A > 0.4, B > 0.4
        iou = float((ma & mb).sum() / max((ma | mb).sum(), 1))
        corr = float(np.corrcoef(A.ravel(), B.ravel())[0, 1])
        table.setdefault(k, []).append((rd["family"], iou, corr, cand.shape[0] - refs[k].shape[0],
                                        cand.shape[1] - refs[k].shape[1], rd["letterSpacingEm"], rd["size"]))
    for k, rows in table.items():
        print(f"\n== {k}  (reference bbox {refs[k].shape[1]}x{refs[k].shape[0]})")
        for fam, iou, corr, dh, dw, ls, size in sorted(rows, key=lambda r: -r[2])[:12]:
            print(f"  {fam:22s} corr={corr:.3f} iou={iou:.3f} dh={dh:+d} dw={dw:+d} tracking={ls:+.4f}em size={size:.2f}px")


if __name__ == "__main__":
    main()
