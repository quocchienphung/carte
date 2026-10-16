# ROCO.BANK — GEMINI WEBSITE RECONSTRUCTION MASTER PROMPT PACK

**Reference:** https://dribbble.com/shots/25558499-Digital-Banking-Landing-Page-Website  
**Primary evidence:** user-supplied `original-82f725aa0151e56f57ecf6c3f7502aac.mp4` (attach/copy into repo as `references/roco-bank-reference.mp4`).  
**Video metadata:** 1600 × 1200, 30 fps, 9.8 s, H.264.  
**Goal:** reconstruct a real, accessible, responsive, component-based webpage with high perceptual fidelity to reference composition AND motion. No whole-page screenshot, video as UI, giant raster overlays, or screenshot collages.

## How to use
1. In a coding-enabled Gemini environment, supply the source video, Dribbble URL, and writable project directory.
2. Paste **Prompt 00** once (project constitution), then **Prompts 01–08** in order. After each phase, require the deliverables; do not skip failed quality gates.
3. The timestamps and dimensions below are **observations/initial estimates**, not exact source CSS. The agent must inspect video frames and compute measurements instead of blindly copying them.
4. Motion shown in the MP4 is ground truth; interactive behavior not visible in the MP4 is an inference and must be marked as such.

---

# PROMPT 00 — SYSTEM-LEVEL RECONSTRUCTION CONTRACT

You are the principal design engineer, motion designer, frontend architect, animation forensic analyst, and independent QA lead on this project. Your mission is to RECONSTRUCT—not merely be inspired by—the user-provided 9.8-second Roco.bank Dribbble video as a real website.

AUTHORITATIVE REFERENCES, in descending order: (1) actual frames of the user's MP4, (2) verified original assets/source from the Dribbble project or authorized download, (3) legible design notes, (4) carefully labeled inference. Never claim an assumption is a verified fact. Never invent unseen webpage sections or interactions as if they appeared in the reference.

NON-NEGOTIABLE ENGINEERING RULES:
- Use real DOM elements and separately editable/reusable components for header, buttons, hero lines, text, logo marks, layered cards, card texture/image surfaces, testimonial pills, partner logos, section transition, bento tiles and their inner typographic layers. You may use individual legitimate product/artwork assets inside cards; NEVER use an entire screenshot or frame as the actual site UI.
- Never embed/play the reference video as the implemented website; the video is only for measuring and visual regression testing.
- No generic fintech stock imagery, mismatched cards, random gradients, inaccurate typography, emoji icons, fake logos, or generic template layouts.
- Preserve actual Roco.bank labels, visual ordering, dominant shapes, overlaps, crop, masks, margins, spacing, hierarchy, and negative space; ensure all main states match across the whole film, not just the hero's first frame.
- Build a deterministic 9.8-second replay that can be inspected at arbitrary time positions without waiting or guessing. Support a normal accessible interactive mode separately. Ensure `?demo=1&t=5.4` (time in seconds) or an equivalent documented stable API renders precisely that timestamp for screenshots.
- Favor performance: use transforms and opacity for continuous movement, limited blur/filter use, raster artwork at sufficient resolution, appropriate `will-change`, no layout thrash and no expensive scroll listener work.
- Make responsible, legal use of assets; don't circumvent protection, and distinguish verified assets from recreated alternatives.
- Test with a real browser (e.g. Playwright + Chromium) and attach genuine screenshot paths, terminal outputs, issues, and repair logs. Never write 'tested' unless a real test was executed.

SUGGESTED STACK: React + TypeScript + Vite (or existing repository framework; do not replace an established stack needlessly), semantic HTML, CSS Modules or clean scoped CSS, GSAP for the orchestrated intro/scene transitions; GSAP Flip OR Motion/Framer Motion for bento geometry (one ownership per animated property), Playwright for E2E/visual screenshots, FFmpeg+Python/Pillow or OpenCV for reference extraction and image comparison. Do not use two animation libraries to mutate the same DOM property's transform/layout simultaneously.

