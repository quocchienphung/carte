"""Measure partner-logo marquee horizontal velocity (px/frame) and stitch a panorama.

Phase correlation between consecutive frames on the strip band (y 992..1038, x 160..900,
fade edges excluded).  Positive dx = content moving right.
Usage: marquee.py FRAMES_DIR first last OUT_PANORAMA.png
"""
import sys
import cv2
import numpy as np

d, first, last, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
Y0, Y1, X0, X1 = 992, 1038, 200, 860
prev = None
total = 0.0
offs = []
for n in range(first, last + 1):
    g = cv2.imread(f"{d}/f{n:03d}.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)
    band = g[Y0:Y1, X0:X1]
    if prev is not None:
        (dx, dy), resp = cv2.phaseCorrelate(prev, band, cv2.createHanningWindow(band.shape[::-1], cv2.CV_32F))
        total += dx
        offs.append((n, dx, resp, total))
        print(f"f{n:03d} dx={dx:+.2f} resp={resp:.2f} cum={total:+.1f}")
    prev = band
# panorama: paste each frame's band at -cum offset
cums = [0.0] + [o[3] for o in offs]
minc, maxc = min(cums), max(cums)
W = int((X1 - X0) + (maxc - minc)) + 2
pano = np.zeros((Y1 - Y0, W), np.float32)
cnt = np.zeros_like(pano)
for (n, c) in zip(range(first, last + 1), cums):
    g = cv2.imread(f"{d}/f{n:03d}.png", cv2.IMREAD_GRAYSCALE).astype(np.float32)[Y0:Y1, X0:X1]
    x = int(round(-(c - maxc)))
    pano[:, x:x + (X1 - X0)] += g
    cnt[:, x:x + (X1 - X0)] += 1
pano = pano / np.maximum(cnt, 1)
cv2.imwrite(out, pano.astype(np.uint8))
print("panorama width", W)
