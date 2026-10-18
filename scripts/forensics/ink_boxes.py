"""Ink bounding boxes of text rows inside a region (rest-frame element inventory).
Usage: ink_boxes.py FRAME x0 y0 x1 y1 [threshold] [dark|light]"""
import sys
import numpy as np
from PIL import Image
im = np.asarray(Image.open(sys.argv[1]).convert("L")).astype(int)
x0, y0, x1, y1 = map(int, sys.argv[2:6])
th = int(sys.argv[6]) if len(sys.argv) > 6 else 200
mode = sys.argv[7] if len(sys.argv) > 7 else "dark"
sub = im[y0:y1, x0:x1]
ink = sub < th if mode == "dark" else sub > th
rows = ink.any(axis=1)
s = None
for i, v in enumerate(list(rows) + [False]):
    if v and s is None:
        s = i
    elif not v and s is not None:
        cols = np.where(ink[s:i].any(axis=0))[0]
        # split into words/blocks by horizontal gaps > 14px
        blocks, b0, prev = [], cols[0], cols[0]
        for c in cols[1:]:
            if c - prev > 14:
                blocks.append((b0, prev)); b0 = c
            prev = c
        blocks.append((b0, prev))
        print(f"y={y0+s}..{y0+i-1} (h={i-s}) x={x0+cols.min()}..{x0+cols.max()} blocks=" +
              ",".join(f"{x0+a}-{x0+b}" for a, b in blocks))
        s = None