DELIVERABLES:
- A functioning project; `npm install`, `npm run dev`, `npm run build`, `npm run test`, `npm run test:visual` should be either working or correctly documented commands.
- `/references/`: original video, frame samples, analysis notes and measurements.
- `/src/`: isolated components, scoped styles, tokens, motion orchestration, typed content data, accessible controls.
- `/tests/`: browser tests, deterministic timeline capture, and automated comparisons.
- `/artifacts/visual-audit/`: real output screenshots, overlays/diffs, scores and an issue log.
- `RECONSTRUCTION_REPORT.md`: proven observations vs assumptions, source provenance, quality scores, known limitations.

Do NOT immediately begin coding. First perform the forensic phase in Prompt 01. If a tool is unavailable, state the exact blocker and construct a workable alternative; do not pretend the tool ran. Minimize commentary and maximize actual implementation/validation. Ask only if access to the attached video or project folder is genuinely blocked.

---

# PROMPT 01 — VIDEO FORENSICS: FRAME BY FRAME, NO GUESSWORK

Now inspect the actual attached MP4, NOT merely the Dribbble thumbnail. Record metadata with ffprobe. Extract keyframes (minimum): t=0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.4, 5.8, 6.2, 6.6, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5; plus denser 0.1s samples around detected motion boundaries. Build labeled contact sheets and inspect original full-resolution frames when text/edges are ambiguous.

At least these visual facts are visible in the supplied video and must be VERIFIED/measured before implementation:
- 1600×1200 video composition; pale gray outer stage, large inner white rectangular website with subtle rounded corners; later a nearly black inset canvas.
- Header logo and Roco.bank wordmark left; 'Wallet' outlined pill and 'Register' filled pill right; inverted colors in the dark scene.
- Hero left: subtle vertical up/down arrows, tracked uppercase 'CREATE YOUR OWN', two-line headline 'Roco.bank' / 'Professional bank card', descriptive paragraph, 'BUY CARD' dark pill and 'DISCOVER' gray pill.
- Hero right: FOUR overlapping photographic/art-directed bank cards forming an off-axis diagonal, with silver/orange ribbon top card, green botanical card, black/cream abstract card, and warm textured lower/right card. Card corners, micro-logo placement, simulated chip, texture and shadows matter.
- Near-invisible vertical oversized background text on the right edge; do not guess illegible wording; mark uncertain.
- Five avatar/number social proof pills arranged lower-right; muted horizontally arranged partner logo strip near the bottom.
- Transition from white hero to black bento composition around 4–5 seconds; verify if transition is scroll, mask, cover, or layout repositioning by examining actual frame samples.
- Bento is not 6 uniform cards: seven distinct editorial tiles: 'Credit for you!', '+390k / Customer to our bank card', 'OVER 300 / Companies trusted', 'AI bank', 'Easy pay', 'PAY METHODS / Payment / with over 10 methods', and 'Invested / $5.9m'.
- During about 6–8s bento card sizes change: Credit becomes temporarily taller, Companies shorter, AI/Easy and Payment/Invested redistribute widths, then elements return; quantify exact boundaries, easing and timing rather than assuming hover/scroll triggers.

OUTPUT A RECONSTRUCTION SPEC, not code yet:
1) Scene breakdown with start/end times and observations; 2) frame geometry table at 0s, 1s, 3s, 4.5s, 5.4s, 6.6s, 7.5s, 8.5s; record bounds (x,y,w,h) IN VIDEO PIXELS for important boxes; 3) viewport/stage scaling model; 4) DOM layer order and z-indices; 5) text inventory and confidence; 6) artwork inventory and confidence; 7) motion inventory per element (position, scale, rotation, opacity, blur, masks, text tracking, shadows, image-position, clipping); 8) measurable motion curves or a table of sampled positions; 9) uncertain points and exact evidence needed to disambiguate them.

Create `references/VIDEO_FORENSICS.md`, `references/keyframes/`, `references/contact-sheets/`, `references/reference-metrics.json`, and print the paths. Crucially, do NOT conflate the video frame's native resolution with the inner site's CSS viewport: explicitly model the presentation frame and its inset web canvas.

