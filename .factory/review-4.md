# Review: Play a private five-turn tactics match with a friend

## Verdict

**PASS — zero findings of every severity and zero untested public claims.**

## Reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation candidate:
  `b14f6f18c608af3cab3580734c83f7951cd949fb`
- Room-service implementation candidate:
  `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation revision at review start:
  `dbd0479a7c6c9266d3475b1aec87c14fbd1d4044`
- Live browser footer/build revision:
  `4e1bac644251b08c1245ee3aab4e0717c955aadd`
- Review date: 2026-09-06 UTC

Commits after `b14f6f1` contain no browser runtime changes. The room-service
source has not changed since `7a37e41`. A clean build with
`VITE_BUILD_SHA=4e1bac6` matched the live `index.html`, JavaScript, and CSS
byte for byte. Live health returned the exact room-service implementation SHA.

## First screen before scrolling

- Job: plan five simultaneous tactics turns against one friend.
- Audience: two friends who want a short tactical match without accounts or
  live timing.
- First action: create a room, with the sample action beside it.

Fresh Chromium contexts at 1440×900 and 390×844 showed the job, audience,
actions, three facts, and playable board before scrolling. The board began at
152 CSS px on desktop and 632.75 CSS px on phone. The title was
`Roomcode Tactics — Plan turns with a friend`; the one `h1` was
`Plan turns against a friend`. Visual inspection found a clear folded-map game
surface rather than a menu wall or generic landing template.

## Live game runs

The one-click sample was entered from the landing page on fresh desktop and
phone contexts. It immediately showed the populated Cypress Pass match, Mira,
Teo, scores, objectives, rules, and seed `CYPRESS-01`. The persistent
`Demo — sample data, nothing is saved` label remained through all five turns.
Moves `3-5`, `3-4`, `3-3`, `2-3`, and `1-3` reached the actual **You won** end
screen at 2–0. Desktop used keyboard and pointer; phone used touch. Both runs
were recorded as WebM, and both end screens were captured.

All four default arrow directions worked on the live sample. Remapping
Left=A, Up=W, Right=D, and Down=S replaced each arrow and the new bindings
worked. The declared test also proved all four persisted after reload on
desktop and phone. Reset returned the sample to turn one. Start for real
removed every demo key and left an unrelated real-room sentinel unchanged.
The sample made no room-service request.

Two independent live browser contexts created and joined a real room. Five
simultaneous turns reached **You won** at 3–0 and **You lost** for the other
player. Both end states survived reload. A separate two-client match held both
scouts for five turns and reached **The match is a draw** at 0–0. A third
client received the visible room-full recovery message. Copy room link wrote
the exact URL; Forget this room removed only its browser entry; and Create
another room returned to a fresh room form.

## Declared claims from a clean checkout

A separate clean clone at documentation revision `dbd0479` used Node 22.23.2
and `npm ci`. Runtime files are unchanged from candidate `b14f6f1`. Every exact
command in the 25-entry `.factory/claims.json` inventory passed. Each id is
unique and occurs in exactly one source tag.

| Claim | Result |
| --- | --- |
| `demo-never-saves-real` | Passed on desktop and phone; sample completion left real storage unchanged |
| `no-tracking` | Passed on desktop and phone; landing requests stayed first-party |
| `request-destinations` | Passed on desktop and phone; real play used only the product and its room service |
| `restart-demo` | Passed on desktop and phone; reset returned to turn one |
| `settings-persist` | Passed on desktop and phone; still and high-contrast settings survived reload |
| `remappable-controls` | Passed on desktop and phone for all defaults, all four replacements, arrow removal, and reload persistence |
| `refresh-rejoin` | Passed on desktop and phone; the saved room returned after reload |
| `copy-room-link` | Passed on desktop and phone; clipboard content matched the exact room URL |
| `forget-room` | Passed on desktop and phone; only the browser entry was removed |
| `expired-session-cleanup` | Passed on desktop and phone; expired browser entries were removed |
| `free-join` | Passed on desktop and phone with two independent clients and no account or payment |
| `two-seat-room` | Passed on desktop and phone; a third client received visible recovery text |
| `room-expiry` | Passed; room, move, and pass-hash rows were deleted |
| `five-turn-match` | Passed on desktop and phone; both clients reached an end screen after five turns |
| `real-match-restart` | Passed on desktop and phone; restart returned to a fresh room form |
| `footer-version` | Passed on desktop and phone; footer matched the checked-out build id |
| `seven-by-seven-map` | Passed on desktop and phone; sample and generated boards had 49 cells in seven columns |
| `seeded-map-content` | Passed; two 1–5 cycles, every weather and marker rule, closed trails, and restart repeatability were proved |
| `scoring-draw` | Passed; the exact test proved both a higher-score win and equal-score draw |
| `active-session-length` | Passed on desktop and phone below the 10-minute active-play limit |
| `durable-room-state` | Passed across a service restart; the accepted move stayed locked |
| `idempotent-moves` | Passed; repeating a move id did not add another move |
| `opaque-room-pass` | Passed with SQLite inspection; only the fixed-length hash was stored |
| `request-limits` | Passed; caller-supplied forwarding changes did not avoid 429 |
| `resolution-frame-rate` | Passed at 58.00 fps under 4× CPU throttling |

The live home, demo, privacy, terms, game instructions, and README were
cross-checked for claim-like statements. Every public outcome is in the
inventory. No offline play, background update, sound, payment, AI,
matchmaking, or extra-mode promise exists. AI assistance would not improve the
brief's deterministic two-player tactics job, so its absence is not missed
leverage.

## Backend, invalid input, privacy, and recovery

- Live health returned 200 with service build `7a37e41…`.
- A pass from one room returned 403 against another room.
- The live allowance returned 429 on attempt 25 with `Retry-After: 1`.
  Changing the caller-supplied forwarding value remained 429.
- A move was accepted and locked before only product revision
  `sf-roomcode-tactics-realtime--0000005` was restarted. Health recovered on
  the same build, and the move remained locked. No private pass was recorded.
- Clean service checks passed missing, short, long, and disallowed names;
  invalid origins; missing and wrong passes; closed-trail and repeated moves;
  completed-match boundaries; cleanup; and request limits.
- Clean browser checks passed invalid rooms, failed requests, offline
  recovery, room-full recovery, clipboard, local forget, reload, and restart.
- Home and sample requests used only the static product origin. Real play used
  only the static product and its product-owned room service. No tracking,
  outside script, outside font, advertising, payment, or AI request appeared.
- Offline play and background updates are not promised. The offline state gives
  a visible reconnect instruction, and no service worker is registered.

## Accessibility, routes, and measured quality

- `npm run test:all` passed 8 service tests and 69 browser tests. The only skip
  is the intended desktop duplicate of the phone-only frame-rate test.
- `VITE_BUILD_SHA=4e1bac6 npm run build` produced `dist/`: 29.06 kB JavaScript
  raw / 9.51 kB gzip and 13.51 kB CSS raw / 3.86 kB gzip.
- The supplied `verify-url.sh` passed in 639 ms with no console errors, one
  `h1`, `lang="en"`, a main landmark, image alt coverage, and labelled buttons.
- Fresh live Axe checks found zero serious or critical issues on home, demo,
  privacy, terms, the explicit 404, the unknown-route 404, and high contrast.
- Keyboard checks passed the skip link, board navigation and selection,
  settings-dialog focus and Escape return, route heading focus, and Back focus.
- Live phone controls measured at least 44×44 CSS px. Home, demo, privacy, and
  terms reflowed within 390 px at 200% text.
- Reduced motion set scout resolution durations to `0.00001s`. There is no
  sound, autoplay, looping motion, or flash.
- Home, demo, privacy, terms, robots, sitemap, favicon, touch icon, and social
  card returned 200. `/404.html` and an unknown path returned the expected
  designed page with HTTP 404, navigation, footer, and a return action.
- Route titles, canonical links, legal pages, CSP, response-header
  `frame-ancestors`, strict referrer policy, nosniff, and permissions policy
  passed.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.726 s, CLS was 0, total blocking time was
  27 ms, and transferred bytes were 149,775.

## Earlier finding disposition

| Earlier finding | Fresh disposition |
| --- | --- |
| Verification 1 F-01: retention/deletion | Resolved. Expiry deleted room, move, and pass-hash rows; browser cleanup passed. |
| Verification 1 F-02: request-limit bypass | Resolved. Clean and live forwarding-value changes remained 429 with `Retry-After`. |
| Verification 1 F-03: invisible errors | Resolved. Full-room, invalid-room, failed-service, and offline errors were visible and actionable. |
| Verification 1 F-04: missing-route status | Resolved. Unknown URLs and `/404.html` returned the designed HTTP 404 page. |
| Verification 1 F-05: non-opaque passes | Resolved. Hash-only storage passed; a live pass was opaque and cross-room use returned 403. |
| Verification 1 F-06: 200% overflow | Resolved. All app routes reflowed within the phone width. |
| Verification 1 F-07: small touch targets | Resolved. Live phone header, demo, and board controls met 44 px. |
| Verification 1 F-08: route focus | Resolved. Client navigation and Back restored meaningful focus. |
| Verification 1 F-09: incomplete claims | Resolved. All 25 public claims have one exact tagged test and passed. |
| Verification 1 F-10: missing frame evidence | Resolved. Fresh phone measurement was 58.00 fps at 4× throttling. |
| Verification 1 F-11: `dev` label | Resolved. Live footer is `4e1bac6`; assets and service SHA match reviewed versions. |
| Verification 2 F-01: missing copy, forget, restart, and version claims | Resolved. All four exact commands and live paths passed. |
| Review 3 F-01: content floor | Resolved. The generator has a visible repeatable seed, two complete 1–5 cycles, and every weather and marker rule. |
| Review 3 F-02: README session and input facts | Resolved. The opening states under 10 minutes and pointer, touch, and keyboard; both are tested. |
| Review 3 F-03: no remapping | Resolved. All four directions remap, replace defaults, and persist. |
| Review 3 F-04: draw omitted | Resolved. The manifest and exact command cover a higher-score win and equal-score draw; both live end states passed. |
| Verification 4 F-01: incomplete exact claim coverage | Resolved. The expanded tagged tests prove the full map, scoring, timing, and four-direction wording. |

Review 1, review 2, verification 3, and verification 5 reported no findings.
Their paths were rechecked above. Repair reports were also inspected.

## Evidence and final count

Evidence is under `/work/.evidence/roomcode-tactics-review-4/`. It includes
fresh first-screen captures, desktop and phone sample recordings, sample and
real end screens, all 25 exact command logs, live verification JSON, restart
persistence, request origins, accessibility and route results, URL verification,
response headers, build output, the full-suite log, and Lighthouse JSON.

The first live harness attempt occurred before dependencies were installed and
stopped without opening a browser. The documented `npm ci` prerequisite was
then applied before all measured runs. Two draft structure checks used reviewer
assertions that did not match the product's actual terms heading and valid Back
focus target; corrected fresh checks passed. These were reviewer setup errors,
not failed product paths.

- Findings: **0**
- Untested public claims: **0**
- Final verdict: **PASS**
