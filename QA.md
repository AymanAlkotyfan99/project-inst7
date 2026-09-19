# Verification

Verified locally in headless Chrome on 19 September 2026. These are browser viewport simulations, not claims of testing physical phones or Safari.

| Check | Result |
| --- | --- |
| 360 × 800, 375 × 812, 390 × 844, 393 × 873, 430 × 932 | Complete interaction passes |
| Desktop, 1440 × 1000 | Entrance, card, invitation, story visually inspected |
| Automatic presentation | Landscape envelope stays flat over the table; rise is limited to 8px, with zero in-plane rotation |
| One tap, followed by five rapid touch events | Envelope opens once; every following state occurs exactly once |
| Opening materials | Paper flaps hinge open and warm light appears; no visible writing is painted before the actual invitation |
| Reduced motion | Camera journey omitted; one deliberate activation opens the invitation |
| Replay and skip | Correct state reset; no old delayed actions resume |
| Scroll | Locked before entry; unlocked afterward |
| Geometry | Oval table and card anchor stay centered; contact shadow remains; the open paper fits mobile width |
| Camera composition | Bride removed; loaded white floral arch frames hinged doors; cinematic container cannot scroll when the card receives focus |
| Door opening | Inspected at 350, 850, and 1350ms: leaves rotate inward, stay inside the aperture, and do not protrude beyond the flowers |
| Arabic | Names آلاء / ياسر and initials آ / ي are restricted to the actual invitation and checked in DOM/screenshots |
| Runtime and network | No console or page errors across the five mobile sizes; assets and fonts served locally |
| No video | No video element or video playback dependency |
| Configured sample date | Arabic countdown, HTTPS map, and calendar download pass |
| Time zone | Sample 19:30 Asia/Damascus correctly exports 16:30 UTC in the calendar file |

The event test temporarily overrides the served script. It does not put a sample date or map into the delivered invitation.

The revised motion uses transforms and opacity, a small number of atmospheric particles, restrained background blur, and CSS light layers. Physical phone performance has not been measured. The cinematic container uses `overflow: clip` to prevent browser focus scrolling from shifting the entire scene during envelope opening.

`tools/qa.mjs` contains the interaction checks. Run it with Node and the path to an installed Playwright `index.mjs`; it uses an installed Chrome browser. Generated screenshots and raw results stay in the untracked `.qa` directory.

Before distributing the invitation to guests, replace the date, time, venue, city, and map placeholders in `script.js`. Physical iOS Safari and WhatsApp/Instagram in-app browser checks remain advisable for the final guest environment.
