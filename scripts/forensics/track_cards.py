"""Track the four hero cards through the intro/transition with SIFT homographies.

1. Rectify each card face from the rest frame (corners from card_corners.py) into a
   440x272 template; occluded parts (under cards above it) are masked out.
2. For every frame, match template SIFT features to the frame and fit a similarity
   transform (rotation + uniform scale + translation) with RANSAC; also a full
   homography to check for perspective.
3. Output per-frame card centre, rotation, scale (vs. rest) and inlier count.

Usage: track_cards.py FRAMES_DIR CORNERS_JSON REST_FRAME OUT_JSON [first last]
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

W, H = 440, 272
ORDER = ["orange", "green", "black", "brown"]  # top -> bottom z-order


def poly(c: dict) -> np.ndarray:
    return np.float32([c["TL"], c["TR"], c["BR"], c["BL"]])


def main() -> None:
    frames_dir = Path(sys.argv[1])
    corners = json.load(open(sys.argv[2]))
    rest = cv2.imread(sys.argv[3])
    out_path = Path(sys.argv[4])
    first = int(sys.argv[5]) if len(sys.argv) > 5 else 2
    last = int(sys.argv[6]) if len(sys.argv) > 6 else 150
    canon = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    sift = cv2.SIFT_create(6000, contrastThreshold=0.02)
    templates = {}
    for i, name in enumerate(ORDER):
        P = poly(corners[name]["corners"])
        Hm = cv2.getPerspectiveTransform(canon, P)  # canon -> frame
        tex = cv2.warpPerspective(rest, np.linalg.inv(Hm), (W, H))
        mask = np.full((H, W), 255, np.uint8)
        # mask occluders (cards above) mapped into this card's canonical space
        for above in ORDER[:i]:
            Q = poly(corners[above]["corners"])
            qc = cv2.perspectiveTransform(Q.reshape(-1, 1, 2), np.linalg.inv(Hm)).reshape(-1, 2)
            cv2.fillPoly(mask, [np.int32(qc)], 0)
        mask = cv2.erode(mask, np.ones((9, 9), np.uint8))
        # shrink away from rounded corners/edges
        cv2.rectangle(mask, (0, 0), (W - 1, H - 1), 0, 8)
        kp, des = sift.detectAndCompute(cv2.cvtColor(tex, cv2.COLOR_BGR2GRAY), mask)
        templates[name] = (kp, des, Hm, tex, mask)
        cv2.imwrite(str(out_path.parent / f"card_template_{name}.png"), np.dstack([tex, mask]))
        print(name, "template keypoints", len(kp))

    rows = []
    bf = cv2.BFMatcher()
    for n in range(first, last + 1):
        img = cv2.imread(str(frames_dir / f"f{n:03d}.png"))
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        kf, df = sift.detectAndCompute(g, None)
        row = {"frame": n, "t": round(n / 30, 4)}
        for name in ORDER:
            kp, des, Hrest, _, _ = templates[name]
            if df is None or des is None or len(kf) < 10:
                continue
            m = bf.knnMatch(des, df, k=2)
            good = [a for a, b in (p for p in m if len(p) == 2) if a.distance < 0.75 * b.distance]
            if len(good) < 8:
                row[name] = {"ok": False, "matches": len(good)}
                continue
            src = np.float32([kp[a.queryIdx].pt for a in good])
            dst = np.float32([kf[a.trainIdx].pt for a in good])
            M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3.0,
                                                 maxIters=5000)
            if M is None or inl.sum() < 8:
                row[name] = {"ok": False, "matches": len(good)}
                continue
            scale = float(np.hypot(M[0, 0], M[1, 0]))
            rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
            centre = M @ np.array([W / 2, H / 2, 1.0])
            cs = cv2.transform(np.float32([[[0, 0]], [[W, 0]], [[W, H]], [[0, H]]]), M).reshape(-1, 2)
            Hh, hin = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
            persp = None
            if Hh is not None:
                persp = [round(float(Hh[2, 0] * 1e4), 3), round(float(Hh[2, 1] * 1e4), 3)]
            row[name] = {"ok": True, "inliers": int(inl.sum()), "matches": len(good),
                         "cx": round(float(centre[0]), 1), "cy": round(float(centre[1]), 1),
                         "rot": round(rot, 2), "scale": round(scale, 4),
                         "corners": [[round(float(x), 1), round(float(y), 1)] for x, y in cs],
                         "persp_e4": persp}
        rows.append(row)
        print(f"f{n:03d} " + " | ".join(
            f"{k}: " + (f"c=({v['cx']:.0f},{v['cy']:.0f}) r={v['rot']:+.1f} s={v['scale']:.3f} in={v['inliers']}"
                        if v.get("ok") else f"FAIL({v.get('matches')})")
            for k, v in row.items() if k in ORDER))
    json.dump(rows, open(out_path, "w"), indent=1)


if __name__ == "__main__":
    main()
