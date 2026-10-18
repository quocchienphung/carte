"""Verify 'artwork fixed in page space' + measure state-B overlay.

For each tile a text-free patch (page coords, visible in both A and B) is compared with
integer shifts in [-12, 12]^2 using zero-mean NCC on the luminance high-pass, then a
per-channel linear fit B = gain*A + bias is computed at the best shift.
Usage: overlay_fit2.py FRAME_A FRAME_B
"""
import sys
import cv2
import numpy as np

PATCHES = {  # x, y, w, h (page px) - chosen away from live text
    "credit": (380, 250, 140, 200),
    "trust": (190, 860, 330, 160),
    "ai": (580, 680, 200, 55),
    "easy": (1240, 590, 170, 140),
    "payment": (570, 800, 300, 40),
    "invested": (1250, 776, 160, 240),
    "customers": (1000, 250, 400, 120),
}
a = cv2.imread(sys.argv[1]).astype(np.float64)
b = cv2.imread(sys.argv[2]).astype(np.float64)
ga, gb = a.mean(axis=2), b.mean(axis=2)
hp = lambda g: g - cv2.GaussianBlur(g, (0, 0), 6)
ha, hb = hp(ga), hp(gb)
for name, (x, y, w, h) in PATCHES.items():
    pa = ha[y:y + h, x:x + w]
    best = (-2, 0, 0)
    for dy in range(-12, 13):
        for dx in range(-12, 13):
            pb = hb[y + dy:y + dy + h, x + dx:x + dx + w]
            za, zb = pa - pa.mean(), pb - pb.mean()
            ncc = (za * zb).sum() / (np.sqrt((za ** 2).sum() * (zb ** 2).sum()) + 1e-9)
            if ncc > best[0]:
                best = (ncc, dx, dy)
    ncc, dx, dy = best
    A = a[y:y + h, x:x + w]
    B = b[y + dy:y + dy + h, x + dx:x + dx + w]
    fits = []
    for c in range(3):
        g, o = np.polyfit(A[:, :, c].ravel(), B[:, :, c].ravel(), 1)
        fits.append((g, o))
    gm = np.mean([f[0] for f in fits])
    om = np.mean([f[1] for f in fits])
    # overlay model: B = (1-alpha)*A + alpha*C  => alpha = 1-gain, C = bias/alpha
    alpha = 1 - gm
    col = om / alpha if alpha > 0.02 else float("nan")
    blur_hint = np.std(hb[y + dy:y + dy + h, x + dx:x + dx + w]) / (np.std(pa) + 1e-9)
    print(f"{name:9s} shift=({dx:+d},{dy:+d}) ncc={ncc:.3f} gain={gm:.3f} bias={om:5.1f} "
          f"-> overlay alpha={alpha:.2f} color~{col:5.1f}  highpass-ratio(B/A)={blur_hint:.2f}  "
          + " ".join(f"{'BGR'[i]}:{f[0]:.2f}/{f[1]:.0f}" for i, f in enumerate(fits)))
