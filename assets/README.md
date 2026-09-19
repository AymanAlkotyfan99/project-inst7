# Cinematic asset guide

The opening is a real DOM/CSS experience. Do not replace it with a video, an animated movie, or a single baked scene. The bride, doorway, room, pedestal, shadows, and invitation must remain independent layers. In particular, keep the invitation as HTML/CSS so its first tap can lift it and its second tap can rotate the physical cover.

## Included images and replacement slots

Configure visual paths in `invitationData.assets` at the top of `../script.js`. Optional slots default to `null`; their proposed filenames below are documented targets, not claims that those files are included. The procedural doors, pedestal, and text monogram remain available as fallbacks.

| Asset / configuration key | Status | Replacement requirements |
| --- | --- | --- |
| `bride.webp` / `bride` | Included: 1024 × 1536, RGBA, 144,614 bytes | A full-length adult bride in back or 3/4 back view on actual transparent alpha; whole train and extended hand inside the image. Current head is near x = 62% of the image width. The layer uses `object-fit: contain`; adjust `.bride-layer` positioning if the replacement silhouette differs. |
| `interior.webp` / `interior` | Included: 940 × 1672, RGB, 204,118 bytes | Portrait architectural room, head-on symmetry, center vanishing point, empty foreground. No bride, pedestal, card, or text baked into this background. Keep the key arch and light centered so responsive cropping remains balanced. |
| `paper-texture.webp` / `paperTexture` | Included: 512 × 512, 5,888 bytes | Quiet warm ivory paper texture with no writing, objects, vignette, or strong directional illumination. It is reused on the cover, inside paper, and invitation background to preserve the visual transition. |
| `door-left.webp` / `doorLeft` | Optional; disabled by default | Isolated left door leaf, front-on, tightly fitted to its object bounds. Its outside hinge must align to the left edge. Match the warm dark wood and lighting of the room. The DOM still controls hinge rotation. |
| `door-right.webp` / `doorRight` | Optional; disabled by default | Matching right door leaf, outside hinge at the right edge. Preserve scale and registration with the left leaf. Do not include the frame or a second door. |
| `pedestal.webp` / `pedestal` | Optional; disabled by default | Transparent isolated ivory stone pedestal, front-on with a gently visible horizontal top. Crop close to the object bounds because it fills the existing pedestal dimensions. Align the top with the existing card rest position; the DOM contact shadow remains independent. |
| `monogram-ay.svg` / `monogram` | Optional; disabled by default | A supplied custom calligraphic SVG containing only recognizable آ and ي. Use a tight `viewBox` with a little breathing room and muted champagne foil color. Preserve the Arabic identities and avoid English A/Y. |
| `hand.webp` / `hand` | Optional; disabled by default | High-quality realistic transparent hand, framed to enter from the lower right and support the card. No baked card or ground background. It appears during lifting and fades during opening. Keep disabled if a convincing asset is unavailable. |

Example optional configuration entries, enabled only after adding their files:

```js
doorLeft: "assets/door-left.webp",
doorRight: "assets/door-right.webp",
pedestal: "assets/pedestal.webp",
monogram: "assets/monogram-ay.svg",
hand: "assets/hand.webp"
```

Asset load failures retain the procedural equivalents where available. Optional filenames do not cause network requests while their configuration values are `null`.

`social-preview.webp` is also included: 1200 × 628, 48,686 bytes. This is the static social link preview only; it is not used as a replacement for the interactive card or cinematic layers.

## Framing and integration

Use genuine alpha for independent people and object cutouts; a visible checkerboard or opaque rectangular backdrop is not transparency. Preserve clean dress and veil edges. The supplied bride's alpha was inspected: 832,840 original pixels are fully transparent and the gown is approximately 99% opaque. The original image's alpha range was 0–254; this was preserved by conversion to WebP.

Door images should not contain a separate frame or perspective already tilted sideways: CSS `rotateY()` provides the perspective during opening. Pedestal and door images should tightly fill the dimensions of their DOM objects. Bride and hand framing should leave enough transparent room to avoid clipping fabric or fingers during motion.

Keep the room's horizon and vanishing point consistent with the pedestal top. The card is positioned over that top surface and has an independent contact shadow that grows softer when lifted. Do not include a duplicate card or shadow inside replacement photographs.

After replacing assets, inspect at 360 × 800, 375 × 812, 390 × 844, 393 × 873, and 430 × 932, plus desktop and landscape. Confirm the bride clears the center path, both hinged door leaves leave the frame naturally, and the resting card remains centered on the pedestal. Prefer compressed WebP/AVIF, preserving alpha where necessary.

