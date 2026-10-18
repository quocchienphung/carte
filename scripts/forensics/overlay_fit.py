"""Fit B = gain*A + bias per channel on artwork pixels aligned between states A and B.

Shifts come from tile_image_transform.py (translation only, scale 1.0).  Text areas are
excluded by ignoring pixels brighter than 235 in either frame.
Usage: overlay_fit.py FRAME_A.png FRAME_B.png
"""
import sys
import cv2
import numpy as np

# name: (A rect intersect, (dx, dy) image shift A->B)
TILES = {
    "credit": ((190, 250, 330, 200), (0, 97)),
    "trust": ((190, 700, 330, 320), (0, 0)),
    "ai": ((570, 586, 330, 150), (47, 3)),
    "easy": ((1050, 586, 360, 150), (99, 0)),
    "payment": ((570, 776, 300, 246), (-28, 0)),
    "invested": ((1080, 776, 200, 246), (-150, 1)),
    "customers": ((570, 250, 840, 290), (0, 0)),
}
a = cv2.imread(sys.argv[1]).astype(np.float64)
b = cv2.imread(sys.argv[2]).astype(np.float64)
for name, ((x, y, w, h), (dx, dy)) in TILES.items():
    pa = a[y:y + h, x:x + w]
    pb = b[y + dy:y + dy + h, x + dx:x + dx + w]
    keep = (pa.max(axis=2) < 235) & (pb.max(axis=2) < 235)
    out = []
    for c, label in zip(range(3), "BGR"):
        va, vb = pa[:, :, c][keep], pb[:, :, c][keep]
        g, o = np.polyfit(va, vb, 1)
        resid = np.abs(vb - (g * va + o)).mean()
        out.append(f"{label}: gain={g:.3f} bias={o:6.1f} resid={resid:4.1f}")
    ga, gb = cv2.cvtColor(pa.astype(np.uint8), cv2.COLOR_BGR2HSV), cv2.cvtColor(pb.astype(np.uint8), cv2.COLOR_BGR2HSV)
    print(f"{name:9s} n={keep.sum():6d} " + " | ".join(out) +
          f" | satA={ga[:,:,1][keep].mean():5.1f} satB={gb[:,:,1][keep].mean():5.1f}")
