"""Pixel measurement log (Gate 03): identical ink-box probes on the reference frame and the app
screenshot, reported as deltas in px.  Probe = (region, polarity, threshold); ink bbox of pixels
darker (dark) / brighter (light) than the threshold, or differing from a flat background (bg).

Usage: .venv-tools/bin/python -I tests/measure_layout.py REF.png APP.png [hero|bento] [OUT.json]
"""

import json
import sys

import cv2
import numpy as np

HERO = {
    "logo_mark": ((128, 126, 182, 188), "dark", 160),
    "wordmark": ((185, 132, 300, 182), "dark", 160),
    "wallet_pill": ((1250, 128, 1356, 186), "bg", 6),
    "wallet_text": ((1272, 142, 1342, 172), "dark", 140),
    "register_pill": ((1354, 128, 1472, 186), "dark", 60),
    "register_text": ((1372, 145, 1452, 170), "lightin", 150),
    "arrow_up": ((166, 438, 200, 470), "dark", 236),
    "arrow_down": ((184, 474, 216, 506), "dark", 160),
    "eyebrow": ((168, 538, 392, 564), "dark", 200),
    "headline_l1": ((168, 584, 480, 652), "dark", 200),
    "headline_l2": ((168, 654, 800, 722), "dark", 200),
    "para_l1": ((168, 744, 800, 768), "dark", 200),
    "para_l2": ((168, 768, 800, 792), "dark", 200),
    "para_l3": ((168, 792, 800, 817), "dark", 236),
    "para_l4": ((168, 816, 800, 842), "dark", 245),
    "buy_card": ((168, 868, 314, 916), "dark", 100),
    "buy_text": ((186, 882, 300, 902), "lightin", 150),
    "discover": ((312, 868, 456, 916), "bg", 8),
    "discover_text": ((326, 882, 440, 902), "dark", 150),
    "divider": ((168, 948, 940, 962), "dark", 252),
    "pill_walentyna": ((1094, 846, 1358, 922), "bg", 10),
    "pill_slawomira": ((977, 921, 1225, 993), "bg", 6),
    "pill_haleema": ((1225, 921, 1474, 993), "bg", 6),
    "pill_patrick": ((1018, 993, 1249, 1066), "bg", 6),
    "pill_brandon": ((1249, 993, 1432, 1066), "bg", 10),
    "name_slawomira": ((1040, 938, 1215, 958), "dark", 150),
    "amount_slawomira": ((1040, 958, 1215, 975), "dark", 200),
    "name_patrick": ((1080, 1010, 1240, 1030), "dark", 150),
    "amount_patrick": ((1080, 1030, 1240, 1047), "dark", 200),
    "deco_text": ((1340, 92, 1518, 1108), "deco", 0),
}
BENTO = {
    "logo_mark": ((128, 126, 182, 188), "light", 120),
    "wordmark": ((185, 132, 300, 182), "light", 120),
    "register_pill": ((1354, 128, 1472, 186), "light", 200),
    "credit_title": ((222, 306, 362, 350), "white", 0),
    "credit_sub": ((222, 352, 362, 400), "white", 0),
    "customers_eyebrow": ((600, 288, 736, 312), "white", 0),
    "customers_title": ((602, 408, 750, 458), "white", 0),
    "customers_sub": ((602, 466, 976, 504), "white", 0),
    "trust_eyebrow": ((218, 536, 340, 560), "white", 0),
    "trust_l1": ((218, 576, 392, 614), "white", 0),
    "trust_l2": ((218, 616, 392, 650), "white", 0),
    "ai_title": ((664, 640, 810, 683), "white", 0),
    "easy_title": ((986, 640, 1250, 690), "white", 0),
    "payment_eyebrow": ((602, 812, 768, 834), "white", 0),
    "payment_title": ((602, 892, 800, 950), "white", 0),
    "payment_sub": ((600, 950, 900, 986), "white", 0),
    "invested_l1": ((1106, 798, 1262, 840), "white", 0),
    "invested_l2": ((1106, 842, 1262, 892), "white", 0),
}


def bbox(img: np.ndarray, box, pol: str, th: int):
    x0, y0, x1, y1 = box
    reg = img[y0:y1, x0:x1].astype(np.int16)
    g = reg.mean(axis=2)
    if pol == "dark":
        m = g < th
    elif pol == "light":
        m = g > th
    elif pol == "lightin":  # light glyphs inside a dark pill
        m = g > th
    elif pol == "white":  # white text over artwork
        m = (reg.min(axis=2) > 205) & ((reg.max(axis=2) - reg.min(axis=2)) < 30)
    elif pol == "bg":  # anything that differs from the white canvas
        m = g < 255 - th
    elif pol == "deco":  # faint gray lettering on white (exclude darker UI)
        m = (g < 251) & (g > 228)
        m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    else:
        raise ValueError(pol)
    ys, xs = np.where(m)
    if len(xs) < 3:
        return None
    return [int(xs.min() + x0), int(ys.min() + y0), int(xs.max() + x0), int(ys.max() + y0)]


def main() -> None:
    ref = cv2.imread(sys.argv[1])
    app = cv2.imread(sys.argv[2])
    probes = BENTO if (len(sys.argv) > 3 and sys.argv[3] == "bento") else HERO
    rows = []
    print(f"{'element':18s} {'reference x0,y0,x1,y1':>24s} {'app x0,y0,x1,y1':>24s}   dx0  dy0  dx1  dy1")
    for name, (box, pol, th) in probes.items():
        a, b = bbox(ref, box, pol, th), bbox(app, box, pol, th)
        if a and b:
            d = [b[i] - a[i] for i in range(4)]
            flag = "  <-- " if max(abs(v) for v in d) > 2 else ""
            print(f"{name:18s} {str(a):>24s} {str(b):>24s}  {d[0]:+4d} {d[1]:+4d} {d[2]:+4d} {d[3]:+4d}{flag}")
        else:
            d = None
            print(f"{name:18s} {str(a):>24s} {str(b):>24s}   (missing)")
        rows.append({"element": name, "reference": a, "app": b, "delta": d})
    if len(sys.argv) > 4:
        json.dump(rows, open(sys.argv[4], "w"), indent=1)


if __name__ == "__main__":
    main()
