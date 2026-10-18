"""Build labeled contact sheets from extracted video frames.

Usage:
  .venv-tools/bin/python -I scripts/forensics/contact_sheet.py FRAMES_DIR OUT.png START END STEP [COLS] [THUMB_W] [CROP x,y,w,h]

Frame index n maps to t = n / 30 s (30 fps source).
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FPS = 30


def main() -> None:
    frames_dir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    start, end, step = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
    cols = int(sys.argv[6]) if len(sys.argv) > 6 else 6
    thumb_w = int(sys.argv[7]) if len(sys.argv) > 7 else 400
    crop = tuple(int(v) for v in sys.argv[8].split(",")) if len(sys.argv) > 8 else None

    idx = list(range(start, end + 1, step))
    first = Image.open(frames_dir / f"f{idx[0]:03d}.png")
    w, h = first.size
    if crop:
        w, h = crop[2], crop[3]
    thumb_h = round(h * thumb_w / w)
    label_h = 22
    rows = (len(idx) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), (40, 40, 40))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 15)
    except OSError:
        font = ImageFont.load_default()
    for i, n in enumerate(idx):
        im = Image.open(frames_dir / f"f{n:03d}.png").convert("RGB")
        if crop:
            im = im.crop((crop[0], crop[1], crop[0] + crop[2], crop[1] + crop[3]))
        im = im.resize((thumb_w, thumb_h), Image.LANCZOS)
        x = (i % cols) * thumb_w
        y = (i // cols) * (thumb_h + label_h)
        sheet.paste(im, (x, y + label_h))
        draw.text((x + 4, y + 3), f"f{n:03d}  t={n / FPS:.3f}s", fill=(255, 255, 255), font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out)


if __name__ == "__main__":
    main()
