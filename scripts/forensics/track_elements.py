"""Track hero DOM-level elements through the intro and transition.

Templates are cropped from the resting hero frame (f085).  For each frame the template is
searched with a grid of uniform scales and Gaussian blur sigmas (blur-robust, handles
the soft-focus reveals) using normalised cross-correlation in a window around the
expected position.  For the best match the patch is fitted as
    patch = gain * template_blurred + bias
on luminance; for dark-on-white content `gain` ~ opacity (1 = fully visible).

Usage: track_elements.py FRAMES_DIR OUT_JSON first last
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

# name: (x, y, w, h) on f085 with a few px padding
ELEMENTS = {
    "logo": (132, 131, 162, 52),
    "nav_buttons": (1254, 130, 216, 54),
    "arrow_up": (170, 438, 30, 32),
    "arrow_down": (186, 476, 28, 30),
    "eyebrow": (170, 541, 214, 22),
    "headline_l1": (172, 588, 296, 62),
    "headline_l2": (172, 657, 612, 62),
    "para_l1": (170, 745, 600, 24),
    "para_l2": (170, 769, 616, 26),
    "para_l3": (170, 793, 596, 28),
    "para_l4": (170, 817, 416, 28),
    "cta_buy": (170, 870, 144, 44),
    "cta_discover": (310, 870, 144, 44),
    "divider": (170, 949, 764, 14),
    "pill_1": (1094, 848, 262, 74),
    "pill_2": (977, 921, 252, 72),
    "pill_3": (1221, 921, 252, 72),
    "pill_4": (1018, 993, 234, 72),
    "pill_5": (1244, 993, 186, 72),
}
SCALES = [0.86, 0.9, 0.94, 0.97, 1.0, 1.03, 1.06, 1.1, 1.14, 1.2]
SIGMAS = [0, 1.5, 3, 5, 8, 12]
SEARCH = 160


def main() -> None:
    frames_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    first, last = int(sys.argv[3]), int(sys.argv[4])
    rest = cv2.imread(str(frames_dir / "f085.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32)
    temps = {}
    for k, (x, y, w, h) in ELEMENTS.items():
        t = rest[y : y + h, x : x + w]
        temps[k] = {}
        for s in SCALES:
            ts = cv2.resize(t, (max(4, round(w * s)), max(4, round(h * s))), interpolation=cv2.INTER_AREA)
            for sg in SIGMAS:
                # pad before blurring so the white surround participates like in the frame
                pad = int(3 * sg) + 2
                tp = cv2.copyMakeBorder(ts, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
                tb = cv2.GaussianBlur(tp, (0, 0), sg) if sg > 0 else tp
                temps[k][(s, sg)] = tb[pad:-pad, pad:-pad]
    rows = []
    prev = {}
    for n in range(first, last + 1):
        g = cv2.imread(str(frames_dir / f"f{n:03d}.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32)
        row = {"frame": n, "t": round(n / 30, 4)}
        for k, (x, y, w, h) in ELEMENTS.items():
            cx0, cy0 = prev.get(k, (x + w / 2, y + h / 2))
            best = None
            for (s, sg), tb in temps[k].items():
                th, tw = tb.shape
                if float(tb.std()) < 1.0:
                    continue
                x0 = int(max(0, cx0 - tw / 2 - SEARCH))
                y0 = int(max(0, cy0 - th / 2 - SEARCH))
                x1 = int(min(g.shape[1], cx0 + tw / 2 + SEARCH))
                y1 = int(min(g.shape[0], cy0 + th / 2 + SEARCH))
                win = g[y0:y1, x0:x1]
                if win.shape[0] < th or win.shape[1] < tw:
                    continue
                r = cv2.matchTemplate(win, tb, cv2.TM_CCOEFF_NORMED)
                _, mv, _, ml = cv2.minMaxLoc(r)
                if best is None or mv > best[0]:
                    best = (mv, s, sg, x0 + ml[0], y0 + ml[1], tw, th)
            if best is None:
                continue
            mv, s, sg, bx, by, tw, th = best
            patch = g[by : by + th, bx : bx + tw]
            tb = temps[k][(s, sg)]
            A = np.vstack([tb.ravel(), np.ones(tb.size)]).T
            gain, bias = np.linalg.lstsq(A, patch.ravel(), rcond=None)[0]
            # gain relative to the unblurred template contrast
            cx, cy = bx + tw / 2, by + th / 2
            row[k] = {"score": round(float(mv), 3), "scale": s, "blur": sg, "cx": round(cx, 1),
                      "cy": round(cy, 1), "dx": round(cx - (x + w / 2), 1), "dy": round(cy - (y + h / 2), 1),
                      "gain": round(float(gain), 3)}
            if mv > 0.6:
                prev[k] = (cx, cy)
        rows.append(row)
        print(f"f{n:03d} " + " ".join(
            f"{k}[{v['dx']:+.0f},{v['dy']:+.0f} s{v['scale']:.2f} b{v['blur']:.0f} g{v['gain']:.2f} q{v['score']:.2f}]"
            for k, v in row.items() if isinstance(v, dict)))
    out.write_text(json.dumps(rows, indent=1))


if __name__ == "__main__":
    main()
