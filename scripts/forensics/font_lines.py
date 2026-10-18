"""Overlay-score full headline lines against f085 (baseline+left aligned, +-2px search).
Also writes red/cyan overlay PNGs (red = reference only, cyan = candidate only).
Usage: font_lines.py REST_FRAME LINES_DIR"""
import json, sys
import numpy as np
from PIL import Image
def ink(img): return 1.0 - np.asarray(img.convert("L"), dtype=np.float32) / 255.0
def tight(m, th=0.15):
    ys, xs = np.where(m > th); return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
fr = Image.open(sys.argv[1]); d = sys.argv[2]
refs = {"a": tight(ink(fr.crop((176, 586, 475, 650)))), "b": tight(ink(fr.crop((176, 655, 790, 720)))),
        "c": tight(ink(fr.crop((174, 746, 768, 768))))}
def best(R, C):
    H = max(R.shape[0], C.shape[0]) + 6; W = max(R.shape[1], C.shape[1]) + 6
    A = np.zeros((H, W)); A[H - 3 - R.shape[0]:H - 3, 3:3 + R.shape[1]] = R
    out = (-1, None)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            B = np.zeros((H, W)); y0 = H - 3 - C.shape[0] + dy; x0 = 3 + dx
            if y0 < 0 or y0 + C.shape[0] > H or x0 + C.shape[1] > W: continue
            B[y0:y0 + C.shape[0], x0:x0 + C.shape[1]] = C
            c = float(np.corrcoef(A.ravel(), B.ravel())[0, 1])
            if c > out[0]: out = (c, (A, B))
    return out
for row in json.load(open(f"{d}/lines.json")):
    scores = []
    for k in "abc":
        C = tight(ink(Image.open(f"{d}/{row['tag']}_{k}.png")))
        c, (A, B) = best(refs[k], C)
        scores.append(c)
        ov = np.stack([1 - np.clip(B, 0, 1) * 1.0, 1 - np.clip(A, 0, 1), 1 - np.clip(A, 0, 1)], axis=2)
        ov = np.stack([1 - B, 1 - A, 1 - A], axis=2) if False else np.stack([1 - B, 1 - np.maximum(A, B), 1 - A], axis=2)
        Image.fromarray((np.clip(ov, 0, 1) * 255).astype(np.uint8)).save(f"{d}/ov_{row['tag']}_{k}.png")
    print(f"{row['tag']:34s} L1={scores[0]:.3f} L2={scores[1]:.3f} body={scores[2]:.3f} mean={np.mean(scores):.3f} "
          f"size={row['size']:.2f} track={row['lsEm']:+.4f}em body={row['bodySize']:.2f}px/{row['lscEm']:+.4f}em")
