"""Fit cubic-bezier easing + start/duration to measured bento morph progress curves.

Groups share one duration + bezier per direction; each group has its own start time.
Usage: fit_easing.py references/reference-metrics-bento-trajectories.json
"""
import json
import sys
import numpy as np
from scipy.optimize import least_squares


def bezier_y_of_x(x, x1, y1, x2, y2):
    # solve bezier x(s)=x by Newton/bisection (vectorised)
    s = np.clip(x, 0, 1).copy()
    for _ in range(30):
        bx = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
        dbx = 3 * (1 - s) ** 2 * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s ** 2 * (1 - x2)
        s = np.clip(s - (bx - x) / np.where(np.abs(dbx) < 1e-6, 1e-6, dbx), 0, 1)
    return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3


data = json.load(open(sys.argv[1]))["frames"]
groups = {"bottom": "payment_right", "middle": "ai_right", "left": "credit_bottom"}
for direction, (f0, f1) in {"A->B": (160, 205), "B->A": (210, 262)}.items():
    obs = {g: [(d["t"], d["p"][k]) for d in data if f0 <= d["frame"] <= f1] for g, k in groups.items()}
    if direction == "B->A":
        obs = {g: [(t, 1 - p) for t, p in v] for g, v in obs.items()}

    def resid(params):
        x1, y1, x2, y2, dur, *starts = params
        r = []
        for (g, v), t0 in zip(obs.items(), starts):
            t = np.array([a for a, _ in v]); p = np.array([b for _, b in v])
            u = np.clip((t - t0) / dur, 0, 1)
            r.append(bezier_y_of_x(u, x1, y1, x2, y2) - p)
        return np.concatenate(r)

    t_guess = 5.5 if direction == "A->B" else 7.35
    x0 = [0.4, 0.0, 0.2, 1.0, 1.0, t_guess, t_guess + 0.1, t_guess + 0.3]
    lb = [0, -0.5, 0, 0.5, 0.3, t_guess - 0.4, t_guess - 0.4, t_guess - 0.4]
    ub = [1, 0.5, 1, 1.5, 2.0, t_guess + 0.8, t_guess + 0.8, t_guess + 0.8]
    fit = least_squares(resid, x0, bounds=(lb, ub))
    x1, y1, x2, y2, dur, *starts = fit.x
    rms = np.sqrt(np.mean(fit.fun ** 2))
    print(f"{direction}: cubic-bezier({x1:.3f}, {y1:.3f}, {x2:.3f}, {y2:.3f}) duration={dur:.3f}s "
          + " ".join(f"{g}_start={s:.3f}s" for g, s in zip(obs, starts)) + f"  rms={rms:.3f}")
