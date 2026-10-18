"""Print tile runs along probe lines (precise edges, video px).

A pixel is "tile" when any channel differs from the #111 canvas by > TH and it is not a
soft shadow (shadow = gray 8..16).  Runs shorter than 4px are dropped.

Usage: edge_probe.py FRAME.png row|col INDEX START END [TH]
"""

import sys

import numpy as np
from PIL import Image


def main() -> None:
    im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(int)
    kind, idx, a, b = sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
    th = int(sys.argv[6]) if len(sys.argv) > 6 else 9
    line = im[idx, a:b] if kind == "row" else im[a:b, idx]
    lo, hi = line.min(axis=1), line.max(axis=1)
    bg = (lo >= 17 - th) & (hi <= 17 + th) & ((hi - lo) <= 4)
    runs, start = [], None
    for i, v in enumerate(list(~bg) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= 4:
                runs.append((a + start, a + i - 1))
            start = None
    print(" ".join(f"[{s}..{e} w={e - s + 1}]" for s, e in runs))


if __name__ == "__main__":
    main()
