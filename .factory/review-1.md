# Review: Plan a private five-turn match with a friend

## Verdict

**PASS — zero findings and zero untested public claims.**

## Product and reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation candidate: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Live browser release metadata: `1e1abb188103166edb4a0a0a30d4075e9600a750`
- Live room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Documentation base reviewed: `6fe01416f31df561620a5f5ad9c3ccb66e6fd1d2`
- Review date: 2026-09-06 UTC

Only `.factory` reports differ between the browser candidate and live release
revision. Later commits through the documentation base are also report-only.
A clean build at `1e1abb1` matched the live JavaScript and CSS byte-for-byte.
The live footer showed `1e1abb1`, and service health reported `00afddae…`.

## First screen before scrolling

- Job: plan five simultaneous tactics turns with one friend.
- Audience: two friends who want a short match without accounts or live timing.
- First action: create a room, or open the sample beside it.

Fresh Chromium contexts at 1440×900 and 390×844 showed the job, audience,
both actions, three facts, and the game board before scrolling. The board began
at 152 CSS px on desktop and 632.75 CSS px on phone. The title names the job,
and the first screen uses plain words without a metaphor or mood heading.

## Complete game runs

The direct sample opened a populated Mira-versus-Teo match on Cypress Pass.
The persistent `Demo — sample data, nothing is saved` label remained visible
through all five resolutions. The deterministic moves `3-5`, `3-4`, `3-3`,
`2-3`, and `1-3` reached the actual **You won** end screen. Reload kept the
result, Reset demo returned to turn one with a zero score, and Start for real
removed only demo keys. A seeded real-room browser entry remained unchanged,
and the sample sent no request to the room service.

Two independent live browser contexts created and joined a private room, then
submitted five simultaneous rounds. They reached **You won** and **You lost**
end screens, and both outcomes survived reload. A third client received the
large visible room-full recovery message. Copy room link wrote the exact room
URL. Forget this room removed the browser entry while the authenticated shared
room still returned 200. Create another room returned to the empty room form.

Run evidence:

- `/work/.evidence/roomcode-tactics-review-1/live/sample-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-1/live/real-winner-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-1/live/real-loser-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-1/live/live-verification.json`

## Declared claims

From a separate clean checkout of `bc1d448`, after `npm ci`, every exact
command in `.factory/claims.json` passed. The inventory contains 21 ids, and
each id occurs in exactly one test source tag.

| Claim | Result |
| --- | --- |
| `demo-never-saves-real` | Pass in desktop and phone projects |
| `no-tracking` | Pass in desktop and phone projects |
| `request-destinations` | Pass in desktop and phone projects |
| `restart-demo` | Pass in desktop and phone projects |
| `settings-persist` | Pass in desktop and phone projects |
| `refresh-rejoin` | Pass in desktop and phone projects |
| `copy-room-link` | Pass in desktop and phone projects |
| `forget-room` | Pass in desktop and phone projects |
| `expired-session-cleanup` | Pass in desktop and phone projects |
| `free-join` | Pass in desktop and phone projects |
| `two-seat-room` | Pass in desktop and phone projects |
| `room-expiry` | Pass in the service sandbox |
| `five-turn-match` | Pass in desktop and phone projects |
| `real-match-restart` | Pass in desktop and phone projects |
| `footer-version` | Pass in desktop and phone projects |
| `seven-by-seven-map` | Pass in desktop and phone projects |
| `durable-room-state` | Pass across a service restart |
| `idempotent-moves` | Pass in the service sandbox |
| `opaque-room-pass` | Pass with database inspection |
| `request-limits` | Pass in the service sandbox |
| `resolution-frame-rate` | Pass at 59.00 fps under 4× CPU throttle |

Landing, demo, privacy, terms, README, and footer copy were cross-checked
against the inventory. No public privacy, storage, room, game, performance,
price, mode, offline, or update claim was left undeclared or untested. Offline
play and background updating are not promised. The tested offline path gives a
visible reconnect instruction. There is no service worker or extra advertised
mode. AI would not improve this deterministic two-player game, so its absence
is not missed leverage.

