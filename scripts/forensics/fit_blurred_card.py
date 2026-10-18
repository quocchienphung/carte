"""Analysis-by-synthesis pose fit for a heavily blurred hero card (early intro frames).

Renders the rest-frame card template (rotation, uniform scale, centre, Gaussian blur,
opacity) over the white canvas and minimises the squared error against the frame at
1/4 resolution with Nelder-Mead, walking backwards from a SIFT-verified frame.

Usage: fit_blurred_card.py FRAMES_DIR TEMPLATE_RGBA.png START_FRAME END_FRAME cx cy rot scale
"""

import sys

import cv2
import numpy as np
from scipy.optimize import minimize

Q = 4  # downsample factor


def render(tex: np.ndarray, alpha: np.ndarray, p, shape) -> tuple[np.ndarray, np.ndarray]:
    cx, cy, rot, s, sigma, op = p
    h, w = tex.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), -rot, s / Q)
    M[0, 2] += cx / Q - w / 2
    M[1, 2] += cy / Q - h / 2
    out = cv2.warpAffine(tex, M, (shape[1], shape[0]), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))
    a = cv2.warpAffine(alpha, M, (shape[1], shape[0]), flags=cv2.INTER_LINEAR, borderValue=0)
    sg = max(sigma / Q, 0.01)
    out = cv2.GaussianBlur(out, (0, 0), sg)
    a = cv2.GaussianBlur(a, (0, 0), sg) * op
    return out, a


def main() -> None:
    d = sys.argv[1]
    rgba = cv2.imread(sys.argv[2], cv2.IMREAD_UNCHANGED).astype(np.float32)
    tex, alpha = rgba[:, :, :3], np.ones(rgba.shape[:2], np.float32)
    # rounded-corner alpha (r ~ 18 px at rest) so the silhouette matches
    r = 18
    corner = np.zeros_like(alpha)
    cv2.rectangle(corner, (r, 0), (alpha.shape[1] - r, alpha.shape[0]), 1, -1)
    cv2.rectangle(corner, (0, r), (alpha.shape[1], alpha.shape[0] - r), 1, -1)
    for cx_, cy_ in [(r, r), (alpha.shape[1] - r, r), (r, alpha.shape[0] - r), (alpha.shape[1] - r, alpha.shape[0] - r)]:
        cv2.circle(corner, (cx_, cy_), r, 1, -1)
    alpha = corner
    start, end = int(sys.argv[3]), int(sys.argv[4])
    p = [float(v) for v in sys.argv[5:9]] + [2.0, 1.0]
    step = -1 if end < start else 1
    for n in range(start, end + step, step):
        frame = cv2.imread(f"{d}/f{n:03d}.png").astype(np.float32)
        small = cv2.resize(frame, (frame.shape[1] // Q, frame.shape[0] // Q), interpolation=cv2.INTER_AREA)
        # region: right 2/3 of the frame where the card lives; exclude header buttons band
        mask = np.zeros(small.shape[:2], np.float32)
        mask[0 : 1200 // Q, 560 // Q : 1600 // Q] = 1
        mask[120 // Q : 190 // Q, 1240 // Q : 1480 // Q] = 0

        def loss(q):
            img, a = render(tex, alpha, q, small.shape)
            comp = img * a[..., None] + 255 * (1 - a[..., None])
            return float((((comp - small) ** 2).mean(axis=2) * mask).sum() / mask.sum())

        best = None
        for sg0 in (p[4], 6, 14, 24, 36):
            q0 = list(p)
            q0[4] = sg0
            res = minimize(loss, q0, method="Nelder-Mead",
                           options={"maxiter": 900, "xatol": 0.05, "fatol": 0.01,
                                    "initial_simplex": None})
            if best is None or res.fun < best.fun:
                best = res
        p = list(best.x)
        cx, cy, rot, s, sigma, op = p
        print(f"f{n:03d} cx={cx:7.1f} cy={cy:6.1f} rot={rot:+5.2f} scale={s:5.3f} blur={sigma:5.1f}px "
              f"opacity={op:4.2f} rmse={np.sqrt(best.fun):5.2f}", flush=True)


if __name__ == "__main__":
    main()
