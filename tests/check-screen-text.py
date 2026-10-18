"""Compare text weight: WebGL device screen vs. the DOM bento area-downscaled to the same size.

Locates the Customers tile (largest bright-textured rect top-right) in both shots by matching the
DOM tile crop against the GL shot over a scale sweep (normalised cross-correlation on edges), then
compares white-ink coverage of the "+390k / Customer to our bank card" text region.
Usage: .venv-tools/bin/python -I tests/check-screen-text.py artifacts/visual-audit/screen-text
"""
import sys
from pathlib import Path

import cv2
import numpy as np

d = Path(sys.argv[1])
dom = cv2.imread(str(d / "dom.png"))
gl = cv2.imread(str(d / "gl.png"))
H, W = dom.shape[:2]
k = W / 1440  # DPR
# Customers tile in the DOM shot (css px → device px): frame 1440×900, scale 0.879, offX 87.2
fs = 900 / 1024
offx = (1440 / fs - 1440) / 2
tile = np.array([558 - 80 + offx, 240 - 88, 866, 312]) * fs * k
x, y, w, h = tile.astype(int)
dom_tile = dom[y:y + h, x:x + w]
g_dom = cv2.Canny(cv2.cvtColor(dom_tile, cv2.COLOR_BGR2GRAY), 60, 140).astype(np.float32)
g_gl = cv2.Canny(cv2.cvtColor(gl, cv2.COLOR_BGR2GRAY), 60, 140).astype(np.float32)
best = (-1, None, None)
for s in np.linspace(0.35, 0.95, 61):
    t = cv2.resize(g_dom, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    r = cv2.matchTemplate(g_gl, t, cv2.TM_CCOEFF_NORMED)
    _, mv, _, ml = cv2.minMaxLoc(r)
    if mv > best[0]:
        best = (mv, s, ml)
score, s, (gx, gy) = best
tw, th = int(w * s), int(h * s)
gl_tile = gl[gy:gy + th, gx:gx + tw]
ref = cv2.resize(dom_tile, (tw, th), interpolation=cv2.INTER_AREA)  # ideal downscale
print(f"match score {score:.3f}  scale {s:.3f}  tile {tw}x{th} at ({gx},{gy})")
# text region inside the tile: x 0.04..0.48, y 0.52..0.86 of the tile
tx0, tx1, ty0, ty1 = int(0.04 * tw), int(0.48 * tw), int(0.52 * th), int(0.86 * th)
a = ref[ty0:ty1, tx0:tx1].astype(int)
b = gl_tile[ty0:ty1, tx0:tx1].astype(int)
def ink(img, th=170):
    return int(((img.min(axis=2) > th) & ((img.max(axis=2) - img.min(axis=2)) < 30)).sum())
def coverage(img):  # sum of brightness above the local background (median)
    gimg = img.mean(axis=2)
    return float(np.clip(gimg - np.median(gimg), 0, None).sum())
print(f"ink px  ideal {ink(a)}  gl {ink(b)}  ratio {ink(b) / max(ink(a), 1):.3f}")
print(f"coverage ideal {coverage(a):.0f}  gl {coverage(b):.0f}  ratio {coverage(b) / max(coverage(a), 1):.3f}")
out = np.vstack([cv2.resize(a.astype(np.uint8), None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST),
                 np.full((6, (tx1 - tx0) * 3, 3), (255, 0, 255), np.uint8),
                 cv2.resize(b.astype(np.uint8), None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)])
cv2.imwrite(str(d / "compare_text.png"), out)
# scale sanity: width of the text-ink bbox in both crops (same scale → same width)
def bbox(img, th=170):
    m = (img.min(axis=2) > th) & ((img.max(axis=2) - img.min(axis=2)) < 30)
    ys, xs = np.where(m)
    return (xs.min(), xs.max(), ys.min(), ys.max()) if len(xs) else None
ba, bb = bbox(a), bbox(b)
print("text bbox ideal", ba, "gl", bb, "width ratio", round((bb[1] - bb[0]) / (ba[1] - ba[0]), 3), "height ratio", round((bb[3] - bb[2]) / (ba[3] - ba[2]), 3))
