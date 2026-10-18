"""Per-glyph font comparison (spacing-independent shape score + advance error).
Glyphs are segmented by empty ink columns; each reference glyph is compared with the
candidate glyph of the same index (aligned at baseline + left, +-1 px search).
Usage: font_glyph_score.py REST_FRAME renders.json [renders2.json ...]"""
import json, sys
import numpy as np
from PIL import Image
def ink(img): return 1.0 - np.asarray(img.convert("L"), dtype=np.float32) / 255.0
def tight(m, th=0.15):
    ys, xs = np.where(m > th); return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
def glyphs(m, th=0.12):
    cols = (m > th).any(axis=0); out = []; s = None
    for i, v in enumerate(list(cols) + [False]):
        if v and s is None: s = i
        elif not v and s is not None: out.append((s, i)); s = None
    return out
def gscore(a, b):
    H = max(a.shape[0], b.shape[0]) + 2; W = max(a.shape[1], b.shape[1]) + 2
    best = -1
    for dx in (-1, 0, 1):
        A = np.zeros((H, W)); B = np.zeros((H, W))
        A[H - 1 - a.shape[0]:H - 1, 1:1 + a.shape[1]] = a
        x0 = 1 + dx
        if x0 < 0 or x0 + b.shape[1] > W: continue
        B[H - 1 - b.shape[0]:H - 1, x0:x0 + b.shape[1]] = b
        best = max(best, float(np.corrcoef(A.ravel(), B.ravel())[0, 1]))
    return best
fr = Image.open(sys.argv[1])
refs = {"professional": tight(ink(fr.crop((176, 655, 494, 716))))}
line1 = tight(ink(fr.crop((176, 588, 470, 648))))
refs["roco"] = tight(line1[:, :140])
rows = []
for f in sys.argv[2:]: rows += json.load(open(f))
res = []
for r in rows:
    if r["key"] not in refs: continue
    R = refs[r["key"]]; C = tight(ink(Image.open(r["file"])))
    gr, gc = glyphs(R), glyphs(C)
    if len(gr) != len(gc):
        res.append((r["key"], r["family"], r["settings"], r["weight"], None, None, len(gr), len(gc))); continue
    # vertical: both baseline-aligned (bbox bottom); each glyph cropped from full-height strips
    sc = [gscore(R[:, a:b], C[:, c:d]) for (a, b), (c, d) in zip(gr, gc)]
    adv = float(np.mean([abs(a - c) for (a, _), (c, _) in zip(gr, gc)]))
    res.append((r["key"], r["family"], r["settings"], r["weight"], float(np.mean(sc)), adv, len(gr), len(gc)))
for key in refs:
    print(f"\n== {key}: glyph-shape score (mean corr), mean |advance error| px")
    ok = sorted([q for q in res if q[0] == key and q[4] is not None], key=lambda q: -q[4])
    for q in ok[:16]:
        print(f"  shape={q[4]:.3f} adv_err={q[5]:5.2f}px  {q[1]:18s} {q[2]:10s} w{q[3]}")
    bad = sorted({q[1] for q in res if q[0] == key and q[4] is None})
    print("  segmentation mismatch:", ", ".join(bad))
