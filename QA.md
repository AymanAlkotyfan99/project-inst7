# Verification

Verified locally in headless Chrome on 19 September 2026. These are browser viewport simulations, not claims of testing physical phones or Safari.

| Check | Result |
| --- | --- |
| 360 × 800, 375 × 812, 390 × 844, 393 × 873, 430 × 932 | Complete interaction passes |
| Desktop, 1440 × 1000 | Entrance, card, invitation, story visually inspected |
| First tap, followed by five rapid touch events | Card remains lifted; it does not open |
| Second deliberate tap | Hinged cover opens, foil draws, paper fills viewport, invitation activates |
| Reduced motion and rapid second activation | Camera journey omitted; two deliberate activations preserved |
| Replay and skip | Correct state reset; no old delayed actions resume |
| Scroll | Locked before entry; unlocked afterward |
| Geometry | Pedestal centered; resting card touches its top; inside page stays within mobile width |
| Camera composition | Bride moves sideways; doors use matrix3d hinge transforms; paper covers the viewport before handoff |
| Arabic | Names آلاء / ياسر and initials آ / ي checked in DOM and screenshots |
| Runtime and network | No console or page errors across the five mobile sizes; assets and fonts served locally |
| No video | No video element or video playback dependency |
| Configured sample date | Arabic countdown, HTTPS map, and calendar download pass |
| Time zone | Sample 19:30 Asia/Damascus correctly exports 16:30 UTC in the calendar file |

The event test temporarily overrides the served script. It does not put a sample date or map into the delivered invitation.

On the local test machine, a 644-frame animation sample measured 16.7 ms median and 17.2 ms at the 95th percentile, with eight frames above 50 ms. This is not a guarantee of performance on every phone. Motion uses transforms and opacity, a small number of atmospheric particles, and restrained background blur.

`tools/qa.mjs` contains the interaction checks. Run it with Node and the path to an installed Playwright `index.mjs`; it uses an installed Chrome browser. Generated screenshots and raw results stay in the untracked `.qa` directory.

Before distributing the invitation to guests, replace the date, time, venue, city, and map placeholders in `script.js`. Physical iOS Safari and WhatsApp/Instagram in-app browser checks remain advisable for the final guest environment.