QUALITY GATE 01: I will not accept 'roughly', 'similar to', or superficial scene descriptions. Show measurable evidence for at least 2 scenes, four hero cards, seven bento tiles, and the transient bento layout.

---

# PROMPT 02 — ART DIRECTION, FONT IDENTIFICATION AND ASSET FIDELITY

Using the verified reference frames and the Dribbble project link, conduct ASSET FORENSICS before CSS implementation. Collect only public/legitimately usable design materials. Locate original exported background/card image assets if discoverable; preserve fidelity and document URLs/license/source. If no original asset is available, do not silently substitute stock images or a generic CSS gradient. Instead create a prioritized discrepancy record, then reconstruct artwork using independent layers, CSS/SVG/Canvas shader art as appropriate; do not paste any full-page screenshot into the UI.

Build an `assets-manifest.json` with each logical asset's desired appearance, source/provenance, format, pixel resolution, visible cropping, alpha, actual file path, fallback strategy and confidence. Treat the following as separate assets: logo icon, wordmark (text can be real text), top silver/orange card artwork, green organic card artwork, black/cream card artwork, textured fourth card artwork, card chip graphic, bento's stone/phone background, orange/gold credit artwork, patterned mesh/phone image, orange ribbon bento tile, black/cream abstract tile, green payment artwork, granulated investment tile, partner logo marks and avatar portraits.

FONT FORENSICS:
- Inspect actual font shapes (Roco.bank heading lowercase, geometric 'a', 'o', e, 'Professional', body width, numbers, buttons) and any legitimately accessible CSS/asset metadata. Do not declare a family based on vibe.
- Identify the closest licensed font from verified evidence, or generate an explicit short candidate comparison and label the chosen substitute as approximate.
- Measure font-family, font-style, weight, font-size, line-height, letter spacing, capitalization, line wrapping and block baseline at the reference viewport. Use browser-based text metrics and screenshots, not arbitrary CSS defaults.
- Match hero headline line breaks as shown; track spaced uppercase eyebrows; keep body copy readable and ensure light gray text portions are not accidentally opaque black.

Produce `src/styles/tokens.css` containing semantic color, type, spacing, radius, shadow, layering and scene tokens. A likely palette includes near-black, warm off-white, stone gray, orange, green and brown, but sample actual colors from target screenshots; do not hardcode guessed colors as absolute truths. Respect image texture and grain.

Quality gate 02: logo silhouette, all four card faces, major seven bento image surfaces, typography silhouette, image crops and copy placements must each have explicit assets or a documented recreation plan. A working app with wrong artwork is NOT done.

---

# PROMPT 03 — PRECISION LAYOUT AND INDIVIDUAL COMPONENT ARCHITECTURE

Implement visual structure only, without choreographing all animation yet. Use measured values from VIDEO_FORENSICS instead of default Tailwind typography and spacing. Preserve a 1600×1200 reference capture mode with a centered pale outer stage and inset site canvas; make adaptive behavior for other viewports without changing the reference baseline.

Suggested modular structure (adjust to existing repository, but preserve separation of responsibilities):

src/
  app/App.tsx
  components/Brand/LogoMark.tsx, Wordmark.tsx
  components/Navigation/SiteHeader.tsx, PillNavButton.tsx
  components/Hero/HeroScene.tsx, HeroCopy.tsx, HeroCards.tsx, BankCard.tsx,
      HeroDecorativeType.tsx, ScrollArrows.tsx, HeroActions.tsx,
      AvatarBadge.tsx, SocialProofCluster.tsx, PartnerMarquee.tsx
  components/Bento/BentoScene.tsx, BentoGrid.tsx, BentoTile.tsx,
      CreditTile.tsx, CustomerTile.tsx, TrustTile.tsx, AIBankTile.tsx,
      EasyPayTile.tsx, PaymentTile.tsx, InvestedTile.tsx
  components/Transition/SceneTransition.tsx
  motion/replayTimeline.ts, motion/heroMotion.ts, motion/bentoMotion.ts,
      motion/easings.ts, motion/reducedMotion.ts
  styles/tokens.css, styles/global.css
  data/heroData.ts, data/bentoData.ts
  hooks/useMotionPreference.ts

