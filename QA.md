# Validation — floral redesign

The September 2026 revision replaces the table with suspended stationery and adds a prologue, staged name reveal, touch gallery, event detail cards, petals, and a garden ending.

Validation for this revision covers JavaScript syntax, the production build, local asset references, duplicate HTML identifiers, and source review of the interaction contracts. Date/time/calendar behavior is checked independently in Node. Browser screenshots and device simulations from the preceding design do not validate this revision. No new browser or physical-phone visual QA was performed.

Important behavior:

- The supplied date is 2026-08-30 at 17:00 Asia/Damascus; calendar export resolves to 14:00 UTC.
- A past date keeps event details and calendar download available while hiding countdown values.
- The venue link is a labeled search for إيليت بلازا, not an invented exact address.
- Names live in the chapter after the first viewport and reveal in complete Arabic words.
- Gallery position is synchronized with native scrolling, arrow keys, arrow buttons, dots, and resize.
- Petals stop when hidden or when reduced motion is requested.
- The existing state-machine cancellation continues to govern skip, replay, and changes to motion preferences.

The previous `tools/qa.mjs` browser suite contains assumptions about the retired table composition and unconfigured event. Update those expectations before using it to assess this redesign.
