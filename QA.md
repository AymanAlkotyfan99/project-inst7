# Validation — November countdown and music (12 October 2026)

Passed JavaScript syntax checks and the production build. Headless Chrome tested widths 320, 390, 430, 768, and 1440, with touch/mobile emulation for phone widths. Screenshots were inspected at 390 and 1440. No physical-phone or Safari test was performed; performance changes reduce work but are not a measured device-speed claim.

- No page errors or horizontal document overflow at the tested widths; all four countdown units reveal within the viewport.
- Countdown resolves to 1 November 2026 at 17:00 Asia/Damascus (`2026-11-01T14:00:00Z`), matching the downloaded calendar.
- Music makes no request before interaction, starts at exactly 22 seconds on the envelope tap, and pauses/resumes from the sound control.
- Offscreen countdown stops updating; re-entry refreshes from the absolute timestamp. Expiry keeps the section visible with zero values and the celebration message.
- Reduced motion disables the orbit animation; replay and opening still reach the active invitation state.
- Phones render 7 petals, desktop 16. Large animated blur layers are disabled on phones; hidden intro animations pause.

Latest local evidence: `.qa/countdown-results.json` and `.qa/countdown-{width}.png`.

## Previous revision

The September 22 revision adds burgundy petals, a hidden-to-visible straight envelope entrance, a five-second opening, and an ivory/burgundy interior with event details before the gallery. A follow-up removes the envelope's overall tilt while preserving the paper-fold animation; verified by source review and a successful production build.

Validation for this revision covers JavaScript syntax, the production build, local asset references, duplicate HTML identifiers, section links, stylesheet structure, local HTTP responses, and production/source parity. A Node VM with a fake clock exercises the actual entrance/opening functions, including skip and replay at seven stages and reduced motion. Browser screenshots and device simulations from preceding designs do not validate this revision. No new browser or physical-phone visual QA was performed.

Important behavior:

- The previous supplied date was 2026-08-30; superseded by the November date above.
- The previous past-date countdown was hidden; superseded by the celebration state above.
- The venue link is a labeled search for إيليت بلازا, not an invented exact address.
- Names live in the chapter after the first viewport and reveal in complete Arabic words.
- Gallery position is synchronized with native scrolling, arrow keys, arrow buttons, dots, and resize.
- Petals stop when hidden or when reduced motion is requested.
- The envelope becomes ready 2.6 seconds after asset readiness. Its initial opacity remains zero until the reveal.
- A tap activates invitation content at 4.15 seconds; the final 850 ms fade completes the five-second opening.
- Reduced motion activates content after 760 ms and hides the cinematic after 1.02 seconds.
- The existing state-machine cancellation continues to govern skip, replay, and changes to motion preferences.

The previous `tools/qa.mjs` browser suite contains assumptions about the retired table composition and unconfigured event. Update those expectations before using it to assess this redesign.
