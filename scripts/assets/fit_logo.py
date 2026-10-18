"""Fit a parametric SVG for the Roco.bank pinwheel mark to the header logo (f085, 1x).

Model: 6 rounded bars (length L, width Wd, corner radius Wd*k) at angles theta0 + i*60deg;
bar i is centred at C + r*u_i + t*n_i (u_i radial unit, n_i tangential unit), oriented
along u_i.  Rendered at 8x supersampling, box-filtered to 1x, compared to the frame's ink
(1 - luminance) with least squares (Nelder-Mead from a grid of starts).
Writes src/components/sites/roco-bank/logo-params.json and prints the SVG path data.
Usage: fit_logo.py REST_FRAME
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[2]
img = cv2.imread(sys.argv[1], cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0
X0, Y0, X1, Y1 = 132, 131, 180, 183
target = 1.0 - img[Y0:Y1, X0:X1]
SS = 8
Hh, Ww = target.shape


def render(p) -> np.ndarray:
    cx, cy, L, wd, r, t, th0 = p
    canvas = np.zeros((Hh * SS, Ww * SS), np.float32)
    for i in range(6):
        a = np.radians(th0 + 60 * i)
        u = np.array([np.cos(a), np.sin(a)])
        n = np.array([-u[1], u[0]])
        c = np.array([cx - X0, cy - Y0]) + r * u + t * n
        pts = []
        for s1, s2 in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            pts.append(c + s1 * L / 2 * u + s2 * wd / 2 * n)
        cv2.fillPoly(canvas, [np.int32(np.array(pts) * SS)], 1.0, lineType=cv2.LINE_AA)
    return cv2.resize(canvas, (Ww, Hh), interpolation=cv2.INTER_AREA)


def loss(p) -> float:
    return float(((render(p) - target) ** 2).mean())


best = None
for th0 in range(0, 60, 6):
    for t in (-4, -2, 0, 2, 4):
        p0 = [156, 157, 12, 5.5, 11, t, th0]
        res = minimize(loss, p0, method="Nelder-Mead", options={"maxiter": 3000, "xatol": 1e-3, "fatol": 1e-7})
        if best is None or res.fun < best.fun:
            best = res
cx, cy, L, wd, r, t, th0 = best.x
print(f"rms={np.sqrt(best.fun):.4f} centre=({cx:.2f},{cy:.2f}) L={L:.2f} W={wd:.2f} r={r:.2f} t={t:.2f} theta0={th0 % 60:.2f}")
# SVG in a 40x40 viewBox centred on the mark centre
out = {"centre_video_px": [round(cx, 2), round(cy, 2)], "bar_length": round(L, 3), "bar_width": round(wd, 3),
       "radial_offset": round(r, 3), "tangential_offset": round(t, 3), "theta0_deg": round(th0 % 360, 3), "rms": round(float(np.sqrt(best.fun)), 4)}
paths = []
for i in range(6):
    a = np.radians(th0 + 60 * i)
    u = np.array([np.cos(a), np.sin(a)]); n = np.array([-u[1], u[0]])
    c = np.array([20, 20]) + r * u + t * n
    paths.append({"cx": round(float(c[0]), 3), "cy": round(float(c[1]), 3), "angle": round(float(np.degrees(a)), 3)})
out["bars_viewbox40"] = paths
dst = ROOT / "src/components/sites/roco-bank"
dst.mkdir(parents=True, exist_ok=True)
json.dump(out, open(dst / "logo-params.json", "w"), indent=1)
cmp = np.hstack([target, render(best.x), np.abs(target - render(best.x))])
cv2.imwrite(str(ROOT / "docs/research/roco-bank/logo-fit.png"), cv2.resize((255 - cmp * 255).astype(np.uint8), None, fx=8, fy=8, interpolation=cv2.INTER_NEAREST))
print(json.dumps(out, indent=1))
