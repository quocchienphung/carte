"""Prepare the user-supplied bank card images for the hero stack.

Each source (1536x969, rounded corners baked onto a black/white backdrop with a few px of edge
fringe) is inset-cropped by INSET px, centre-cropped to the 440:272 card box and written at 2x
(880x544) WebP. The rounded mask is applied by the BankCard component (CSS), so no corner
backdrop or fringe survives.
Usage: .venv-tools/bin/python -I scripts/assets/prepare_bank_cards.py SRC_DIR
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/sites/roco-bank/cards"
INSET = 6
W, H = 880, 544
# source file -> output name (stack order is set in content.ts)
MAP = {"1.png": "vietcombank", "2.png": "techcombank", "3.png": "vietinbank", "4.png": "vib"}

src = Path(sys.argv[1])
for f, name in MAP.items():
    im = Image.open(src / f).convert("RGB")
    w, h = im.size
    im = im.crop((INSET, INSET, w - INSET, h - INSET))
    w, h = im.size
    target = W / H
    if w / h < target:  # too tall -> trim top/bottom
        nh = round(w / target)
        top = (h - nh) // 2
        im = im.crop((0, top, w, top + nh))
    else:
        nw = round(h * target)
        left = (w - nw) // 2
        im = im.crop((left, 0, left + nw, h))
    im = im.resize((W, H), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", quality=92, method=6)
    print(name, im.size)
