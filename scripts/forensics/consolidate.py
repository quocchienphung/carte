"""Consolidate all forensic measurements into references/reference-metrics.json and print
markdown geometry tables for VIDEO_FORENSICS.md.

Inputs (all produced by the other scripts in scripts/forensics/):
  references/reference-metrics-canvas.json
  references/reference-metrics-bento.json
  references/reference-metrics-bento-trajectories.json
  references/reference-metrics-bento-dim.json
  references/reference-metrics-cards.json
  <scratch>/track/cards.json, elements.json, global_fits.json, bento_entrance.json
Usage: consolidate.py SCRATCH_TRACK_DIR
"""

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "references"
track = Path(sys.argv[1])

canvas = json.load(open(REF / "reference-metrics-canvas.json"))
bento = json.load(open(REF / "reference-metrics-bento.json"))
traj = json.load(open(REF / "reference-metrics-bento-trajectories.json"))
cardfit = json.load(open(REF / "reference-metrics-cards.json"))
cards_track = json.load(open(track / "cards.json"))
glob = json.load(open(track / "global_fits.json"))

CARD_W, CARD_H = 440, 272

metrics = {
    "_about": "All values in video pixels (1600x1200 frame, 30 fps). Inset web canvas origin = (80, 88), "
              "size 1440x1024, so CSS px inside the canvas = video px - (80, 88) at the reference capture scale 1.0. "
              "Fitted easing = cubic-bezier over [start, start+duration]. See references/VIDEO_FORENSICS.md.",
    "video": {"width": 1600, "height": 1200, "fps": 30, "frames": 294, "duration": 9.8, "codec": "h264 Main yuv420p"},
    "stage": {"mat_top": "#f1f1f1", "mat_bottom_edge": "#e7e7e7", "mat_bottom_center": "#e1e1e1",
              "canvas": {"x": 80, "y": 88, "w": 1440, "h": 1024, "radius": 4}, "hero_bg": "#ffffff", "bento_bg": "#111111"},
    "scenes": [
        {"id": "poster", "frames": [0, 1], "t": [0.0, 0.0667], "note": "static thumbnail state (different card poses/art crop) then hard cut"},
        {"id": "hero_intro", "frames": [2, 84], "t": [0.0667, 2.8], "note": "page zoom-out, card fly-in, copy reveals"},
        {"id": "hero_rest", "frames": [85, 106], "t": [2.833, 3.533], "note": "static except logo marquee"},
        {"id": "transition", "frames": [107, 150], "t": [3.567, 5.0], "note": "page scroll 1024px, dark section rises, tiles scale in, header split-inverts"},
        {"id": "bento_A", "frames": [151, 164], "t": [5.033, 5.467]},
        {"id": "morph_A_to_B", "frames": [165, 202], "t": [5.473, 6.757]},
        {"id": "bento_B", "frames": [203, 219], "t": [6.767, 7.3]},
        {"id": "morph_B_to_A", "frames": [220, 257], "t": [7.303, 8.854]},
        {"id": "bento_A_final", "frames": [258, 293], "t": [8.6, 9.8]},
    ],
    "zoom": {"property": "uniform scale of the whole canvas+page content about frame point (800, 600); header excluded",
             "from": round(glob["zoom"][0], 4), "to": 1.0, "start": round(glob["zoom"][1], 4),
             "duration": round(glob["zoom"][2], 4), "bezier": [round(v, 4) for v in glob["zoom"][3:]],
             "samples": [{"t": r["t"], "scale": round((600 - r["white"]["y"]) / 512.0, 4)} for r in canvas if 2 <= r["frame"] <= 30]},
    "scroll": {"property": "page translateY (hero up, dark section up); total 1024px", "distance": 1024,
               "start": round(glob["scroll"][0], 4), "duration": round(glob["scroll"][1], 4),
               "bezier": [round(v, 4) for v in glob["scroll"][2:]], "card_parallax_factor": 0.87,
               "samples": [{"t": r["t"], "S": (1112 - r["dark"]["y"]) if r["dark"]["h"] > 0 else 0}
                           for r in canvas if 104 <= r["frame"] <= 151]},
    "header": {
        "logo_mark": {"x": 138, "y": 137, "w": 36, "h": 40}, "wordmark_ink": {"x": 191, "x2": 288},
        "wallet": {"x": 1260, "y": 137, "w": 91, "h": 40}, "register": {"x": 1359, "y": 136, "w": 105, "h": 41},
        "entrance": {"rise_from": 40, "start": 0.2, "duration": 1.0, "note": "logo first visible f008 at +38px, opacity 0.05; settles f035; no zoom"},
        "theme_switch": "per-pixel split along the rising dark-section edge (two header copies, dark copy clipped)",
    },
    "hero_rest_layout": {
        "arrow_up": {"x": 176, "y": 445, "w": 17, "h": 18, "color": "light gray"},
        "arrow_down": {"x": 192, "y": 482, "w": 16, "h": 17},
        "eyebrow": {"text": "CREATE YOUR OWN", "x": 176, "x2": 376, "cap_top": 547, "baseline": 556, "cap_height": 10},
        "headline": {"line1": {"text": "Roco.bank", "x": 180, "x2": 461, "cap_top": 596, "baseline": 641},
                     "line2": {"text": "Professional bank card", "x": 180, "x2": 776, "cap_top": 665, "baseline": 710,
                               "words": {"Professional": [180, 490], "bank": [512, 645], "card": [663, 776]}},
                     "line_pitch": 69},
        "paragraph": {"x": 177, "lines": [[750, 763, 763], [774, 789, 779], [798, 815, 759], [822, 839, 578]],
                      "line_pitch": 24, "note": "[top, bottom, right]; line 3 partly gray, line 4 light gray"},
        "cta_buy": {"x": 176, "y": 876, "w": 132, "h": 32, "bg": "#000000"},
        "cta_discover": {"x": 316, "y": 876, "w": 132, "h": 32, "bg": "#efefef"},
        "divider": {"x": 176, "y": 955, "w": 752, "h": 2, "color": "#f5f5f5"},
        "logo_strip": {"y": 990, "h": 50, "x": 60, "x2": 940, "pitch": 147.5, "edge_fade": True},
        "pills": {
            "walentyna": {"x": 1102, "y": 856, "w": 248, "h": 58, "bg": "orange gradient #fbab5c->#f7b471"},
            "slawomira": {"x": 985, "y": 929, "w": 237, "h": 56, "bg": "#f6f6f6"},
            "haleema": {"x": 1229, "y": 929, "w": 236, "h": 56, "bg": "#f6f6f6"},
            "patrick": {"x": 1026, "y": 1001, "w": 220, "h": 56, "bg": "#f7f7f7"},
            "brandon": {"x": 1252, "y": 1001, "w": 172, "h": 56, "bg": "green gradient ~#98af7a"},
        },
        "deco_text": {"text": "Personal + Business", "rotation": -90, "x": 1355, "x2": 1455,
                      "style": "'Personal' outline stroke, '+ Business' solid, near-white gray; static (follows zoom only)"},
    },
    "cards": {"size": {"w": CARD_W, "h": CARD_H}, "z_order_top_to_bottom": ["orange", "green", "black", "brown"],
              "rest": cardfit["rest"], "entrance_fits": cardfit["fits"],
              "orange_blur_opacity_early": cardfit.get("orange_early_blur_opacity", {}),
              "poster_corners_f000": json.load(open(track.parent / "corners_f000.json")),
              "rest_corners_f085": json.load(open(track.parent / "corners_f085.json"))},
    "bento": {
        "layout_A": {"credit": [176, 240, 358, 224], "trust": [176, 488, 358, 544], "customers": [558, 240, 866, 312],
                     "ai": [558, 576, 358, 168], "easy": [940, 576, 484, 168], "payment": [558, 766, 484, 266],
                     "invested": [1066, 766, 358, 266]},
        "layout_B": {"credit": [176, 240, 358, 424], "trust": [176, 688, 358, 344], "customers": [558, 240, 866, 312],
                     "ai": [558, 576, 458, 168], "easy": [1040, 576, 384, 168], "payment": [558, 766, 334, 266],
                     "invested": [916, 766, 508, 266]},
        "gap": 24,
        "artwork_anchor": {"credit": "top (fixed in page)", "trust": "bottom (fixed in page)", "customers": "static",
                           "ai": "left", "easy": "right", "payment": "left", "invested": "right",
                           "evidence": "zero-shift NCC 0.97-0.998 between A and B on text-free patches"},
        "text_anchor": {"credit": "vertically centred", "trust": "top 60px", "ai": "centred",
                        "easy": "left +56px", "payment": "left (A: +54px, B: +26px, i.e. -28px in B)",
                        "invested": "left +49px (moves with left edge)", "customers": "static"},
        "state_B_dim": {"model": "artwork layer opacity -> ~0.5 over per-tile backing colour (customers untouched)",
                        "backing_estimates": {"credit": "#363636", "ai": "#383838", "easy": "#2e2e2e",
                                              "trust": "#131313", "payment": "#0e0e0e", "invested": "#111111"},
                        "timeline": "dim = 0.5 * group progress"},
        "morph_groups": {"bottom": ["payment", "invested"], "middle": ["ai", "easy"], "left": ["credit", "trust"]},
        "morph_A_to_B": {"bezier": [0.423, 0.109, 0.141, 1.0], "duration": 1.001,
                         "starts": {"bottom": 5.473, "middle": 5.593, "left": 5.757}, "rms_progress": 0.008},
        "morph_B_to_A": {"bezier": [0.35, 0.116, 0.056, 1.14], "duration": 1.26,
                         "starts": {"bottom": 7.303, "middle": 7.428, "left": 7.594}, "rms_progress": 0.009},
        "entrance_scale": {"model": "scale 0->1 about own centre (credit: bottom-centre, ai: x=+51px from centre) while section scrolls",
                           "power_out_fits": {"credit": [4.141, 0.963, 2.56], "trust": [4.229, 1.232, 5.0],
                                              "customers": [4.068, 1.134, 2.96], "ai": [3.986, 0.943, 2.12],
                                              "easy": [3.985, 0.93, 2.36], "payment": [3.707, 1.108, 1.75],
                                              "invested": [3.586, 1.226, 1.54]},
                           "format": "[start_s, duration_s, power] for scale = 1-(1-u)^power"},
        "trajectory_samples": traj["frames"],
    },
    "marquee": {"direction": "+x (content moves right)", "model": "x(t) = x0 + c*t + A*(1-exp(-k*(t-1.1)))",
                "c_px_per_s": 143.3, "A_px": 408.2, "k_per_s": 0.826, "rms_px": 2.2,
                "sequence_left_to_right": ["Mercury", "Retool", "remote", "ARC", "Raycast", "runway", "ramp", "HEX",
                                           "Vercel", "descript", "Cash App", "Supercell"],
                "reveal": {"opacity_start": 1.05, "opacity_end": 2.33}},
}