## Image provenance and exact prompts

The supplied bride, interior, paper texture, and social preview are original images generated using the built-in `image_gen.imagegen` tool. They are project assets, not stock photographs. Routine conversion/compression to WebP used Pillow; their visual content was generated by ImageGen. The paper source was 1254 × 1254 and the social preview source was 1734 × 907 before resizing for delivery.

### Bride

```text
Use case: photorealistic-natural. Asset type: transparent foreground cutout layer for an original luxurious cinematic interactive wedding entrance website. Generate a single full-length elegant adult bride seen from almost directly behind, subtly 3/4 back, face not visible. She has dark brunette hair in a refined low bun with a sheer delicate veil. Her refined warm ivory silk wedding gown has graceful flowing fabric, structured elegant fitted bodice, a beautiful long train spreading slightly on the ground behind her toward camera. Right arm gently extends forward and slightly right, as if reaching for a doorway, hand anatomically natural. Left arm rests elegantly near her side. A complete human figure and entire train contained within a vertical 2:3 canvas, generous transparent margin; no cropping of head, hand or train. High-end editorial wedding photography, realistic proportions, subtle fabric texture, warm champagne front/side light from an implied indoor doorway ahead, soft shadow on the gown facing camera; sophisticated and quiet. Scene/backdrop: ACTUAL FULLY TRANSPARENT ALPHA BACKGROUND. Isolate only bride and veil and dress, transparent everywhere around the subject; no floor, no cast ground shadow, no architecture, no background, no gradient, no checkerboard rendered into the image, no text, no watermark, no other objects. This asset needs clean alpha edges for compositing on a dark architectural scene. No illustration, no cartoon, no 3D rendered look.
```

### Interior

```text
Use case: photorealistic-natural. Asset type: independent architectural background for a cinematic mobile wedding invitation, portrait 9:16 composition. Create an original photorealistic, perfectly symmetrical neoclassical Italian palazzo interior photographed head-on with a 35 mm cinema lens. Soaring warm ivory limestone arches, paired columns, deep walnut and umber architectural shadows, small antique bronze wall sconces with warm light. Central vanishing point at half-height, quietly illuminated rear archway. Realistic limestone flooring and shallow steps, empty center foreground where a separate pedestal will be layered by website code. Mood is luxurious, mysterious, restrained, editorial wedding film still with subtle natural film grain. Pale warm ivory architecture must remain legible, deep shadows toward the outer edges, champagne reflections, soft indirect daylight. Color palette warm ivory #F4EFE7, cream #E8DDD0, shadow #171310, warm stone #9A8978. No people, no bride, no pedestal, no card, no furniture in center, no flowers, no curtains, no glitter, no signage, no text, no watermark, no white flare or portal. This is a background photograph asset, not a website screenshot.
```

### Paper texture

```text
Use case: product-mockup. Asset type: seamless square material texture tile for a premium wedding website. Entire image is warm ivory fine tactile cotton cardstock paper #F4EFE7. Flat even light, extremely low contrast fine natural cotton paper fibers and soft matte grain, exquisite stationery material. Seamless tiling edges. No folds, no wrinkles, no shadows, no lighting gradient, no objects, no borders, no text, no watermark. Square composition, viewed perfectly straight down.
```

### Social preview

```text
Use case: ads-marketing. Asset type: social link preview of an original cinematic luxury Arabic wedding invitation website. Create a landscape 1.91:1 cinematic promotional image, exquisitely minimal. Deep umber neoclassical Italian palazzo hall with warm ivory columns and arches disappearing into soft shadow in background, tiny antique bronze warm sconces. Foreground centered lower middle, one thick physical warm ivory wedding invitation card resting naturally on a simple limestone pedestal, touching the surface with realistic contact shadow. Cover has a subtle embossed champagne foil Arabic monogram composed of exactly the letters آ and ي. These are two initial letters, keep both visibly recognizable: آ with its madda above, and ي with two dots below. Not English A/Y. Card should be tactile and realistic. A single large elegant Arabic title centered in open dark space across upper-middle reads exactly: دعوة إلى حكايتنا . White warm ivory Arabic calligraphy, joined letters correct and readable at mobile preview size. The exact title is دعوة إلى حكايتنا . No other text, no dates, no names, no URLs, no logos, no envelope. Ivory, champagne, dark brown palette #F4EFE7 #CDB58E #171310. Premium editorial film photography, refined material and light, generous negative space, no flowers, no glitter, no people, no portals. Ensure title stays fully inside central 80% of composition.
```