MANDATORY STRUCTURE:
- One isolated `BankCard` component per layer with its own surface, visual overlay, mask, bank logo and metadata; not one giant composite image of four cards. CSS transforms and z-index must be independently controlled.
- `SocialProofCluster` must render independent pills/avatars with measured positions and animation hooks; partner logos must be separate items.
- `BentoGrid` must use a deterministic measurable layout system allowing card dimensions to animate from layout A to B and back. Preserve unique per-tile overlays and image crop behavior.
- Use real button elements and anchors; controls require keyboard access, hover/focus and reduced-motion alternatives. Placeholder links may be explicitly documented; never pretend to have a backend.
- Keep content and artwork inventory in typed data separate from presentation, motion definitions separate from UI markup, all design tokens centralized.

STATIC QUALITY GATE 03: at least compare screenshots at initial hero target and dark bento resting state, and correct geometry before adding animation. Require a pixel measurement log for scene bounds, header horizontal positioning, headline coordinates, all bank card rectangles, all seven tile rectangles, internal text padding, gaps and radii. A match on desktop alone is not permission to ignore overflow in other viewports.

---

# PROMPT 04 — FRAME-MATCHED HERO ANIMATION (0–4 SECONDS)

Reconstruct the first 4 seconds frame-by-frame using a single controllable animation timeline. Reference frames—not generic animation presets—dictate the choreography. At t=0 and in the first ~1.5s, bank cards shift/scale/rotate and overlap dynamically; left headline, eyebrow, description, CTAs, badges and muted logo strip reveal with varying opacity and blur. By ~2s the hero stabilizes. Validate exact event times from sampled source frames.

ANIMATE SEPARATELY:
A) 4 bank card parent transforms: x, y, rotation, scale, transform-origin, stacking; independent depth shadow and soft clip; make visible the top card chip and Roco.bank logo, appropriate card corner radii. Avoid changing image DOM order as cards overlap.
B) Hero left eyebrow: tracked letter reveal; headline line 1 and line 2 stagger. Preserve line height and stable baseline, no text reflow during reveal.
C) Descriptive paragraph: staged visibility/soft-focus reveal; avoid applying an expensive permanent `filter: blur()` on a large layer.
D) CTA row: black and light neutral pills, stagger timing; preserve their actual widths and uppercase tracking.
E) Five avatar+amount pills: delayed, offset, staggered reveal, with orange and green emphasis only on applicable pills.
F) Partner wordmarks: very pale continuous horizontal shift/marquee if confirmed from consecutive frames, otherwise static logos with entrance only. Do not invent endless auto-scroll from a single screenshot.
G) faint right-side oversized vertical decorative lettering and up/down control accents.

Create named GSAP timelines or equivalent with independently adjustable start offsets and constants, e.g. `heroCardsEntrance`, `heroCopyReveal`, `ctaReveal`, `proofPillsReveal`, `logoStripReveal`. Expose a deterministic controller `seek(seconds)`, `play()`, `pause()`, `reset()` for reproducible visual capture. On `?demo=1&t=NUMBER`, time must be initialized BEFORE screenshot is taken; ensure fonts and assets are loaded, GSAP timeline fully rendered and no CSS load transition remains.

SAMPLE/CHECK at t=0, .4, .8, 1.2, 1.6, 2.2, 3.0, 4.0, plus all detected motion peaks. Easing must be derived from sampled coordinate changes; choose custom cubic-bezier or measured approximate spring only after comparative screenshots. Smooth is NOT a synonym for slow, floaty or overshooting. No fake 3D flings not shown in the reference.

QUALITY GATE 04: screenshot pairs must match silhouette, overlap, text visibility and card movement at at least 6 hero times; report each mismatch and repair. Do not continue until the hero can be scrubbed without flicker or jump.

---

# PROMPT 05 — SCENE TRANSITION + DYNAMIC 7-TILE BENTO (4–9.8 SECONDS)

