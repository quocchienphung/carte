# Roco.bank — Video Forensics & Reconstruction Spec (Prompt 01)

Source: `references/roco-bank-reference.mp4` (copy of `docs/roco-bank-reference.mp4`).
Every number below was measured from decoded frames with the scripts in `scripts/forensics/`
(Python 3.9 + OpenCV 4 / NumPy / SciPy in `.venv-tools`). Frame index `n` ↔ time `t = n / 30`.
"Inference" marks anything not directly visible.

## 0. Metadata (ffprobe)

| field | value |
|---|---|
| container | MP4, 9.800 s |
| video | H.264 Main, yuv420p, 1600×1200, 30/1 fps, 294 frames, ~3.99 Mb/s |
| audio | AAC LC (ignored) |
| GOP | I-frames every 60 frames (f030, f090, f150, f210, f270 show tiny re-encode blips in the motion-energy trace; not motion) |

Frame extraction: `ffmpeg -i references/roco-bank-reference.mp4 -fps_mode passthrough f%03d.png` (all 294),
and `node tests/capture-reference.mjs` (frame-accurate `select=eq(n,N)` → `references/keyframes/ref_t*.png`,
verified byte-identical to the full extraction).

## 1. Scene breakdown (from per-frame motion energy, `measure_canvas.py`)

| scene | frames | time (s) | evidence |
|---|---|---|---|
| Poster | f000–f001 | 0.000–0.066 | Static thumbnail: hero at rest, but card poses differ (green −1.0°, brown −0.45°, scale 0.987), green card shows a different art crop, deco text ~60 px higher. **Hard cut** at f002 (motion energy 29.9). |
| Hero intro | f002–f084 | 0.067–2.80 | Canvas zoom-out 1.106→1.0, cards fly in from the right, copy reveals (typewriter, asterisk scramble, blur-rise), pills, divider draw, marquee boost. Energy decays monotonically to 0.07 at f084. |
| Hero rest | f085–f106 | 2.83–3.53 | Only the partner marquee moves (logo band energy ≈2.0, everything else 0.00). |
| Transition | f107–f150 | 3.57–5.00 | Real page scroll of exactly 1024 px (one canvas height). Dark section rises from y=1112 to y=88. Cards scroll at 0.87× (parallax). Header stays fixed and inverts along the dark edge. Bento tiles scale in (staggered). |
| Bento A | f151–f164 | 5.03–5.47 | Static. |
| Morph A→B | f165–f202 | 5.47–6.76 | 3 staggered groups resize; 6 tiles dim to ~50 %. |
| Bento B | f203–f219 | 6.77–7.30 | Static. |
| Morph B→A | f220–f257 | 7.30–8.57 (tail to ~8.85) | Reverse, same group order. |
| Bento A | f258–f293 | 8.60–9.77 | Static to the end. |

Contact sheets: `references/contact-sheets/` — `full_0.5s.png`, `intro_f000-f035.png`, `intro_f036-f071.png`,
`copy_reveal_f002-f056.png`, `pills_f014-f077.png`, `header_f002-f041.png`, `transition_f104-f151.png`,
`morph_f160-f262.png`.

## 2. Presentation frame vs. web canvas (scaling model)

* Stage mat: vertical gradient #f1f1f1 (top) → #e7e7e7 (bottom corners) / #e1e1e1 (bottom centre).
* Inset web canvas at rest: **x=80, y=88, w=1440, h=1024**, corner radius ≈4 px. Hero background #ffffff,
  bento background #111111. 1440×1024 at the reference capture = **1 CSS px per video px** inside the canvas.
* The canvas (and all page content except the header) is uniformly **zoomed about frame point (800, 600)**
  during the intro: scale 1.0977 at f002 (canvas 9..1591 × 38..1162) → 1.0 at f027–f029.
  Fit: `from 1.1063, start 0.030 s, duration 0.912 s, cubic-bezier(0.222, 0.428, 0.296, 0.911)`, rms 0.0005.
  Verified on the eyebrow (pred. x 157.7 vs measured 157 at f012), arrows (dx −44 at f005 predicted −44),
  headline, paragraph, CTAs, pills, deco text: residual dx ≈ 0 after removing the zoom.
* Cards are **not clipped** by the canvas (top card overhangs the mat above y=88 at rest; during the
  intro cards cross the right mat).
* Header is **not** part of the zoom (logo x stays 138 at every frame).

