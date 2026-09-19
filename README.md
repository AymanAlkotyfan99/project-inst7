# Open the door — enter their story

A mobile-first Arabic wedding invitation for آلاء and ياسر, built with HTML, CSS, and vanilla JavaScript. White flowers frame hinged architectural doors. Inside, an embossed invitation rests on an oval stone table, gently rises as the doors open, and waits for one deliberate tap. Its paper flaps open, warm light emerges, and the paper fills the screen to become the invitation website. No video is embedded, rendered, or played.

## Run locally

Use Node.js 20 or newer. There are no runtime packages to install.

```sh
npm run dev
```

In Windows PowerShell, use `npm.cmd run dev` if the PowerShell execution policy blocks `npm.ps1`. Open <http://localhost:5173>.

```sh
npm run check
npm run build
```

The build checks JavaScript syntax and writes the static site to `dist/client`. Deploy that directory to a static host with `index.html` as the entry point. The build also prepares `dist/server/index.js` for a Worker environment that provides an `ASSETS` binding; a static deployment needs only `dist/client`.

## Personalize

Edit the single `invitationData` object at the top of `script.js`. Names, initials, phrases, date, time, time zone, venue, city, map link, and visual asset paths are configured there.

- Keep `date` and `time` as `null` until confirmed. Set the date to `YYYY-MM-DD` and the time to 24-hour `HH:MM`, interpreted in `timeZone`.
- Replace the venue and city announcement placeholders with confirmed details.
- Set `mapsUrl` to a valid HTTPS venue map URL. An unconfigured map link stays hidden.
- A valid date and time reveal the Arabic countdown and downloadable calendar invitation. Unknown or invalid event details show an announcement instead of an invented event.
- Keep optional asset entries `null` until their files exist. See [the asset guide](assets/README.md) for replacement framing and provenance.

The recognizable Arabic initials آ and ي appear only in the main invitation footer. A supplied calligrapher's SVG can replace that monogram. The cinematic entrance, embossed cover, floral wax seal, and opening paper contain no visible lettering.

## Experience and access

The intro has no bride. The closed entrance carries a separate photographic white floral arch; each door leaf rotates around its own hinge. An oval stone tabletop with two legs supports the invitation and its contact shadow.

1. After a short pause, the doors open automatically.
2. The landscape invitation stays flat and straight on the white tabletop. As the doors open inward within the floral frame, the paper rises only 8 pixels without standing upright or tilting sideways.
3. In `CARD_READY`, warm light outlines the sealed paper and all four corners glow gently. One deliberate tap releases the seal, then unfolds the paper slowly over 3.4 seconds.
4. Six soft sunlight beams emerge from inside. The fully opened envelope holds for 2.3 seconds before a 2.5-second paper push-in reveals the Arabic invitation. Scrolling unlocks only when the invitation becomes active.

The opening has no visible instructions, names, initials, or other lettering. Subtle icon-only skip and sound controls retain Arabic accessible labels. State changes have screen-reader announcements. The invitation is a native button supporting touch, mouse, stylus, and keyboard activation; taps during transitions are ignored. The footer can replay the experience.

Reduced-motion preferences suppress the camera journey and decorative motion while keeping the same single card activation. Changing that preference during a sequence cancels pending animation work safely. Focus transfers to the invitation when it opens. Inactive content is inert, and Arabic RTL text has no letter spacing on Arabic words.

Sound starts disabled. The small sound control enables quiet synthesized material cues only after the visitor activates it. JavaScript is required for the interactive opening; a no-script notice explains this.

The `motion` settings in `invitationData` control seal release, unfolding, sunlight hold, and paper entry in milliseconds. CSS durations are derived from the same settings. Reduced motion keeps short transitions, disables pulsing corners and ray streaks, and preserves the single activation.

## Assets and delivery

The active photographic layers are the interior, transparent floral arch, landscape embossed paper, and transparent floral wax seal. Together with the reusable paper texture, these are about 848 KiB. The social preview is a separate static sharing image. Architecture, door hinges, the oval table, envelope flaps, contact shadow, opening light, and paper transition use independent DOM/CSS layers.

The original `bride.webp`, portrait `embossed-paper.webp`, and `social-preview.webp` remain as retired source assets and are excluded from the build. The current social preview is `assets/social-preview-v2.webp`.

Amiri, IBM Plex Sans Arabic, and Cormorant Garamond are bundled as local WOFF2 subsets in `assets/fonts`, with their SIL Open Font License notices. The finished page makes no external font, script, or image requests. `tools/vendor-fonts.mjs` is a one-time maintenance helper; it is not used at runtime.

Primary source files are `index.html`, `style.css`, and `script.js`. The asset guide distinguishes included files from optional replacement slots.
