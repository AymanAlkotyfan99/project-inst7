# A story in bloom

A mobile-first Arabic wedding invitation for آلاء and ياسر. White floral doors open before a straight, front-facing embossed envelope appears in warm light. A single tap opens its paper folds and reveals the invitation in five seconds, including the final fade. The ivory and burgundy page begins with a poetic prologue, then reveals the couple's names as the visitor scrolls. Date/time/location details follow, ahead of a swipeable photographic gallery and a floral closing. Burgundy falling petals connect the experience. There is no table or video.

## Run

Node.js 20 or newer; no runtime packages required.

```sh
npm run dev
npm run check
npm run build
```

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`. Local preview: http://localhost:5173. The build produces `dist/client` for static hosting and `dist/server/index.js` for a Worker with an `ASSETS` binding. Hosting identity stays in `.openai/hosting.json`.

## Invitation details

The single `invitationData` object in `script.js` holds names, event information, phrases, images, and motion timings. The supplied details are 30 August 2026, 17:00 in Asia/Damascus, إيليت بلازا. No city or precise venue pin was supplied, so the map button searches Google Maps for the venue name. Replace `mapsUrl` with the exact venue URL when available.

Dates use `YYYY-MM-DD`; times use 24-hour `HH:MM`. Set unconfirmed fields to `null`. A valid event enables calendar download with the correct UTC conversion. Past events retain their date and calendar action but do not show a negative countdown. No end time is invented.

## Photos and design

`invitationData.photos` controls the gallery. Replace each entry's `src`, `alt`, `title`, `caption`, `width`, and `height` with personal photos if desired. The included photos depict wedding atmosphere and flowers; they are not pictures of the couple or the actual venue. Source attribution is in `assets/gallery-sources.md`.

The gallery uses native horizontal scrolling and CSS scroll snapping. It supports touch swiping, arrow buttons, dots, and ArrowLeft/ArrowRight/Home/End keys. There is no autoplay. Its photographs are lazy loaded and stored locally. Hero and closing photos reuse the same local gallery assets.

The custom share image is `assets/social-preview-v3.png`; its prompt and built-in imagegen provenance are in `assets/social-v3-prompt.txt`. The scene and all fonts are bundled locally. Existing font licenses remain in `assets/fonts`.

## Motion and access

The envelope and entrance carry no visible names. The prologue is the first focus target after opening. Names enter in complete Arabic words on scrolling, without letter spacing that would break their ligatures. Replay resets the reveal and title.

Sixteen lightweight burgundy CSS petals pause when the page is hidden and are removed for reduced-motion preferences. The entrance takes 2.6 seconds after initial asset readiness; the envelope stays hidden until its reveal. The full tap-to-invitation sequence takes five seconds, with timing configured in `invitationData.motion`. Reduced motion shortens the opening and removes name motion. Skip, replay, keyboard activation, inert inactive content, and screen-reader announcements are supported. Sound starts disabled and enables quiet synthesized material sounds after an explicit activation.

See `QA.md` for the scope of validation on this revision.
