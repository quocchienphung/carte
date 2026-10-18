"""Estimate how each tile's artwork moves between bento states A and B.

SIFT features inside each tile (minus a text-safe margin) are matched between the two
frames and a similarity transform (scale + translation) is fitted with RANSAC.  Also
reports mean luminance / saturation per tile in both states (overlay changes).

Usage: tile_image_transform.py FRAME_A.png FRAME_B.png
"""

import json
import sys

import cv2
import numpy as np

A_RECTS = {
    "credit": (176, 240, 358, 224), "trust": (176, 488, 358, 544), "customers": (558, 240, 866, 312),
    "ai": (558, 576, 358, 168), "easy": (940, 576, 484, 168), "payment": (558, 766, 484, 266),
    "invested": (1066, 766, 358, 266),
}
B_RECTS = {
    "credit": (176, 240, 358, 424), "trust": (176, 688, 358, 344), "customers": (558, 240, 866, 312),
    "ai": (558, 576, 458, 168), "easy": (1040, 576, 384, 168), "payment": (558, 766, 334, 266),
    "invested": (916, 766, 508, 266),
}


def stats(img: np.ndarray, r: tuple[int, int, int, int]) -> dict:
    x, y, w, h = r
    sub = img[y + 8 : y + h - 8, x + 8 : x + w - 8]
    hsv = cv2.cvtColor(sub, cv2.COLOR_BGR2HSV)
    return {"lum": round(float(cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY).mean()), 1),
            "sat": round(float(hsv[:, :, 1].mean()), 1)}


def main() -> None:
    a = cv2.imread(sys.argv[1])
    b = cv2.imread(sys.argv[2])
    sift = cv2.SIFT_create(4000)
    result = {}
    for name in A_RECTS:
        ra, rb = A_RECTS[name], B_RECTS[name]
        # intersection of both rects = area visible in both states
        x0, y0 = max(ra[0], rb[0]), max(ra[1], rb[1])
        x1 = min(ra[0] + ra[2], rb[0] + rb[2])
        y1 = min(ra[1] + ra[3], rb[1] + rb[3])
        ma = np.zeros(a.shape[:2], np.uint8)
        mb = np.zeros(b.shape[:2], np.uint8)
        ma[ra[1] + 6 : ra[1] + ra[3] - 6, ra[0] + 6 : ra[0] + ra[2] - 6] = 255
        mb[rb[1] + 6 : rb[1] + rb[3] - 6, rb[0] + 6 : rb[0] + rb[2] - 6] = 255
        ka, da = sift.detectAndCompute(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), ma)
        kb, db = sift.detectAndCompute(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), mb)
        info = {"A": stats(a, ra), "B": stats(b, rb), "overlap": [x0, y0, x1 - x0, y1 - y0]}
        if da is not None and db is not None and len(ka) > 8 and len(kb) > 8:
            matches = cv2.BFMatcher().knnMatch(da, db, k=2)
            good = [m for m, n in (p for p in matches if len(p) == 2) if m.distance < 0.7 * n.distance]
            if len(good) >= 6:
                pa = np.float32([ka[m.queryIdx].pt for m in good])
                pb = np.float32([kb[m.trainIdx].pt for m in good])
                M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if M is not None:
                    s = float(np.hypot(M[0, 0], M[1, 0]))
                    rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
                    # where does the A-rect's top-left map to?
                    info.update({"matches": len(good), "inliers": int(inl.sum()), "scale": round(s, 4),
                                 "rot_deg": round(rot, 2), "tx": round(float(M[0, 2]), 1),
                                 "ty": round(float(M[1, 2]), 1)})
                    # fixed point (centre of scaling) if s != 1
                    if abs(s - 1) > 0.003:
                        I = np.eye(2) - M[:, :2]
                        fp = np.linalg.solve(I, M[:, 2])
                        info["fixed_point"] = [round(float(fp[0]), 1), round(float(fp[1]), 1)]
        result[name] = info
        print(name, json.dumps(info))


if __name__ == "__main__":
    main()