Implementation consequence: a `ReferenceStage` (1600×1200 mat) containing a 1440×1024 canvas; all layout
in canvas CSS px; replay mode scales the stage to the viewport (scale 1 at 1600×1200).

## 3. DOM layer order (bottom → top), inferred from occlusion

1. Stage mat
2. Canvas background (white hero) — clips page content (deco text is clipped at canvas edge)
3. Deco vertical text "Personal + Business" (under pills and cards)
4. Hero copy (arrows, eyebrow, headline, paragraph, CTAs, divider, logo strip)
5. Social-proof pills (over deco text)
6. Hero cards: brown < black < green < orange (orange on top); *not* canvas-clipped
7. Dark bento section (rises over hero copy **and** over cards: f120 dark top 913 cuts the cards' scroll path)
8. Header (fixed, transparent; content scrolls *under* it — f126 shows headline above the header row);
   Wallet/Register render **above** the orange card (f004–f016 montage)
9. Header dark-theme copy, clipped to the dark section region (per-pixel split, f137–f139)

## 4. Geometry tables (video px)

### 4.1 Hero at rest (f085; identical f085–f106)

| element | x | y | w | h | notes |
|---|---|---|---|---|---|
| logo mark | 138 | 137 | 36 | 40 | 6-blade pinwheel/asterisk mark |
| wordmark ink | 191 | — | 98 | — | "Roco.bank", ~20 px regular |
| Wallet pill | 1260 | 137 | 91 | 40 | white, 1 px light border |
| Register pill | 1359 | 136 | 105 | 41 | black, white text |
| arrow ↑ | 176 | 445 | 17 | 18 | light gray |
| arrow ↓ | 192 | 482 | 16 | 17 | black |
| eyebrow | 176 | cap 547 | 200 | 10 | "CREATE YOUR OWN", wide tracking |
| headline L1 | 180 | cap 596 | 281 | 46 | "Roco.bank" ("Roco" medium, ".bank" light) |
| headline L2 | 180 | cap 665 | 596 | 46 | "Professional"(180–490) "bank"(512–645, medium) "card"(663–776) |
| paragraph | 177 | 750/774/798/822 | ≤602 | 4 lines | 24 px pitch; L3 mid-gray, L4 light gray |
| BUY CARD | 176 | 876 | 132 | 32 | #000 pill, white tracked caps |
| DISCOVER | 316 | 876 | 132 | 32 | #efefef pill |
| divider | 176 | 955 | 752 | 2 | #f5f5f5 |
| logo strip | 60–940 | 990 | — | 50 | edge-faded marquee, pitch 147.5 px |
| pill Walentyna | 1102 | 856 | 248 | 58 | orange gradient (#fbab5c→#f7b471) |
| pill Sławomira | 985 | 929 | 237 | 56 | #f6f6f6 |
| pill Haleema | 1229 | 929 | 236 | 56 | #f6f6f6 |
| pill Patrick | 1026 | 1001 | 220 | 56 | #f7f7f7 |
| pill Brandon | 1252 | 1001 | 172 | 56 | green gradient (~#98af7a) |
| deco text | ~1355–1455 | full height | — | — | rotated −90°, "Personal" outline + "+ Business" solid, ~#ececec |

### 4.2 Hero cards (rectangles fitted from edge gradients + RANSAC; `card_corners.py`)

All four cards are true rectangles (adjacent edges ⟂ within 0.1°; no perspective) of **440×272 px**
(1.618:1), corner radius ≈18 px.

| card (z top→bottom) | rest centre (f085) | rest rot | poster centre (f000) | poster rot |
|---|---|---|---|---|
| orange ribbon / silver | (774.5, 198.7) | +7.97° | (774.5, 198.3) | +7.97° |
| green botanical | (871.6, 327.4) | +9.01° | ≈(867, 327) | +8.03° (scale 0.987) |
| black/cream | (1043.9, 449.2) | +10.03° | ≈(1046, 450) | +9.33° |
| brown textured | (1134.3, 583.5) | +10.01° | ≈(1136, 580) | +9.56° (scale 0.987) |

SIFT similarity tracking (`track_cards.py`, 49–501 inliers per card per frame), sample instants:

| t | orange (cx, cy, rot, s) | green | black | brown |
|---|---|---|---|---|
| 0.067 (f002, blur-fit) | 1936, 618, −10.1°, 2.48 (blur 51 px, α 0.31) | off-screen | off-screen | off-screen |
| 0.40 (f012, blur-fit) | 1185, 333, −0.1°, 1.68 (blur 7.6, α 0.87) | 1456, 637, +12.1°, 0.91 | — | — |
| 1.00 (f030) | 855, 226, +3.7°, 1.239 | 1094, 442, +10.5°, 0.989 | 1352, 590, +11.9°, 0.942 | 1623, 730, +12.7°, 0.747 |
| 3.00 (f090) | 774, 199, +8.0°, 1.000 | 872, 327, +9.0°, 0.999 | 1044, 449, +10.1°, 0.999 | 1134, 584, +10.0°, 0.998 |
| 4.00 (f120) | 774, 26 (scroll −173) | 872, 155 | 1044, 277 | 1134, 411 |

### 4.3 Bento layouts (edge probes, `edge_probe.py` / `bento_trajectories.py`; authoritative)

| tile | layout A (x, y, w, h) | layout B (x, y, w, h) | Δ |
|---|---|---|---|
| Credit "Credit / for you!" | 176, 240, 358, 224 | 176, 240, 358, **424** | h +200 |
| Trust "OVER 300 / Companies trusted" | 176, 488, 358, 544 | 176, **688**, 358, **344** | top +200 |
| Customers "ROCO.BANK / +390k / Customer to our bank card" | 558, 240, 866, 312 | unchanged | — |
| AI bank | 558, 576, 358, 168 | 558, 576, **458**, 168 | w +100 |
| Easy pay | 940, 576, 484, 168 | **1040**, 576, **384**, 168 | left +100 |
| Payment "PAY METHODS / Payment / with over 10 methods" | 558, 766, 484, 266 | 558, 766, **334**, 266 | w −150 |
| Invested "Invested / $5.9m" | 1066, 766, 358, 266 | **916**, 766, **508**, 266 | left −150 |

Gap 24 px everywhere; content box x 176–1424 (96 px side padding), y 240–1032. Middle and bottom rows are
mirror images in A (358|484 / 484|358). Auto connected-component bounds at 5.4 / 6.6 / 7.5 / 8.5 s
(±2–4 px from AA + drop shadow; Trust in B merges with its own black artwork, use the probe table):

| t | credit | trust | ai | easy | payment | invested |
|---|---|---|---|---|---|---|
| 5.4 (f162) | 176,240,360,224 | 176,487,360,545 | 552,576,366,168 | 938,576,488,172 | 552,764,496,268 | 1064,762,360,270 |
| 6.6 (f198) | 176,238,360,426 | (probe) 176,686,358,346 | 556,576,459,168 | 1039,576,387,168 | 556,762,338,272 | 912,760,514,274 |
| 7.5 (f225) | 176,239,360,425 | (probe) 176,686,358,346 | 558,576,454,168 | 1036,576,390,168 | 556,762,366,272 | 942,764,484,270 |
| 8.5 (f255) | 176,239,360,231 | 176,487,360,546 | 554,576,364,168 | 936,576,490,168 | 554,764,488,268 | 1064,760,362,274 |

### 4.4 Transition (t = 4.5 s, f135, S = 919 px)

Dark section top y = 193; header still dark-on-white; tiles at their final grid position offset by
(1024 − S) = 105 px, scaled: credit 0.70, trust 0.73, customers 0.76, ai 0.81, easy 0.85, payment 0.87,
invested 0.85 (`bento_entrance.json`).

## 5. Text inventory

| text | location | confidence |
|---|---|---|
| Roco.bank | header wordmark, headline L1, card logos (×4), Customers eyebrow "ROCO.BANK" | high |
| Wallet / Register | header pills | high |
| CREATE YOUR OWN | eyebrow | high |
| Professional bank card | headline L2 | high |
| Roco.bank Introduces A Bank Card Crafted For Professionals Who Demand / Excellence. Built With Innovative Features, From Real-Time Controls To Secure / Digital Payments, This Card Is The Perfect Companion For Your Fast-Paced / Lifestyle With Modern Tools, Contactless Payments. | paragraph (Title Case, 4 lines exactly as wrapped) | high |
| BUY CARD / DISCOVER | CTAs | high |
| Walentyna Wiśniewska $32,100.00 · Sławomira Kozłowska $6,899.00 · Haleema Sirin Antoun $68,899.00 · Patrick Frederiksen $29,000.00 · Brandon Hall $17,250.00 | pills (amounts in monospace) | high |
| Personal + Business | deco vertical text | high (reads bottom→top) |
| Mercury, Retool, remote, ARC, Raycast, runway, ramp, HEX, Vercel, descript, Cash App, Supercell | partner strip (left→right sequence) | high for names; marks are third-party trademarks |
| Credit / for you! | bento | high |
| ROCO.BANK / +390k / Customer to our **bank** card | bento | high |
| OVER 300 / Companies / trusted | bento | high |
| AI **bank** / Easy **pay** | bento | high |
| PAY METHODS / Payment / with over 10 methods | bento | high |
| Invested / $5.9m | bento | high |
| 9:41 (phone status bar inside Customers + Trust art) | artwork | part of raster art |

## 6. Artwork inventory

| asset | observed | plan / confidence |
|---|---|---|
| Orange card face | brushed silver metal + orange 3-D ribbon, EMV chip top-left, logo bottom-right | extract face from rest frame (fully unoccluded), overlay real logo; high |
| Green card face | green inflated/leaf forms + concrete, logo | composite face from frames where unoccluded (intro f011–f030 shows it separated from orange) ; medium-high |
| Black/cream card | black + cream folded ribbon, logo | composite from intro frames (f020–f060 partial reveals); medium |
| Brown card | orange/brown porous sculpture on gray, logo | composite from intro frames (f029–f060), lower-left hidden longest; medium |
| Card chip | embossed silver chip (orange card; faint on green) | part of face raster; medium |
| Logo mark | 6-stroke pinwheel | re-draw as SVG from 4× crops; high |
| Bento art ×7 | credit (stone + orange moss), customers (monochrome rocks + phone), trust (perforated mesh + yellow phone), ai (orange ribbon), easy (dark/orange/silver ribbons), payment (green glass/fabric), invested (bronze moss cloud) | extract from bento frames; union of A and B reveals gives larger-than-tile art; text removed via inpainting where it never moves; medium-high |
| Avatars ×5 | small circular portraits | crop from rest frame at 2× nearest available (≈44 px); low-res limitation |
| Partner marks ×12 | muted gray wordmarks | rebuild as simplified SVG/text approximations; third-party marks (documented) |

## 7. Motion inventory

### 7.1 Header (outside zoom)
`translateY +40→0` and `opacity 0→1`; logo first visible f008 (+38 px, α 0.05), y offset decays ~exponentially,
reaches 0 at f035; α 0.5 at f015, 1.0 at f038 (`elements.json` → `logo`). Blur ≤2 px for f008–f013. Nav pills
follow the same offset (f022 nav y 140 vs rest 137 ≈ logo +7).

### 7.2 Copy (inside zoom; residual = measured − zoom prediction; `fit_entrances.py`)

Model `dy = A·(1−u)^p`, `u = (t−start)/dur`:

| element | A (px) | start (s) | dur (s) | p | rms | blur | opacity |
|---|---|---|---|---|---|---|---|
| arrow ↑ | +8.8 | 0.208 | 0.73 | 1.86 | 0.18 | 0 | 0.36 at f005 → 0.97 f033 |
| arrow ↓ | −19.4 (descends) | 0.057 | 2.23 | 8 (expo) | 0.28 | 0 | 0.09 f002 → 1.0 f032 |
| eyebrow | typewriter | 0.067 | 1.0 | — | — | new char soft | 1 char / 2.14 frames |
| headline L1 | +11.3 | 0.425 | 0.71 | 2.19 | 0.16 | 2→0 by 0.77 s | gray→black |
| headline L2 | +10.4 | 0.642 | 0.72 | 2.15 | 0.21 | 2→0 by 0.97 s | gray→black |
| paragraph L1 | +38.7 | 0.460 | 0.96 | 2.84 | 0.43 | 3→0 by 0.97 s | 0→1 |
| paragraph L2 | ≈+38 | ≈0.68 | ≈0.93 | ≈2.6 | (contaminated, from L1/L3 pattern) | 3→0 by 1.10 s | |
| paragraph L3 | +34.5 | 0.961 | 0.98 | 3.22 | 0.23 | 3→0 by 1.33 s | |
| paragraph L4 | +27.5 | 1.227 | 0.77 | 2.26 | 0.39 | 2→0 by 1.57 s | |
| BUY CARD | +51.7 | 0.695 | 1.14 | 2.47 | 0.50 | 8→0 by 1.20 s | |
| DISCOVER | inference: like BUY CARD +0.27 s (first visible blurred f032) | 0.96 | 1.14 | 2.5 | — | | |
| divider | scaleX 0→1 from left | 1.05 | ≈1.0 | out | — | | extent 360 (f034) → 927 (f062) |
| pill 1 Walentyna | +75.1 | 0.720 | 1.68 | 5.75 | 0.40 | 5→0 by 1.13 s | |
| pill 2 Sławomira | +78.1 | 0.814 | 1.60 | 5.26 | 0.50 | 5→0 by 1.23 s | |
| pill 3 Haleema | inference: +78 | ≈0.93 | 1.6 | 5.3 | (tracker lost; visible f029 contact sheet) | | |
| pill 4 Patrick | +51.7 (fit tail) | 1.143 | 1.31 | 4.38 | 0.35 | 3→0 by 1.43 s | |
| pill 5 Brandon | +30.5 (fit tail) | 1.385 | 0.98 | 3.25 | 0.28 | 2→0 by 1.57 s | |
| logo strip | opacity 0→1 | 1.05 | 1.28 | linear | — | | |

Headline scramble (frame-exact, `headline_f002-f033.png`): word placeholders are gray asterisk groups
("****", "****", "*********", "****", "****") appearing at f002, f003, f009, f012, f015, each darkening
#ddd→#444 over ~0.3 s; words resolve at **f013 "Roco." · f016 "bank" · f019 "Professional" · f022 "bank" · f026 "card"**,
each starting mid-gray and reaching full ink ≈0.15 s later.

Eyebrow typewriter frames: C f002 · R f004 · E f006 · A f008 · T f010 · E f012 · Y f016 · O f019 · U f021 ·
R f023 · O f027 · W f030 · N f032 (spaces consume a slot); the newest glyph is 50 % opaque / softly blurred for one frame.

### 7.3 Cards (`fit_card_motion.py`; per-property `v = rest + (from−rest)·(1−B(u))`)

| card | prop | from | start | dur | cubic-bezier | rms |
|---|---|---|---|---|---|---|
| orange | cx | 2318.4 | 0.004 | 1.807 | 0.067, 0.523, 0.117, 1.014 | 0.44 px |
| orange | cy | 640.2 | 0.051 | 1.804 | 0.062, 0.309, 0.009, 1.030 | 0.57 px |
| orange | rot | −9.66° | 0.067 | 2.112 | 0.148, 0.304, 0.000, 0.689 | 0.37° |
| orange | scale | 2.76 | 0.006 | 2.715 | 0.086, 0.678, 0.194, 0.987 | <0.005 |
| green | cx / cy / rot / scale | 1570.5 / 686.8 / 11.89° / 0.91 | 0.33 / 0.35 / 0.31 / 0.40 | 2.45 / 2.35 / 2.33 / 1.83 | see json | ≤0.27 px |
| black | cx / cy / rot / scale | 1638.5 / 726.1 / 13.78° / 0.87 | 0.59 / 0.61 / 0.62 / 0.70 | 2.19 / 2.18 / 2.30 / 1.55 | see json | ≤0.59 px |
| brown | cx / cy / rot / scale | 1727.2 / 741.4 / 12.88° / 0.70 | 0.85 / 0.95 / 0.89 / 0.96 | 1.91 / 1.80 / 2.31 / 1.71 | see json | ≤0.19 px |

Orange-card focus pull (analysis-by-synthesis fit, `fit_blurred_card.py`): blur 51.4 px (f002) → 35.9 → 29.4 →
24.9 → 19.4 → 16.1 → 13.4 → 10.9 → 8.8 → 10.0 → 7.6 → 6.5 → 5.0 → 2.9 (f015) → 0 by ~f019;
opacity 0.31 (f002) → 0.98 (f018). Green/black/brown enter sharp from beyond the right/bottom frame edge.
Transition: all cards translate only (rot/scale constant), offset = 0.87 × page scroll.

### 7.4 Page scroll / scene transition
`S(t) = 1024 · B((t − 3.500)/1.491)`, `B = cubic-bezier(0.610, −0.015, 0.252, 1.000)`, rms 0.37 px.
Not a mask or cover: hero copy, deco text and dark section all translate by exactly S (arrows −199 at f120 =
dark rise 199). Header fixed; dark copy of header clipped at the dark edge (per-pixel split visible f137/f138).
Cards ×0.87. Header colour: black-on-white → white-on-#111 (Register pill inverts to white with dark text,
Wallet border becomes ~#333).

### 7.5 Bento entrance (tiles scale 0→1, `bento_entrance.json`)
`scale = 1 − (1 − u)^p`: ai 3.986 s/0.943 s/p2.12 · easy 3.985/0.930/2.36 · customers 4.068/1.134/2.96 ·
credit 4.141/0.963/2.56 · trust 4.229/1.232/≈5 · payment 3.707/1.108/1.75 · invested 3.586/1.226/1.54
(payment/invested are below the visible area until ~f136, their early phase is extrapolated).
Transform origins: credit ≈ bottom-centre (y=464; residual dy +85→0), ai ≈ (+51 px, centre), others centre.

### 7.6 Bento morph (`fit_easing.py`, rms 0.008–0.009 in normalised progress)
Three groups, each a single tween driving rects **and** dim (`dim = 0.5·p`):
* A→B: `cubic-bezier(0.423, 0.109, 0.141, 1.0)`, 1.001 s; starts bottom 5.473, middle 5.593, left 5.757.
* B→A: `cubic-bezier(0.350, 0.116, 0.056, 1.14)`, 1.260 s; starts bottom 7.303, middle 7.428, left 7.594
  (≈2 px overshoot on the middle row, consistent with y2 > 1).
* Artwork does **not scale** (SIFT scale 1.000) and is fixed in page space (zero-shift NCC 0.97–0.998):
  credit anchored top, trust bottom, ai/payment left, easy/invested right; tile masks reveal/crop it.
* Text: credit/ai centred in tile; trust anchored top (+60 px); easy/invested anchored left; payment text
  shifts −28 px (left padding 54→26) — measured, origin of rule unknown.
* State-B dim: per channel `B = 0.49–0.53·A + bias`, bias 9 (trust, invested ≈#111 backing), 26–29
  (credit/ai ≈#363636–#383838), 22 (easy ≈#2e2e2e), 7 (payment); customers gain 1.000.

### 7.7 Partner marquee
Moves **right**. `x(t) = x0 + 143.3·t + 408.2·(1 − e^(−0.826 (t − 1.1)))` px (rms 2.2 px over f034–f115):
471 px/s at 1.13 s decaying toward 143 px/s. Logos centred in 147.5 px slots, edge fade on both sides
(left ≈60–400, right ≈700–940). Not visible after the scroll leaves the hero.

## 8. Remaining uncertainties & evidence needed

| # | uncertainty | evidence that would resolve it |
|---|---|---|
| 1 | Exact font families (headline neo-grotesk light/medium, mono amounts) | source Figma/fonts; currently chosen by rendered-glyph comparison (Prompt 02) |
| 2 | Original raster artwork resolution/source | Dribbble attachment or designer files; video crops limited to 1× and H.264 artefacts |
| 3 | Hidden card-face regions (green top-left, black left, brown lower-left) | they become visible only during the intro; composite may retain small gaps at the hidden corners |
| 4 | What triggers the morph and the transition | not observable — replay reproduces timing; interactive triggers are inferred (scroll for the transition, hover/focus for the morph) |
| 5 | DISCOVER, pill 3, paragraph L2 parameters | tracker contamination; values interpolated from neighbours |
| 6 | Poster frame (f000/f001) art variant | only 2 frames; reproduced as a separate static state |
| 7 | Payment text −28 px rule | single observation; implemented as measured |
| 8 | Card drop-shadow spec | estimated from the soft shadow below cards (Prompt 03 measurement) |

## 9. Quality-gate evidence summary (Gate 01)

* 2+ scenes measured: canvas zoom series (f002–f030), scroll series (f104–f151), bento A/B.
* 4 hero cards: rectangle fits + 1,100+ SIFT poses + early blurred fits (rms ≤0.6 px).
* 7 bento tiles: probe-exact layouts A/B, per-frame trajectories (`reference-metrics-bento-trajectories.json`),
  dim timelines (`reference-metrics-bento-dim.json`), fitted easings, entrance scale fits.
* Transient bento layout: edge trajectories every frame f150–f293.

Files: `references/reference-metrics.json` (consolidated), `references/reference-metrics-*.json` (raw),
`references/tracking/` (cards.json, elements.json, residuals, templates, corners), `references/keyframes/`.
