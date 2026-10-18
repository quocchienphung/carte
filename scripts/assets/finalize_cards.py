"""Turn composited card faces into layered web assets.

* removes the printed "Roco.bank" logo (rendered by the BankCard component as SVG + text)
  by glyph-mask inpainting, so the DOM logo is not doubled;
* lifts the EMV chip of the orange card into its own RGBA layer (chip.webp) and fills the
  face underneath, so the chip is an independent component layer;
* writes 2x (880x544) WebP faces with rounded alpha.

Usage: .venv-tools/bin/python -I scripts/assets/finalize_cards.py
"""

import cv2
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / "public/sites/roco-bank/cards"
LOGO_BOX = (586, 436, 832, 512)  # 2x canonical, all four cards share the logo position
CHIP_BOX = (78, 189, 197, 275)
CHIP_R = 14


def rounded(w: int, h: int, r: int) -> np.ndarray:
    m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(m, (0, r), (w - 1, h - r - 1), 255, -1)
    for cx, cy in [(r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)]:
        cv2.circle(m, (cx, cy), r, 255, -1)
    return m


for name in ["orange", "green", "black", "brown"]:
    rgba = cv2.imread(str(ROOT / "docs/research/roco-bank/raw" / f"{name}-face-raw.png"), cv2.IMREAD_UNCHANGED)
    bgr, alpha = rgba[:, :, :3].copy(), rgba[:, :, 3]
    x0, y0, x1, y1 = LOGO_BOX
    reg = bgr[y0:y1, x0:x1].astype(np.int16)
    if name == "orange":
        ink = reg.mean(axis=2) < 120  # dark logo on silver
    else:
        ink = reg.min(axis=2) > 175  # white logo on artwork
    mask = np.zeros(bgr.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = cv2.dilate(ink.astype(np.uint8) * 255, np.ones((7, 7), np.uint8))
    bgr = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)
    if name == "orange":
        cx0, cy0, cx1, cy1 = CHIP_BOX
        chip = rgba[cy0:cy1, cx0:cx1, :3]
        a = cv2.GaussianBlur(rounded(cx1 - cx0, cy1 - cy0, CHIP_R), (0, 0), 0.8)
        cv2.imwrite(str(D / "chip.webp"), np.dstack([chip, a]), [cv2.IMWRITE_WEBP_QUALITY, 95])
        cm = np.zeros(bgr.shape[:2], np.uint8)
        cm[cy0 - 2:cy1 + 2, cx0 - 2:cx1 + 2] = 255
        filled = np.zeros_like(bgr)
        cv2.xphoto.inpaint(bgr, (cm == 0).astype(np.uint8), filled, cv2.xphoto.INPAINT_FSR_FAST)
        bgr = np.where(cm[..., None] > 0, filled, bgr)
    cv2.imwrite(str(D / f"{name}-face.webp"), np.dstack([bgr, alpha]), [cv2.IMWRITE_WEBP_QUALITY, 92])
    print(name, "logo pixels removed:", int((mask > 0).sum()))
print("chip:", (D / "chip.webp").stat().st_size, "bytes")
