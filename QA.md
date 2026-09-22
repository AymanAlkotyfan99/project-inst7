# Validation — burgundy invitation refresh

The September 22 revision adds burgundy petals, a hidden-to-visible straight envelope entrance, a five-second opening, and an ivory/burgundy interior with event details before the gallery. A follow-up removes the envelope's overall tilt while preserving the paper-fold animation; verified by source review and a successful production build.

Validation for this revision covers JavaScript syntax, the production build, local asset references, duplicate HTML identifiers, section links, stylesheet structure, local HTTP responses, and production/source parity. A Node VM with a fake clock exercises the actual entrance/opening functions, including skip and replay at seven stages and reduced motion. Browser screenshots and device simulations from preceding designs do not validate this revision. No new browser or physical-phone visual QA was performed.

Important behavior:

- The supplied date is 2026-08-30 at 17:00 Asia/Damascus; calendar export resolves to 14:00 UTC.
- A past date keeps event details and calendar download available while hiding countdown values.
- The venue link is a labeled search for إيليت بلازا, not an invented exact address.
- Names live in the chapter after the first viewport and reveal in complete Arabic words.
- Gallery position is synchronized with native scrolling, arrow keys, arrow buttons, dots, and resize.
- Petals stop when hidden or when reduced motion is requested.
- The envelope becomes ready 2.6 seconds after asset readiness. Its initial opacity remains zero until the reveal.
- A tap activates invitation content at 4.15 seconds; the final 850 ms fade completes the five-second opening.
- Reduced motion activates content after 760 ms and hides the cinematic after 1.02 seconds.
- The existing state-machine cancellation continues to govern skip, replay, and changes to motion preferences.

The previous `tools/qa.mjs` browser suite contains assumptions about the retired table composition and unconfigured event. Update those expectations before using it to assess this redesign.
