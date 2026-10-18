"""Fit 'rise + fade' entrance tweens to residual element tracks.

dy(t) = A * (1 - E(u)),  u = clip((t - t0) / D, 0, 1),  E(u) = 1 - (1 - u)^p   (power-p out)
Usage: fit_entrances.py residuals.txt
"""
import re
import sys
import numpy as np
from scipy.optimize import least_squares

blocks = {}
for line in open(sys.argv[1]):
    name, rest = line.split(" ", 2)[1], line.split(" ", 2)[2]
    pts = []
    for m in re.finditer(r"(\d+):\(([+-]\d+),([+-]\d+)\)s([\d.]+)b(\d+)g([\d.]+)", rest):
        n, dx, dy, s, b, g = m.groups()
        pts.append((int(n) / 30, float(dy), float(g), float(b)))
    blocks[name] = pts

def model(p, t):
    A, t0, D, pw = p
    u = np.clip((t - t0) / D, 0, 1)
    return A * (1 - u) ** pw

for name, pts in blocks.items():
    pts = [q for q in pts if abs(q[1]) < 120]
    if len(pts) < 8:
        continue
    t = np.array([q[0] for q in pts]); dy = np.array([q[1] for q in pts])
    if np.abs(dy).max() < 4:
        continue
    # keep the longest contiguous run where |dy| decreases (the entrance)
    i0 = int(np.argmax(np.abs(dy)))
    t, dy = t[i0:], dy[i0:]
    A0 = dy[0]
    fit = least_squares(lambda p: model(p, t) - dy, [A0 * 1.1, t[0] - 0.05, 1.0, 3],
                        bounds=([-300, 0, 0.2, 1], [300, 3, 3, 8]))
    A, t0, D, pw = fit.x
    rms = np.sqrt(np.mean(fit.fun ** 2))
    print(f"{name:13s} rise A={A:+6.1f}px start={t0:.3f}s dur={D:.2f}s power={pw:.2f} rms={rms:.2f}px "
          f"(first tracked f{int(round(t[0]*30)):03d})")
