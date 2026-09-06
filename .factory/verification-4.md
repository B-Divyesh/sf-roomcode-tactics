# Verify a private five-turn match with a friend

## Verdict

**FAIL — 1 medium-severity finding and 1 untested public claim.**

The deployed game works through sample, win, loss, and draw runs. All 25
declared claim commands pass. The product is not accepted because the repaired
claims do not fully match or prove the public statements they are meant to
cover.

## Product and reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Implementation candidate: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation and static release revision: `2e802936fca37ba3400d0b68d1f0a1b2038b5677`
- Live room-service build: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Verification date: 2026-09-06 UTC

The candidate-to-documentation diff contains only `.factory/handoff.md`,
`.factory/repair-result.json`, and `scripts/verify-live.mjs`. A clean build at
`2e80293` matched the live HTML, JavaScript, and CSS byte-for-byte. The live
footer showed `2e80293`, while `/health` reported the implementation candidate.

## Finding

### F-01 — Medium — The repaired public claims have incomplete tagged tests

Four repaired statements are true in the live product, but their exact claim
commands do not fully prove the public wording:

1. README says a match “takes 5–10 minutes of active play.” The
   `active-session-length` manifest entry says only “under 10 minutes,” and its
   test asserts only the upper limit. A seconds-long scripted run does not
   measure or establish the public five-minute lower bound. That lower-bound
   statement is the one untested public claim in this verdict.
2. README says generated maps cycle through difficulty 1–5, all listed weather
   rules affect moves, centre and outer marker rules vary, and the displayed
   seed is repeatable. `seeded-map-content` creates only two rooms. It checks
   distinct seeds, one advancing difficulty, one weather closure, and one
   two-point centre marker; it never asserts the five-level cycle, every stated
   variant, or same-seed repeatability.
3. The `scoring-draw` claim says higher score wins and equal scores draw, but
   its exact tagged test asserts only a 0–0 draw. A separate match test and the
   live run show a 3–0 winner, but the declared scoring test does not assert
   that half of its own claim.
4. README says players can remap all four board-focus keys. The
   `remappable-controls` test changes and checks only Down. The independent live
   run proved Left, Up, Right, and Down all work and persist, but the declared
   regression test does not cover the full public statement.

The claims contract requires each public claim to match one tagged test that
asserts the observable outcome. Passing narrower tests does not satisfy that
contract. The repair should either narrow the public copy and manifest entries
to the tested outcomes or expand the tagged tests to cover the full wording.

Finding count: **1**. Untested public claim count: **1**.

## First screen before scrolling

- Job: plan five simultaneous tactics turns against one friend.
- Audience: two friends who want a short tactical match without accounts or
  live timing.
- First action: create a room, or open the sample beside it.

Fresh Chromium contexts at 1440×900 and 390×844 showed the job, audience, both
actions, three facts, and the game board before scrolling. The board began at
152 CSS px on desktop and 632.75 CSS px on phone. The title names the job and
the first screen uses plain words.

## Complete game runs

The direct sample opened the populated Mira-versus-Teo Cypress Pass match. The
persistent `Demo — sample data, nothing is saved` label remained visible through
five moves to the real **You won** screen on desktop and phone. Reload restored
the result. Reset returned to turn one. Start for real removed the demo
namespace and left a seeded real-data sentinel unchanged. Sample requests stayed
on the product origin.

Two fresh independent live clients created and joined one private room. Five
simultaneous rounds reached **You won** at 3–0 and **You lost**. Both outcomes
survived reload. A separate two-client room held both scouts for five rounds and
reached **The match is a draw** at 0–0. A third client received the large,
visible room-full recovery message. Copy room link wrote the exact URL. Forget
this room removed only its browser entry. Create another room returned to the
empty room form.

Run evidence:

- `/work/.evidence/roomcode-tactics-verify-4/live/sample-end-screen.png`
- `/work/.evidence/roomcode-tactics-verify-4/live/phone-sample-end-screen.png`
- `/work/.evidence/roomcode-tactics-verify-4/live/real-winner-end-screen.png`
- `/work/.evidence/roomcode-tactics-verify-4/live/real-loser-end-screen.png`
- `/work/.evidence/roomcode-tactics-verify-4/live/real-draw-end-screen.png`
- `/work/.evidence/roomcode-tactics-verify-4/live/live-verification.json`

## Declared claims from a clean checkout

A separate clone at `2e80293` used Node 22.23.2 and `npm ci`. All 25 commands
were copied from `.factory/claims.json` and run exactly. Every id is unique and
appears in one source tag.

| Claim | Command result | Verification result |
| --- | --- | --- |
| `demo-never-saves-real` | Pass in desktop and phone | Pass |
| `no-tracking` | Pass in desktop and phone | Pass |
| `request-destinations` | Pass in desktop and phone | Pass |
| `restart-demo` | Pass in desktop and phone | Pass |
| `settings-persist` | Pass in desktop and phone | Pass |
| `remappable-controls` | Pass in desktop and phone | Incomplete tagged coverage under F-01; all four directions passed live |
| `refresh-rejoin` | Pass in desktop and phone | Pass |
| `copy-room-link` | Pass in desktop and phone | Pass |
| `forget-room` | Pass in desktop and phone | Pass |
| `expired-session-cleanup` | Pass in desktop and phone | Pass |
| `free-join` | Pass in desktop and phone | Pass |
| `two-seat-room` | Pass in desktop and phone | Pass |
| `room-expiry` | Pass in service sandbox | Pass |
| `five-turn-match` | Pass in desktop and phone | Pass |
| `real-match-restart` | Pass in desktop and phone | Pass |
| `footer-version` | Pass in desktop and phone | Pass |
| `seven-by-seven-map` | Pass in desktop and phone | Pass |
| `seeded-map-content` | Pass in service sandbox | Incomplete tagged coverage under F-01; all stated variants passed live |
| `scoring-draw` | Pass in service sandbox | Incomplete tagged coverage under F-01; win and draw passed live |
| `active-session-length` | Pass in desktop and phone | Does not match the public 5–10 minute range; F-01 |
| `durable-room-state` | Pass across a service restart | Pass |
| `idempotent-moves` | Pass in service sandbox | Pass |
| `opaque-room-pass` | Pass with SQLite inspection | Pass |
| `request-limits` | Pass in service sandbox | Pass |
| `resolution-frame-rate` | Pass at 59.50 fps under 4× CPU throttle | Pass |

Claim logs are in `/work/.evidence/roomcode-tactics-verify-4/claims/`.

## Backend, privacy, invalid input, and recovery

- Live health returned 200 with build `7a37e41…`.
- A pass from one room received 403 against another room.
- The live request allowance returned 429 on attempt 25 with
  `Retry-After: 1`; changing the caller-supplied forwarding value stayed at 429.
- A move was accepted, then only revision
  `sf-roomcode-tactics-realtime--0000005` was restarted. Health recovered to
  200, the authenticated room read returned 200, and the move remained locked.
- The clean suite passed missing, short, long, and disallowed names; invalid
  origin; missing pass; wrong room; illegal and repeated moves; completed
  matches; cleanup; full room; failed service; invalid room; and offline
  recovery paths.
- Fresh sample requests remained first-party. Real play contacted only the
  product and its product-owned room service. No tracking, third-party script
  or font, payment, AI request, or outside realtime service was observed.
- Offline play and background updates are not promised. The live offline state
  displayed a reconnect instruction. No service worker is registered.

No credential or room pass is present in the report or evidence.

## Content, controls, accessibility, and routes

- A live sweep of 15 rooms found unique visible seeds, difficulty values 1–5,
  Clear/Rain/Morning mist/Dry wind, and all three marker rules. Reading one room
  again returned the same map for its seed.