Implement the complex second half of the video. First, reconstruct the actual white-to-black scene transition around 4–5s using observed boundary frames. Determine whether white scrolls away while the black panel rises, and how the header changes from dark-on-white to white-on-black; make it visually continuous. Respect outer gray border/presentation canvas, dark panel edges, and changes in section content positioning.

THEN IMPLEMENT SEVEN INDIVIDUAL BENTO COMPONENTS:
1) CREDIT — warm gray/orange particle artwork, live text `Credit` / `for you!`.
2) CUSTOMERS — panoramic monochrome stone texture, upper label `ROCO.BANK`, `+390k` and `Customer to our bank card`, large phone silhouette entering on right.
3) TRUST — near-black mesh/industrial photographic surface with a yellow/orange phone shape, small `OVER 300`, `Companies` / `trusted`.
4) AI BANK — orange-ribbon art and centered `AI bank`.
5) EASY PAY — black/cream/orange ribbon art with `Easy pay`.
6) PAYMENT — green botanical/transparent-card artwork, `PAY METHODS`, `Payment`, `with over 10 methods`.
7) INVESTED — beige/bronze granular cloud artwork, `Invested`, `$5.9m`.

Preserve asymmetric structure, NOT a basic 3-column regular grid. In a resting frame around t=5.4: left CREDIT is a shorter horizontal rectangle above a very tall TRUST; right top CUSTOMERS is a wide panoramic card; middle AI BANK and EASY PAY share a row; bottom PAYMENT and INVESTED share a row. In intermediary frames around t=6.6–7.5: CREDIT grows taller, TRUST becomes shorter, and middle/bottom row widths redistribute. Around t=8.5 the earlier layout substantially returns. Measure x/y/w/h and crop deltas at all these instants; these observations override any prior CSS assumptions.

Use a deterministic geometry interpolation system (e.g. GSAP Flip with explicitly recorded target grid states, or Motion layout with controlled state changes) with coherent shared edges/gaps. Layout changes must move and resize rounded boundaries, keep adjacent cards from overlapping, adjust image scale/position and typography positions within their masks, and avoid content jumps or text stretching. You may need separate layers for image/picture, overlay gradient, text and mask inside each tile; animate each only if it moves in the source video.

Do not guess that these changes were triggered by hover, autoplay, or scroll. Implement the video replay behavior exactly, then provide interactive enhancement in normal mode where the same morph can be user-triggered by accessible pointer and keyboard interactions (mark this added behavior clearly as inferred). Reduced-motion mode uses meaningful stable states.

CHECK FRAME COMPARISONS at t=4.0, 4.3, 4.6, 4.9, 5.2, 5.4, 6.0, 6.6, 7.2, 7.5, 8.0, 8.5, 9.5. Print bounding box tables, card gaps, text x/y offsets and mask/image crop evidence. The job is NOT complete if it only looks correct at 5.4s.

---

# PROMPT 06 — AUTOMATED SCREENSHOT REFERENCE TESTS: REAL CHROMIUM REQUIRED

Act as an independent visual regression engineer. You MUST run the site in a real browser and screenshot it. Create `tests/capture-reference.mjs` or Python equivalent to extract exact target frames from the provided MP4 (via ffmpeg) into `references/keyframes`. Create a Playwright capture script that launches Chromium at EXACT viewport 1600×1200, deviceScaleFactor=1, reducedMotion='no-preference', waits for `document.fonts.ready`, all images to decode, and the app's deterministic timeline seek completion, then saves one PNG per timestamp.

REQUIRED CHECKPOINTS: 0.0, 0.4, 0.8, 1.2, 1.6, 2.2, 3.0, 4.0, 4.3, 4.6, 5.0, 5.4, 6.0, 6.6, 7.2, 7.5, 8.0, 8.5, 9.5. Repeat at least the initial hero and resting bento frames for 1440×900 and 1920×1080; also audit at mobile widths 390 and 430, tablet 768 or 820. For mobile reference, do not invent pixel-perfect source comparisons because the video contains only a desktop composition; enforce visual integrity and intentional responsive design instead.

