# Open the door — enter their story

A mobile-first Arabic wedding invitation for آلاء and ياسر, built with HTML, CSS, and vanilla JavaScript. The opening uses separate image and DOM layers, hinged doors, a physical folding card, and a continuous paper transition. No video is embedded, rendered, or played.

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

Edit the single `invitationData` object at the top of `script.js`. Names, initials, phrases, date, time, time zone, venue, city, map link, and optional visual assets are configured there.

- Keep `date` and `time` as `null` until confirmed. Set the date to `YYYY-MM-DD` and the time to 24-hour `HH:MM`, interpreted in `timeZone`.
- Replace the venue and city announcement placeholders with confirmed details.
- Set `mapsUrl` to a valid HTTPS venue map URL. An unconfigured map link stays hidden.
- A valid date and time reveal the Arabic countdown and downloadable calendar invitation. Unknown or invalid event details show an announcement instead of an invented event.
- Keep optional asset entries `null` until their files exist. See [the asset guide](assets/README.md) for replacement framing and provenance.

The initial monogram uses the recognizable Arabic initials آ and ي. A supplied calligrapher's SVG can replace it without changing the physical card.

## Experience and access

The doors open automatically after a short pause. The bride moves aside and the viewer approaches the pedestal. The invitation waits for deliberate interaction:

1. The first tap presses and lifts the card, then stops.
2. A separate second tap opens the cover and enters the invitation.
3. Scrolling unlocks after the invitation becomes active.

Clicks during transitions are ignored; a rapid double tap cannot bypass the lifted state. The card is a native button, supporting pointer input and keyboard activation. A quiet skip control opens the invitation directly, and the footer can replay the experience.

Reduced-motion preferences bypass the camera journey while preserving the two deliberate card activations. Decorative motion and parallax are suppressed, including when the preference changes during the experience. Focus transfers to the invitation when it opens. Inactive content is inert, state changes have Arabic screen-reader announcements, and the page uses Arabic RTL text without letter spacing on Arabic words.

Sound starts disabled. The small sound control enables quiet synthesized material cues only after the visitor activates it. JavaScript is required for the interactive opening; a no-script notice explains this.

## Assets and delivery

The supplied `bride.webp` is 144,614 bytes (about 141 KiB), including true alpha. The supplied `interior.webp` is 204,118 bytes (about 199 KiB). Together the two photographic layers are about 341 KiB. The reusable `paper-texture.webp` adds about 6 KiB, and the separate social link preview is about 48 KiB. Architecture, pedestal, invitation cover, contact shadow, foil line, and paper transition use DOM/CSS layers so they can move independently.

Amiri, IBM Plex Sans Arabic, and Cormorant Garamond are bundled as local WOFF2 subsets in `assets/fonts`, with their SIL Open Font License notices. The finished page makes no external font, script, or image requests. `tools/vendor-fonts.mjs` is a one-time maintenance helper; it is not used at runtime.

Primary source files are `index.html`, `style.css`, and `script.js`. The asset guide distinguishes included files from optional replacement slots.
