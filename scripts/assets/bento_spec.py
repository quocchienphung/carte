"""Shared bento geometry for asset extraction (video px == canonical CSS px at 1440x1024 canvas).

Rects are (x, y, w, h).  Text boxes are generous ink boxes (+ glow margin) of the live text
layers in state A; their B position follows the measured text anchors.
"""

RECT_A = {
    "credit": (176, 240, 358, 224), "trust": (176, 488, 358, 544), "customers": (558, 240, 866, 312),
    "ai": (558, 576, 358, 168), "easy": (940, 576, 484, 168), "payment": (558, 766, 484, 266),
    "invested": (1066, 766, 358, 266),
}
RECT_B = {
    "credit": (176, 240, 358, 424), "trust": (176, 688, 358, 344), "customers": (558, 240, 866, 312),
    "ai": (558, 576, 458, 168), "easy": (1040, 576, 384, 168), "payment": (558, 766, 334, 266),
    "invested": (916, 766, 508, 266),
}
GROUP = {"credit": "left", "trust": "left", "ai": "middle", "easy": "middle", "payment": "bottom",
         "invested": "bottom", "customers": None}
# text boxes in state A (x0, y0, x1, y1) and the (dx, dy) shift to state B
TEXT_A = {
    "credit": [(222, 306, 362, 400)],
    "trust": [(218, 536, 392, 650)],
    "customers": [(600, 288, 736, 312), (602, 408, 750, 458), (602, 466, 976, 504)],
    "ai": [(664, 640, 810, 683)],
    "easy": [(986, 640, 1250, 690)],
    "payment": [(602, 812, 768, 834), (602, 892, 800, 950), (600, 950, 900, 986)],
    "invested": [(1106, 798, 1262, 892)],
}
TEXT_SHIFT_B = {"credit": (0, 98), "trust": (0, 200), "customers": (0, 0), "ai": (50, 0), "easy": (100, 0),
                "payment": (-28, 0), "invested": (-150, 0)}
# state-B overlay model  B = (1 - dim) * A + dim * C   (C per tile, from overlay_fit2.py)
BACKING = {"credit": 54.0, "trust": 19.0, "customers": 0.0, "ai": 56.0, "easy": 46.0, "payment": 13.0, "invested": 17.0}
RADIUS = 20