- Pointer play, an explicit phone touch tap, default arrows, Enter/Space, and
  persisted remaps for Left=A, Up=W, Right=D, and Down=S all worked live.
- The supplied URL verifier passed in 623 ms with no console errors, one `h1`,
  `lang="en"`, a main landmark, complete image alt coverage, and labelled
  buttons.
- Live Playwright Axe checks found no serious or critical issue on home, demo,
  privacy, terms, or the designed 404. The clean suite also covered the
  high-contrast state. Dialog, skip-link, route, and Back focus passed.
- Every sampled phone target was at least 44×44 CSS px. Home, demo, privacy,
  and terms stayed within 390 CSS px at 200% text. Reduced-motion resolution
  durations were `0.00001s`.
- Home, demo, privacy, terms, robots, sitemap, favicon, touch icon, and social
  image returned 200. `/404.html` and an unknown route returned the expected
  designed page with HTTP 404, navigation, footer, and return action.
- Route titles, canonical links, one-heading structure, legal pages, CSP,
  response-header `frame-ancestors`, strict referrer policy, nosniff, and
  permissions policy passed.

## Build and performance

- `npm run test:all` passed: 8 service tests and 69 browser tests. One desktop
  frame-rate execution was intentionally skipped because the claim runs only in
  the phone project.
- `npm run build` produced `dist/`: 29.06 kB JavaScript raw / 9.51 kB gzip and
  13.51 kB CSS raw / 3.86 kB gzip.
- Live mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.659 s, CLS 0, total blocking time 0 ms,
  and transferred bytes were 149,784.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1 F-01: retention/deletion | Resolved. Clean expiry checks deleted room, move, and pass-hash rows; browser cleanup passed. |
| Verification 1 F-02: request-limit bypass | Resolved. Clean and live forwarding-value rotation stayed at 429 with `Retry-After`. |
| Verification 1 F-03: invisible errors | Resolved. Full-room, failed-service, invalid-room, and offline messages were visible and actionable. |
| Verification 1 F-04: missing-route status | Resolved. Both missing paths returned the designed HTTP 404. |
| Verification 1 F-05: non-opaque passes | Resolved. SQLite held hashes only; the live pass was opaque and cross-room use returned 403. |
| Verification 1 F-06: 200% phone overflow | Resolved. All four app routes reflowed within 390 CSS px. |
| Verification 1 F-07: small touch targets | Resolved. Sampled phone targets measured at least 44×44 CSS px. |
| Verification 1 F-08: route focus | Resolved. Navigation and Back focus checks passed. |
| Verification 1 F-09: incomplete claims | Earlier omissions are listed and run, but the repaired claim wording is incomplete under current F-01. |
| Verification 1 F-10: frame-rate evidence | Resolved. The clean phone claim measured 59.50 fps at 4× throttling. |
| Verification 1 F-11: `dev` build label | Resolved. Footer `2e80293`, byte-matched assets, and service `7a37e41…` agree with release history. |
| Verification 2 F-01: copy, forget, restart, version claims | Resolved. All four exact commands and live paths passed. |
| Review 3 F-01: content floor | Product behavior resolved. Fifteen live rooms proved the content; exact tagged coverage remains incomplete under current F-01. |
| Review 3 F-02: README session and input facts | Copy is present. The 5–10 minute proof is incomplete under current F-01. |
| Review 3 F-03: no remapping | Product behavior resolved. All four live remaps worked; exact tagged coverage remains incomplete under current F-01. |
| Review 3 F-04: draw not claimed | Product behavior resolved. The draw command passes; its combined higher-score/draw assertion is incomplete under current F-01. |

## Evidence and final count

- Evidence directory: `/work/.evidence/roomcode-tactics-verify-4/`
- Findings: **1**
- Untested public claims: **1**
- Final verdict: **FAIL**

Early verifier launches with a wrong client-build expectation, a missing URL
verifier output directory, and missing Lighthouse browser flags ended before
measuring the relevant product path. Corrected fresh runs produced the evidence
reported above.
