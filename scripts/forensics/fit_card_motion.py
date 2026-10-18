"""Fit per-card, per-property entrance tweens from tracked samples.

Samples: early blurred-fit poses for the orange card (fit_blurred_card.py output) +
SIFT similarity tracks (track_cards.py) for every card.  Outliers are rejected by
requiring plausible scale/rotation and continuity.

Model per property:  v(t) = rest + (v0 - rest) * (1 - B((t - t0) / D))   for t >= t0,
B = cubic-bezier(x1, y1, x2, y2) easing.  Free: v0, t0, D, x1, y1, x2, y2 (shared t0, D
per card), fitted jointly on normalised residuals.

Usage: fit_card_motion.py cards.json orange_early.txt OUT.json
"""

import json
import re
import sys

import numpy as np
from scipy.optimize import least_squares

PROPS = ["cx", "cy", "rot", "scale"]


def bez(u, x1, y1, x2, y2):
    s = np.clip(u, 0, 1).copy()
    for _ in range(25):
        bx = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
        dbx = 3 * (1 - s) ** 2 * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s ** 2 * (1 - x2)
        s = np.clip(s - (bx - u) / np.where(np.abs(dbx) < 1e-6, 1e-6, dbx), 0, 1)
    return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3


def main() -> None:
    cards = json.load(open(sys.argv[1]))
    early = {}
    for line in open(sys.argv[2]):
        m = re.match(r"f(\d+) cx=\s*([\d.-]+) cy=\s*([\d.-]+) rot=([+\-\d.]+) scale=([\d.]+) blur=\s*([\d.]+)px opacity=([\d.]+)", line)
        if m:
            n, cx, cy, rot, s, b, o = m.groups()
            early[int(n)] = {"cx": float(cx), "cy": float(cy), "rot": float(rot), "scale": float(s),
                             "blur": float(b), "opacity": float(o)}
    rest = {}
    for name in ["orange", "green", "black", "brown"]:
        r = [row[name] for row in cards if 85 <= row["frame"] <= 105 and row.get(name, {}).get("ok")]
        rest[name] = {p: float(np.median([v[p] for v in r])) for p in PROPS}
    out = {"rest": rest, "fits": {}, "samples": {}}
    for name in ["orange", "green", "black", "brown"]:
        samples = []
        for row in cards:
            n = row["frame"]
            if n < 2 or n > 106:
                continue
            if name == "orange" and n in early and n <= 18:
                samples.append((n / 30, dict(early[n], early=True)))
                continue
            v = row.get(name)
            if not v or not v.get("ok") or v["inliers"] < 9:
                continue
            if not (0.6 < v["scale"] < 2.6 and -15 < v["rot"] < 20):
                continue
            samples.append((n / 30, v))
        # continuity filter: drop samples whose centre jumps > 80 px from neighbours' median
        keep = []
        for i, (t, v) in enumerate(samples):
            if v.get("early"):
                keep.append((t, v))
                continue
            nb = [s[1] for s in samples[max(0, i - 3) : i + 4] if s is not samples[i]]
            if nb:
                mx = np.median([q["cx"] for q in nb]); my = np.median([q["cy"] for q in nb])
                if abs(v["cx"] - mx) > 80 or abs(v["cy"] - my) > 80:
                    continue
            keep.append((t, v))
        t = np.array([k[0] for k in keep])
        vals = {p: np.array([k[1][p] for k in keep]) for p in PROPS}
        out["samples"][name] = [{"t": round(float(tt), 4), **{p: round(float(vals[p][i]), 3) for p in PROPS}}
                                for i, tt in enumerate(t)]
        fits = {}
        for p in PROPS:
            rv = rest[name][p]
            span = max(np.abs(vals[p] - rv).max(), 1e-3)

            def resid(q):
                v0, t0, D, x1, y1, x2, y2 = q
                u = (t - t0) / D
                return ((rv + (v0 - rv) * (1 - bez(u, x1, y1, x2, y2))) - vals[p]) / span

            v_first = vals[p][0]
            q0 = [v_first + (v_first - rv) * 0.3, t[0] - 0.1, 2.4, 0.2, 0.6, 0.3, 1.0]
            lb = [-5000, 0.0, 0.5, 0.0, 0.0, 0.0, 0.6]
            ub = [5000, max(t[0], 0.07), 4.0, 1.0, 2.0, 1.0, 1.2]
            q0[1] = min(max(q0[1], lb[1]), ub[1] - 1e-3)
            f = least_squares(resid, q0, bounds=(lb, ub))
            v0, t0, D, x1, y1, x2, y2 = f.x
            fits[p] = {"from": round(v0, 3), "to": round(rv, 3), "start": round(t0, 4), "duration": round(D, 4),
                       "bezier": [round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)],
                       "rms": round(float(np.sqrt(np.mean((f.fun * span) ** 2))), 3)}
            print(f"{name:6s} {p:5s} from={v0:8.2f} to={rv:8.2f} start={t0:.3f}s dur={D:.3f}s "
                  f"bezier=({x1:.3f},{y1:.3f},{x2:.3f},{y2:.3f}) rms={fits[p]['rms']:.2f} n={len(t)} first_t={t[0]:.3f}")
        out["fits"][name] = fits
    if early:
        out["orange_early_blur_opacity"] = {str(k): {"blur": v["blur"], "opacity": v["opacity"]} for k, v in early.items()}
    json.dump(out, open(sys.argv[3], "w"), indent=1)


if __name__ == "__main__":
    main()
