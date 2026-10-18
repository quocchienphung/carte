"""Stage-2 scoring with +-3 px shift search and ink-density (weight) comparison.
Usage: font_score2.py REST_FRAME renders.json"""
import json, sys
import numpy as np
from PIL import Image

def ink(img): return 1.0 - np.asarray(img.convert("L"), dtype=np.float32) / 255.0
def tight(m, th=0.15):
    ys, xs = np.where(m > th); return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

fr = Image.open(sys.argv[1])
line1 = tight(ink(fr.crop((176, 588, 470, 648))))
h = line1.shape[0]
cols = line1 > 0.3
period_x = None
for x in range(100, line1.shape[1]):
    c = cols[:, x]
    if c.any() and not c[: int(h * 0.7)].any():
        period_x = x; break
refs = {"professional": tight(ink(fr.crop((176, 655, 494, 716)))),
        "roco": tight(line1[:, :period_x - 1]),
        "para": tight(ink(fr.crop((174, 746, 768, 768))))}
print("roco ref width", refs["roco"].shape, "period at", period_x)

def score(R, C):
    H = max(R.shape[0], C.shape[0]) + 8; W = max(R.shape[1], C.shape[1]) + 8
    A = np.zeros((H, W), np.float32); A[H - 4 - R.shape[0]:H - 4, 4:4 + R.shape[1]] = R
    best = -1
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            B = np.zeros((H, W), np.float32)
            y0 = H - 4 - C.shape[0] + dy; x0 = 4 + dx
            if y0 < 0 or x0 < 0 or y0 + C.shape[0] > H or x0 + C.shape[1] > W: continue
            B[y0:y0 + C.shape[0], x0:x0 + C.shape[1]] = C
            c = float(np.corrcoef(A.ravel(), B.ravel())[0, 1])
            best = max(best, c)
    return best

rows = json.load(open(sys.argv[2]))
res = {}
for r in rows:
    C = tight(ink(Image.open(r["file"])))
    R = refs[r["key"]]
    dens_ratio = float(C.sum() / R.sum())  # >1: candidate heavier/wider ink
    res.setdefault(r["key"], []).append((score(R, C), r["family"], r["settings"], r["weight"], dens_ratio,
                                          C.shape[1] - R.shape[1], C.shape[0] - R.shape[0], r["letterSpacingEm"], r["size"]))
for k, v in res.items():
    print(f"\n== {k} (ref {refs[k].shape[1]}x{refs[k].shape[0]})")
    for s, fam, st, w, dr, dw, dh, ls, size in sorted(v, key=lambda q: -q[0])[:14]:
        print(f"  corr={s:.3f} {fam:18s} {st:12s} w{w:<4d} ink_ratio={dr:.2f} dw={dw:+d} dh={dh:+d} track={ls:+.4f}em size={size:.2f}")
