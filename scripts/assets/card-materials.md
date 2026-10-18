# Polished bank-card textures

Edited on 2026-10-18 with the built-in `image_gen` tool. Each existing card image
was supplied separately as its edit target. Output dimensions returned by the tool
were **1595 × 986** for each card (the requested 2640 × 1632 was not returned).
Exported at native resolution using Sharp WebP quality 96, effort 6 and smart
subsampling. No artificial upscaling. The app uses `unoptimized` images to avoid
a second lossy conversion, with a version query to refresh previously cached faces.

## Final assets

- `public/sites/roco-bank/cards/vietcombank.webp`
- `public/sites/roco-bank/cards/techcombank.webp`
- `public/sites/roco-bank/cards/vib.webp`
- `public/sites/roco-bank/cards/vietinbank.webp`

Originals are backed up outside the repository at
`C:\Users\quocc\Downloads\carte-card-originals-20261018`.

## Research references

- [Vietcombank: specialized Priority products](https://www.vietcombank.com.vn/vi-VN/KHUT/San-pham-chuyen-biet)
- [Techcombank Priority Visa Signature](https://techcombank.com/khach-hang-ca-nhan/chi-tieu/the/the-tin-dung/techcombank-priority-visa-signature)
- [VIB One Card](https://www.vib.com.vn/vn/the-tin-dung/vib-one-card/)
- [VietinBank Visa Signature](https://www.vietinbank.vn/en/vietinbank-visa-signature-20-html)

The generated textures follow the supplied website artwork. Gold VISA Signature
on VietinBank is the user's requested visual customization.

## Exact prompt set

Each call concatenated the common prompt below with its card-specific paragraph.
All four calls used `transparent_background: false` and the corresponding local
WebP file as the single `referenced_image_paths` edit target.

### Common prompt

```text
Use case: precise-object-edit. Edit the supplied single bank-card face texture for a live website. Preserve the exact existing design, every logo, typography, word, symbol, ornamental geometry and their positions. Output a high-resolution 2640x1632 landscape rectangular full-bleed FLAT FRONT FACE texture with exactly the same 440:272 aspect ratio; the face covers every pixel edge to edge, with square outer canvas corners (CSS will round them). Orthographic straight-on, zero perspective, zero rotation, zero card thickness, no cast shadow, no scene, no mockup, no border, no padding. Upgrade material realism and crispness: razor-sharp readable typography and fine linework, realistic physically plausible PVD metal foil with narrow bright softbox reflections, dark metallic midtones and delicate bevel highlights within the existing gold/silver shapes. A fine restrained matte black substrate. No blur, no bloom, no added glitter, no scratches, no new text, no chip or numbers added, no invented motifs. Keep the base background predominantly deep black.
```

### Vietcombank

```text
Preserve verbatim "Vietcombank", "PRIORITY", "VISA", "Signature", the exact existing dragon engraving and contactless mark. All existing pale gold areas should become polished warm champagne gold chrome, visibly reflective yet elegant. Dragon lines must remain very fine and separated, no thickening or simplification.
```

### Techcombank

```text
Preserve verbatim "TECHCOMBANK", "PRIORITY", "VISA", "Signature" and exact diamond mark and thin geometric background lines. Gold lettering and gold faceted central diamond should read as polished champagne gold chrome; retain every crisp triangular facet with realistic reflected dark brown/bright cream contrast, no random extra crystals.
```

### VIB

```text
Preserve verbatim "VIB", the flower mark, "ONE" with faceted round gemstone replacing O, "VISA", "Signature". Keep all metal SILVER/PLATINUM chrome, not gold. Keep dark charcoal finely textured substrate. Render extraordinarily sharp silver lettering, realistic polished metal bevel reflections and crisp optical diamond facets. Preserve the original restrained thin N and three horizontal E bars.
```

### VietinBank

```text
Preserve verbatim "VietinBank" at upper right and its circular logo, the THREE existing five-point filigree stars at right, both payment/contactless icons on left, and the dark subtle ornamental band at lower left. Crucial requested change: BOTH "VISA" AND "Signature" at bottom right must be polished GOLD CHROME rather than white. Match them to the warm gold of the VietinBank logo and three stars. Existing gold logo and star filigree should be sharp polished champagne gold. Preserve every existing star position and size, do not add stars.
```

## Verification

- `npm run check`: lint, TypeScript and production build passed.
- Chromium at 1440 × 900 and 390 × 844, DPR 2: all four faces decoded at native
  resolution, no page errors and no horizontal overflow.
- Desktop and mobile screenshots are local ignored output under
  `artifacts/visual-audit/cards-polished/`.
