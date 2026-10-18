"""Fit precise card corners on a hero frame from approximate corners.

For each card edge, points are sampled along the middle 70% of the edge; at each sample
the strongest luminance gradient along the edge normal (+-R px) is taken as the edge
location.  A RANSAC line fit per edge is intersected with its neighbours -> corners.
Only edge segments flagged visible are used (occluded segments are skipped by passing
a [t0, t1] parametric range per edge).

Usage: card_corners.py FRAME.png OUT.json [APPROX.json]
"""

import json
import sys

import cv2
import numpy as np

R = 10
# approximate corners TL, TR, BR, BL (page px) and visible parametric ranges per edge
# edges: top (TL->TR), right (TR->BR), bottom (BR->BL), left (BL->TL)
CARDS = {
    "orange": {"c": [(577, 37), (1009, 97), (963, 360), (540, 300)],
               "vis": {"top": (0.12, 0.88), "right": (0.12, 0.88), "bottom": (0.12, 0.88), "left": (0.12, 0.88)}},
    "green": {"c": [(674, 165), (1107, 230), (1070, 490), (637, 425)],
              "vis": {"top": (0.82, 0.92), "right": (0.12, 0.88), "bottom": (0.12, 0.88), "left": (0.12, 0.62)}},
    "black": {"c": [(848, 283), (1282, 350), (1242, 615), (808, 548)],
              "vis": {"top": (0.62, 0.9), "right": (0.12, 0.88), "bottom": (0.12, 0.88), "left": (0.12, 0.55)}},
    "brown": {"c": [(938, 420), (1370, 490), (1330, 750), (898, 680)],
              "vis": {"top": (0.82, 0.92), "right": (0.12, 0.88), "bottom": (0.12, 0.88), "left": (0.12, 0.6)}},
}


def edge_points(gray: np.ndarray, p0, p1, t0: float, t1: float) -> np.ndarray:
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0
    n = np.array([-d[1], d[0]]) / np.linalg.norm(d)
    pts = []
    for t in np.linspace(t0, t1, 60):
        c = p0 + d * t
        offs = np.arange(-R, R + 1, 0.5)
        xs, ys = c[0] + n[0] * offs, c[1] + n[1] * offs
        vals = cv2.remap(gray, xs.astype(np.float32).reshape(1, -1), ys.astype(np.float32).reshape(1, -1),
                         cv2.INTER_LINEAR).ravel()
        g = np.abs(np.gradient(vals))
        k = int(np.argmax(g))
        if g[k] > 3:
            pts.append(c + n * offs[k])
    return np.array(pts)


def fit_line(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    best = None
    rng = np.random.default_rng(0)
    for _ in range(300):
        i, j = rng.choice(len(pts), 2, replace=False)
        d = pts[j] - pts[i]
        if np.linalg.norm(d) < 5:
            continue
        n = np.array([-d[1], d[0]]) / np.linalg.norm(d)
        dist = np.abs((pts - pts[i]) @ n)
        inl = dist < 1.0
        if best is None or inl.sum() > best.sum():
            best = inl
    p = pts[best]
    mean = p.mean(axis=0)
    _, _, vt = np.linalg.svd(p - mean)
    return mean, vt[0]


def intersect(l1, l2) -> np.ndarray:
    (p, d), (q, e) = l1, l2
    A = np.array([d, -e]).T
    s = np.linalg.solve(A, q - p)
    return p + d * s[0]


def main() -> None:
    global CARDS
    if len(sys.argv) > 3:
        CARDS = json.load(open(sys.argv[3]))
    img = cv2.imread(sys.argv[1])
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gray = cv2.GaussianBlur(gray, (0, 0), 0.8)
    out = {}
    for name, spec in CARDS.items():
        c = spec["c"]
        edges = {"top": (c[0], c[1]), "right": (c[1], c[2]), "bottom": (c[2], c[3]), "left": (c[3], c[0])}
        lines = {}
        for e, (a, b) in edges.items():
            t0, t1 = spec["vis"][e]
            pts = edge_points(gray, a, b, t0, t1)
            lines[e] = fit_line(pts) if len(pts) >= 4 else None
        corners = {
            "TL": intersect(lines["left"], lines["top"]) if lines["top"] is not None else None,
            "TR": intersect(lines["top"], lines["right"]) if lines["top"] is not None else None,
            "BR": intersect(lines["right"], lines["bottom"]),
            "BL": intersect(lines["bottom"], lines["left"]),
        }
        cj = {k: [round(float(v[0]), 1), round(float(v[1]), 1)] for k, v in corners.items() if v is not None}
        ang = {e: round(float(np.degrees(np.arctan2(l[1][1], l[1][0]))), 2) for e, l in lines.items() if l is not None}
        out[name] = {"corners": cj, "edge_angles_deg": ang}
        print(name, json.dumps(out[name]))
    json.dump(out, open(sys.argv[2], "w"), indent=1)


if __name__ == "__main__":
    main()
