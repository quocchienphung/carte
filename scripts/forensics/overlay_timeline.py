"""Per-frame dim amount (1 - gain vs. resting frame A) for each tile, frames 150..293."""
import json
import sys
import cv2
import numpy as np

PATCHES = {
    "credit": (380, 250, 140, 200), "trust": (190, 860, 330, 160), "ai": (580, 680, 200, 55),
    "easy": (1240, 590, 170, 140), "payment": (570, 776, 300, 30), "invested": (1250, 776, 160, 240),
    "customers": (1000, 250, 400, 120),
}
frames_dir = sys.argv[1]
ref = cv2.imread(f"{frames_dir}/f160.png").astype(np.float64).mean(axis=2)
rows = []
for n in range(150, 294):
    cur = cv2.imread(f"{frames_dir}/f{n:03d}.png").astype(np.float64).mean(axis=2)
    row = {"frame": n, "t": round(n / 30, 4)}
    for k, (x, y, w, h) in PATCHES.items():
        g, o = np.polyfit(ref[y:y + h, x:x + w].ravel(), cur[y:y + h, x:x + w].ravel(), 1)
        row[k] = round(1 - g, 3)
    rows.append(row)
    print(f"f{n:03d} t={n/30:.3f} " + " ".join(f"{k}={row[k]:+.2f}" for k in PATCHES))
json.dump(rows, open(sys.argv[2], "w"), indent=1)