Claim logs are in `/work/.evidence/roomcode-tactics-review-1/claims/`.

## Backend, invalid input, and recovery

- Live health returned 200 with service build `00afddae…`.
- A valid opaque pass for one live room returned 403 against another room.
- Live requests reached 429 on attempt 31 with `Retry-After: 5`; changing a
  caller-supplied forwarding value remained 429.
- The clean restart claim saved a move, restarted the service against the same
  SQLite files, and found the move still locked. The earlier controlled live
  restart remains applicable because the service implementation is unchanged.
- The clean suite passed missing, one-character, 21-character, and disallowed
  names; missing pass; invalid room; wrong room; invalid origin; illegal move;
  repeated move; completed match; full room; network failure; and offline
  recovery paths.
- Accepted moves are committed before the response. Repeated move ids are
  idempotent. Expiry cleanup removes room, move, and pass-hash rows.

No credential, room pass, or another service's data is present in the report
or evidence.

## Accessibility, privacy, routes, and performance

- `npm run test:all` passed: 6 service tests and 63 browser tests. The one skip
  is the intended desktop duplicate of the phone-only frame-rate test.
- `npm run build` passed and created `dist/`. JavaScript is 25.61 kB raw /
  8.48 kB gzip; CSS is 12.00 kB raw / 3.56 kB gzip.
- The worker URL check passed in 736 ms with no console error, one `h1`,
  `lang="en"`, a `main`, image alt coverage, and labelled buttons.
- Playwright axe found no serious or critical issue on live home and privacy.
  The clean suite also covered demo, terms, high contrast, and the 404.
- Skip-link operation, board arrow keys, dialog focus and Escape return, route
  heading focus, Back focus, reduced motion, 44 px phone targets, and 200%
  text reflow passed.
- Fresh landing and sample requests remained first-party. Real play contacted
  only the product and its product-owned room service.
- Home, demo, privacy, terms, robots, sitemap, and favicon returned 200.
  `/404.html` and an unknown route returned the designed page with status 404,
  a heading, navigation, footer, and return action. These deliberate 404s are
  expected responses, not defects.
- Route titles, one-heading structure, legal pages, internal links, CSP,
  `frame-ancestors`, referrer policy, nosniff, and permissions policy passed.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility,
  100 best practices, and 100 SEO. LCP was 1.50 s, CLS was 0, total blocking
  time was 13 ms, and transferred bytes were 148,331.

## Earlier finding disposition

All findings, including minor findings, from verification 1 and verification
2 are resolved and were rechecked:

| Earlier finding | Current proof |
| --- | --- |
| Stored data not deleted | Expiry claim deleted room, move, and pass-hash rows; browser cleanup passed. |
| Request allowance bypass | Clean and live rotating-header checks remained at 429 with `Retry-After`. |
| Invisible errors | Live third-seat and clean network/invalid-room messages were visible, focused, and actionable. |
| Missing-route status | Unknown URL and `/404.html` returned the designed 404 with HTTP 404. |
| Passes not opaque | Clean database inspection and live format checks passed; cross-room use returned 403. |
| 200% phone overflow | Every app route reflowed within 390 CSS px. |
| Small phone targets | Header, demo, and enabled board targets measured at least 44×44 CSS px. |
| Route focus missing | Navigation and Back focused the correct route heading. |
| Incomplete claim inventory | All 21 public claims have one tag and every exact command passed. |
| Missing frame-rate proof | Fresh phone measurement was 59.00 fps at 4× CPU throttle. |
| Live build labelled `dev` | Footer showed `1e1abb1`; release assets matched that clean build. |
| Four outcomes missing from claims | Copy, forget, real restart, and footer-version claim tests all passed. |

## Evidence and final count

- Evidence directory: `/work/.evidence/roomcode-tactics-review-1/`
- Findings: **0**
- Untested public claims: **0**
- Final verdict: **PASS**

Two failed tool launches before measurement were reviewer setup errors: the
workspace initially lacked installed packages, and Lighthouse initially lacked
an explicit Chromium path. The documented `npm ci` setup and preinstalled
browser path corrected them; neither attempt reached or failed a product path.