(REF / "reference-metrics.json").write_text(json.dumps(metrics, indent=1))
print("wrote", REF / "reference-metrics.json")


# ---------- markdown tables ----------
def card_rows(frame: int) -> list[str]:
    row = next(r for r in cards_track if r["frame"] == frame)
    out = []
    for name in ["orange", "green", "black", "brown"]:
        v = row.get(name)
        if v and v.get("ok") and 0.5 < v["scale"] < 3:
            w, h = CARD_W * v["scale"], CARD_H * v["scale"]
            out.append(f"| {name} | {v['cx']:.0f} | {v['cy']:.0f} | {w:.0f}x{h:.0f} | {v['rot']:+.1f} | {v['scale']:.3f} |")
        else:
            out.append(f"| {name} | - | - | - | - | - |")
    return out


for f in [30, 90]:
    print(f"\n#### Cards at f{f:03d} (t={f / 30:.2f}s)\n| card | cx | cy | w x h | rot deg | scale |\n|---|---|---|---|---|---|")
    print("\n".join(card_rows(f)))

for f in [162, 198, 225, 255]:
    r = next(x for x in bento if x["frame"] == f)
    print(f"\n#### Bento tiles at f{f} (t={f / 30:.2f}s) — connected-component bounds (±2px AA/shadow)")
    print("| tile | x | y | w | h |\n|---|---|---|---|---|")
    for k, v in r["tiles"].items():
        print(f"| {k} | {v['x']} | {v['y']} | {v['w']} | {v['h']} |")