Construct image comparison outputs:
- reference PNG,
- screenshot PNG,
- aligned 50/50 alpha overlay PNG,
- 2× difference-enhanced PNG,
- optional SSIM/edge-map scores per frame, plus notes on image and typographic alignment.

IMPORTANT COMPARISON RULE: do not mask out large incorrect regions, do not warp screenshots to fake alignment, and do not use quality metrics alone to declare success. If video frame contains a gray presentation mat and the live site screenshot does not, that is an implementation discrepancy to fix in reference playback mode, not a difference to hide. Preserve whole-frame comparisons AND optionally region-level crops for hero, bank card surfaces, pills, header and bento.

Prioritize repair with an objective ranking: (1) wrong/missing artwork, (2) structural geometry and clipping, (3) typography and font metrics, (4) animation timing and curves, (5) visual effects/contrast/shadows, (6) micro-details. Use the first 5 biggest discrepancies from every cycle. Fix them in code, rerun screenshots, and demonstrate before/after measurements. Execute at least THREE meaningful visual audit/repair cycles; keep commits or a change log. If a real browser/tool is unavailable, state which step you cannot perform; NEVER fabricate screenshots, test results, or percentages.

QUALITY GATE 06: No declaration of 'pixel perfect' without evidence and concrete saved screenshots. Require proof of tests in artifacts with exact filenames, working capture command and outcomes.

---

# PROMPT 07 — ADVERSARIAL DESIGN QA + MOTION PERFORMANCE

Forget who built this site and review it as an adversarial external design director. The goal is to find things a coding model may have glossed over.

INSPECT:
- typography: headline shapes, line breaks, baseline drift, tracking, faux fonts, text clipping, illegible contrast;
- hero cards: card corner curves, tilt angles, imperfect perspective, texture resolution, logo/chip alignment, shadows, stacking, visibility of fourth card at all times;
- choreography: missing in-between frames, pop-in, sudden jump, overshoot not in the video, long pauses, scene boundary flicker, blur artifacts;
- bento: count=7; distinct visible art per tile; correct relative heights/widths for at least states 5.4, 6.6, 7.5, 8.5; changing crop and independently positioned text; no stretching/stutter;
- presentation framing: gray mat, white inner canvas, near-black dark panel, outer margins and corner treatment;
- functionality: click, keyboard navigation, focus states, routes, scroll behavior, playback controls/devtools exposed only appropriately;
- page ergonomics: responsive 390, 430, 768, 1440, 1600, 1920; zero horizontal overflow; mobile supports reduced animation and non-overlap;
- accessibility: prefers-reduced-motion, color contrast, aria-labels, semantic landmarks, meaningful links;
- performance: animation FPS around reference desktop viewport, image layout stability, LCP and excessive GPU layers, console warnings, runtime exceptions;
- ownership: no screenshot-as-component, video-as-background, giant hard-coded DOM div or single-file application, junk assets, dead-end buttons.

Run automated and manual tests. Classify every issue P0 visual-architecture blocker, P1 materially visible difference, P2 polish. Write `artifacts/visual-audit/ADVERSARIAL_FINDINGS.md` with evidence screenshot paths and precise fixes. Fix all P0/P1 items and retest, then produce a concise P2 backlog. If source art/font prevents a near-identical match, explicitly report that limitation rather than claiming success.

---

# PROMPT 08 — FINAL INTEGRATION, REPLAY, QUALITY REPORT AND HANDOFF

Perform an end-to-end release audit rather than merely narrating what was done.

Run install/build/typecheck/lint/unit tests/e2e tests/visual regression and validate actual browser playback through 9.8 seconds. Check hard reload, slow network cache miss, direct link with query params, mobile, reduced motion, keyboard-only navigation, asset fetch errors and screenshot reproducibility. Confirm the rendered site does not display the reference MP4 as its content or any screenshot of the whole page. Confirm it has discrete components for the logo, header, hero copy, four bank cards, badges, partner brands, scene transition and seven bento tiles.

