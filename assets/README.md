# Cinematic asset guide

The opening is a real DOM/CSS experience. The floral frame, hinged doors, room, floating halo, and invitation remain independent layers. There is no table. Keep the invitation's paper and envelope flaps as HTML/CSS: one deliberate tap opens the suspended paper and reveals warm light before the seamless website transition.

There is no bride and no visible lettering anywhere in the cinematic entrance. The seal is floral ornament only. The names appear on scrolling past the invitation's opening prologue.

## Included images and replacement slots

Configure visual paths in `invitationData.assets` at the top of `../script.js`. Optional slots default to `null`; their proposed filenames are documented targets, not included files. The gallery uses `invitationData.photos`; see [gallery sources](gallery-sources.md). The current social card is `social-preview-v3.png`, generated with the built-in imagegen tool; its exact prompt is [documented here](social-v3-prompt.txt). Historical asset notes below predate the floral redesign; pedestal and footer monogram integrations are retired.

| Asset / configuration key | Status | Replacement requirements |
| --- | --- | --- |
| `floral-arch.webp` / `floralArch` | Included: 1024 × 1536, RGBA, 484,778 bytes | Straight-on portrait arch of white/ivory roses, hydrangea and subtle sage foliage; genuinely transparent middle and surroundings. Flowers run along both sides and a semicircular top. Keep the doorway opening empty. |
| `embossed-paper-landscape.webp` / `embossedPaper` | Included: 1200 × 800, RGB, 95,422 bytes | Landscape warm ivory cotton paper with raised botanical ornament. Keep the center calm. No text, lettering, monogram, seal, fold lines, phone, hands, or external background. DOM flaps supply the physical fold geometry. |
| `wax-seal.webp` / `waxSeal` | Included: 512 × 512, RGBA, 77,954 bytes | Isolated round antique champagne wax seal with a botanical rosette and true alpha. No initials, Arabic or English letters, numbers, logos, or external cast shadow. |
| `interior.webp` / `interior` | Included: 940 × 1672, RGB, 204,118 bytes | Portrait architectural room, head-on symmetry, center vanishing point, empty foreground. No people, table, pedestal, card, or text baked into this background. Keep the key arch and light centered. |
| `paper-texture.webp` / `paperTexture` | Included: 512 × 512, RGB, 5,888 bytes | Quiet warm ivory paper texture with no writing, objects, vignette, or strong directional illumination. Shared by the inside paper and invitation background for a continuous transition. |
| `door-left.webp` / `doorLeft` | Optional; disabled by default | Isolated left door leaf, front-on and tightly cropped. Outside hinge at the left edge. Match the room's warm dark wood and lighting. The DOM controls hinge rotation. |
| `door-right.webp` / `doorRight` | Optional; disabled by default | Matching right leaf with its outside hinge at the right edge. Preserve scale and registration with the left leaf. Do not include the frame or another door. |
| `pedestal.webp` / `pedestal` | Optional; disabled by default | This legacy configuration key now replaces the oval two-leg table. Supply a transparent ivory stone table, front-on with a slightly visible horizontal top. Fit the existing object bounds and align the top with the card's initial contact position. Keep the card and contact shadow separate. |
| `monogram-ay.svg` / `monogram` | Optional; disabled by default | Custom calligraphy with recognizable آ and ي, a tight `viewBox`, and muted champagne color. Used only in the actual invitation footer; never on the cinematic envelope or seal. |
| `hand.webp` / `hand` | Optional integration slot; disabled by default | A realistic transparent hand layer can be added for a future interaction. The current sequence keeps it hidden and does not show a human hand. No baked card, ground, or background. |

Example optional configuration entries, enabled only after adding suitable files:

```js
doorLeft: "assets/door-left.webp",
doorRight: "assets/door-right.webp",
pedestal: "assets/pedestal.webp",
monogram: "assets/monogram-ay.svg"
```

Asset load failures retain procedural equivalents where available. Optional filenames cause no network requests while their configuration values are `null`.

`social-preview-v2.webp` is the current static social sharing image: 1200 × 628, 98,130 bytes. It shows the floral entrance and embossed invitation on an oval stone table without lettering or people, and remains separate from the moving cinematic layers.

The former `bride.webp`, portrait `embossed-paper.webp`, and `social-preview.webp` are retired source files. They are neither loaded nor included in the deployment. The `bride` configuration key has been removed.

## Framing and integration

Use genuine alpha for the floral arch, seal, and optional object cutouts; a rendered checkerboard is not transparency. The supplied arch's alpha range is 0–253, and its central pixel is fully transparent. Its blossom columns occupy approximately 22% of each side; position the overlay slightly wider than the door frame so the flowers surround the opening.

Door images should not contain a separate frame or pre-rotated perspective: CSS `rotateY()` supplies the perspective during opening. Replacement doors and tables should fit their DOM object dimensions closely. Keep the room's horizon and vanishing point consistent with the table surface.

The landscape invitation lies flat on the table, with zero sideways roll and an independent contact shadow. It rises only 8px while remaining parallel to the tabletop; only the user's opening gesture lifts it toward the viewer. Door leaves rotate inward to 88° and remain clipped inside the aperture, behind the fixed floral frame. Do not bake a duplicate invitation or contact shadow into the table image. The seal and embossing remain free of writing throughout the intro.

After replacing assets, inspect 360 × 800, 375 × 812, 390 × 844, 393 × 873, and 430 × 932, plus desktop and landscape. Confirm flowers frame the opening, door leaves hinge naturally, the table and card stay centered, one deliberate activation opens the flaps, and scroll remains locked until entry completes. Prefer compressed WebP/AVIF, preserving alpha where needed.

## Image provenance and exact prompts

All supplied photographic materials were generated with the built-in `image_gen.imagegen` tool. They are original project assets, not stock photographs. Pillow was used only for routine resize/conversion/compression; visual content was generated by ImageGen.

Exact prompts for the revised assets are recorded in:

- [Floral arch, embossed paper, wax seal, and revised social preview prompts](generation-prompts.txt)

The retained original interior and plain paper texture prompts follow.

### Interior

```text
Use case: photorealistic-natural. Asset type: independent architectural background for a cinematic mobile wedding invitation, portrait 9:16 composition. Create an original photorealistic, perfectly symmetrical neoclassical Italian palazzo interior photographed head-on with a 35 mm cinema lens. Soaring warm ivory limestone arches, paired columns, deep walnut and umber architectural shadows, small antique bronze wall sconces with warm light. Central vanishing point at half-height, quietly illuminated rear archway. Realistic limestone flooring and shallow steps, empty center foreground where a separate pedestal will be layered by website code. Mood is luxurious, mysterious, restrained, editorial wedding film still with subtle natural film grain. Pale warm ivory architecture must remain legible, deep shadows toward the outer edges, champagne reflections, soft indirect daylight. Color palette warm ivory #F4EFE7, cream #E8DDD0, shadow #171310, warm stone #9A8978. No people, no bride, no pedestal, no card, no furniture in center, no flowers, no curtains, no glitter, no signage, no text, no watermark, no white flare or portal. This is a background photograph asset, not a website screenshot.
```

### Paper texture

```text
Use case: product-mockup. Asset type: seamless square material texture tile for a premium wedding website. Entire image is warm ivory fine tactile cotton cardstock paper #F4EFE7. Flat even light, extremely low contrast fine natural cotton paper fibers and soft matte grain, exquisite stationery material. Seamless tiling edges. No folds, no wrinkles, no shadows, no lighting gradient, no objects, no borders, no text, no watermark. Square composition, viewed perfectly straight down.
```