Output a verified final inventory:
- Full git/project directory structure.
- Exact commands to start/deploy/test.
- Screenshots at 0s, 1.2s, 3s, 4.6s, 5.4s, 6.6s, 7.5s, 8.5s, 9.5s.
- Reference-vs-output overlays and explicit success/failure notes.
- Motion implementation details, timeline control and animation durations.
- Fonts and artwork provenance; assets still approximated.
- Remaining known discrepancies with severity and next exact code change.
- Proof of build/test commands executed, not claimed.

Write `RECONSTRUCTION_REPORT.md`, `COMPONENTS.md`, `MOTION_SPEC.md` and update README. Completion criteria: a real modular site, matching both scenes and intermediate motion states, functioning and tested. Do not call it '100% identical' where proof is missing. If there are failures, continue repair within the task instead of asking permission to address ordinary fixable problems.

---

# RECOVERY PROMPTS (PASTE WHEN NEEDED)

## A — If Gemini makes a generic fintech template
STOP. The current implementation is generic and does not replicate the reference. Do not add more features. Re-open 0s, 1.2s, 5.4s, 7.5s source frames at full resolution and enumerate the top 10 visual discrepancies. Correct composition first: stage, card artwork and overlaps, type silhouette, 7-tile asymmetric grid, and changing geometry. Screenshot after each group of repairs. Do not claim improvement without actual side-by-side comparison. Remove decorative elements absent from source.

## B — If Gemini skips screenshot tests
Do not proceed. Your previous response described tests but did not execute them. Launch the dev server, start Playwright Chromium, save real screenshots at 0.0, 1.2, 5.4, 6.6, 7.5, 8.5, and create side-by-side overlays with extracted source frames. Print file paths and terminal results. If Chromium is not installed, install browsers with the documented Playwright command; otherwise report the exact blocker. Never invent evidence.

## C — If hero is correct but dark grid is wrong
Freeze the hero. Focus ONLY on BentoScene and the 7 tile components. Measure bounding boxes from reference frames at 5.4, 6.6, 7.5, 8.5. Replace generic CSS grid with a controlled geometry interpolation system. Credit tile height and Companies tile height must change inversely; corresponding mid/bottom widths redistribute smoothly, textures remain correctly clipped, each text element keeps its independent layout. Capture 4 timestamped screenshots and compare.

## D — If animation is jittery or visually fake
Stop adding entrance effects. Identify which DOM properties change per frame. Measure frame-to-frame rectangle positions for four hero cards and seven bento tiles and plot their trajectories. Replace arbitrary springs and magic delays with deterministic keyframes/easing approximations derived from motion samples. Guarantee no layout thrashing, consistent transforms, single animation ownership, and stable playback seeking; compare t=0.4, 0.8, 1.2, 6.6, 7.5 and 8.5.

## E — If text/font or art is still wrong
The mismatch is not solved by CSS polish alone. Inspect the reference video crops at native resolution and verify source provenance. Compare text line widths, glyphs and word wrapping; choose font based on measurements, not aesthetics. Replace placeholder stock images with actually matching source art or closely rebuilt independent card/tile artwork. Keep a transparent list of approximations. Rerun reference overlays.

## F — Force proof instead of reassurance
Your statement of completeness is not evidence. Provide the last 3 test runs, exact commands, 9 screenshot paths and associated reference frames, per-frame difference notes, unresolved P0/P1 list, and concrete fixes made. If files do not exist, execute the real tests now. Never state 'pixel perfect' as an unsupported claim.

---

# Observed design reference notes (human-verifiable)

- First portion: white on near-gray presentation frame; top-left Roco.bank icon/wordmark and top-right Wallet/Register; four layered off-axis bank cards on right with orange, green, black/cream and brown photographic surfaces; huge airy left headline, eyebrow, paragraph, two CTAs, right-aligned avatar amount pills and muted brand logos.
- Second portion: near-black background, white Roco.bank branding, seven asymmetrically sized tiles with high-contrast photographic textures; the shape distribution dynamically expands and contracts.
- The 9.8s video does not prove how real users trigger its animation. Implement a faithful demo timeline and separate accessible inferred interactions.
- If source project files are unavailable, exact font IDs, original 3D artwork and fine motion curves are uncertain. Measure and document instead of inventing.
