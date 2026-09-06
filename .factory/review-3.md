# Review: Play a private five-turn tactics match with a friend

## Verdict

**FAIL — 4 findings (3 medium, 1 low) and zero untested public claims.**

## Reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation candidate: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Live browser documentation/release revision: `1e1abb188103166edb4a0a0a30d4075e9600a750`
- Live room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Documentation base at review start: `08792f3c103c4fb4eae4d50ff0171550f90a8486`
- Review date: 2026-09-06 UTC

The candidate-to-documentation diff contains only `.factory` records. A clean
build at `1e1abb1` matched the deployed `index.html`, JavaScript, and CSS
byte-for-byte. The live footer showed `1e1abb1`; live health reported the room
service implementation above.

## Findings

### F-01 — Medium — The game does not meet the required content floor

The games-lane contract requires at least 20 levels or a procedural generator
with a seed shown on screen. Roomcode Tactics has three fixed maps: Cypress
Pass, Sandbar Crossing, and Pine Fork. The researched brief also calls for maps
to rotate through weather and objective rules. The three maps change blocked
squares, objective positions, and a weather label, but all use the same marker
rule and weather has no effect on play. The visual thesis also records no
difficulty curve.

This does not break a single match, but it leaves the shipped game below the
required amount and variety of repeatable content. Add at least 20 tested maps,
or a deterministic procedural generator with its seed visible. Weather and
objective-rule variants must change play rather than only labels or positions.

### F-02 — Low — The README omits required session and input facts

The browser-game contract requires the README opening to state the intended
session length and supported inputs. The opening explains the five decisions,
two players, and room flow, but it gives no intended time and does not say that
the board supports pointer, touch, and keyboard play. The later testing section
mentions keyboard tests, which is not player-facing control guidance.

Add the intended session length and supported inputs to the first paragraph.
Any quantitative duration statement must also be declared and measured under
the claims contract.

### F-03 — Medium — Keyboard controls cannot be remapped

The board supports Tab, arrow keys, Enter, and Space, and those paths passed.
The settings dialog only offers still effects and high-contrast colors. There
is no way to change the keyboard mapping, despite the games-lane requirement
for remappable keys. Add a keyboard-controls setting, persist it locally, and
cover both default and changed mappings with keyboard tests.

### F-04 — Medium — The public draw rule is missing from the claim inventory

Every completed-match screen says, “More markers wins; equal scores draw.”
`.factory/claims.json` has a five-turn completion claim and winner test, but it
does not list this scoring/draw outcome. No `@claim:` test reaches a draw.

A fresh live two-client run held both scouts in place for five rounds and
reached the actual **The match is a draw** screen at 0–0, so the statement is
true and is not counted as untested in this review. It still violates the
required one-public-claim-to-one-tagged-test inventory. Add the rule to the
claim inventory with a deterministic draw test.

## First screen before scrolling

- Job: plan five simultaneous tactics turns with one friend.
- Audience: two friends who want a short match without accounts or live timing.
- First action: create a room, or use the sample beside it.

Fresh Chromium at 1440×900 and fresh phone Chromium at 390×844 showed the
plain title, audience, both actions, three facts, and board before scrolling.
The board began at 152 CSS px on desktop and 632.75 CSS px on phone. The title
names the job, the words are direct, and the first screen shows the game rather
than a menu wall.

## Live game runs

The direct sample opened the populated Mira-versus-Teo Cypress Pass match. The
persistent `Demo — sample data, nothing is saved` label remained through five
deterministic turns to **You won** on desktop and phone. Reload restored the end
state; Reset demo returned to turn 1 and zero score. Start for real removed the
demo namespace while an unrelated real-room sentinel stayed unchanged. The
sample sent no request outside the product origin.

Two independent live clients created and joined a room, submitted five turns,
and reached persistent **You won** and **You lost** screens. A third client saw
the focused two-seat recovery message. Copy room link wrote the exact URL;
Forget this room removed only its browser entry; the authenticated room still
returned 200. Create another room returned to the empty form.

A second independent two-client run held both scouts for five turns and reached
the 0–0 draw screen. Phone play also proved board arrow keys and Space,
settings-dialog focus and Escape return, reduced motion, reload, reset, and a
complete end screen.

Evidence:

- `/work/.evidence/roomcode-tactics-review-3/live/sample-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-3/live/phone-sample-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-3/live/real-winner-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-3/live/real-loser-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-3/live/real-draw-end-screen.png`
- `/work/.evidence/roomcode-tactics-review-3/live/live-verification.json`

## Declared claims and clean checkout

From a separate clean checkout at `bc1d448`, after `npm ci`, every exact command
in the 21-entry `.factory/claims.json` inventory passed. Every id occurs in
exactly one source tag.

| Claim | Result |
| --- | --- |
| `demo-never-saves-real` | Pass on desktop and phone |
| `no-tracking` | Pass on desktop and phone |
| `request-destinations` | Pass on desktop and phone |
| `restart-demo` | Pass on desktop and phone |
| `settings-persist` | Pass on desktop and phone |
| `refresh-rejoin` | Pass on desktop and phone |
| `copy-room-link` | Pass on desktop and phone |
| `forget-room` | Pass on desktop and phone |
| `expired-session-cleanup` | Pass on desktop and phone |
| `free-join` | Pass on desktop and phone |
| `two-seat-room` | Pass on desktop and phone |
| `room-expiry` | Pass in service sandbox |
| `five-turn-match` | Pass on desktop and phone |
| `real-match-restart` | Pass on desktop and phone |
| `footer-version` | Pass on desktop and phone |
| `seven-by-seven-map` | Pass on desktop and phone |
| `durable-room-state` | Pass across service restart |
| `idempotent-moves` | Pass in service sandbox |
| `opaque-room-pass` | Pass with SQLite inspection |
| `request-limits` | Pass in service sandbox |
| `resolution-frame-rate` | Pass at 60.00 fps under 4× CPU throttle |

The fresh manual draw run closes the only public outcome not covered by a
declared command, leaving zero untested claims. F-04 records the missing
repeatable inventory coverage.

## Backend, invalid input, privacy, and recovery

- Live health returned 200 and service build `00afddae…`.
- One live room pass returned 403 against a different room.
- Live request 31 returned 429 with `Retry-After: 5`; changing a supplied
  forwarding value remained 429.
- The clean restart claim saved a move before response, restarted the service
  against the same SQLite files, and found the move still locked. The live
  service implementation is unchanged from the earlier controlled restart.
- Clean service tests covered missing, short, long, and disallowed names;
  invalid origin, missing pass, wrong room, illegal and repeated moves,
  completed matches, cleanup, and allowance boundaries.
- Clean browser tests covered invalid room, failed request, offline, reload,
  full room, clipboard, local forget, and completed-match recovery.
- Landing and demo requests stayed first-party. Real play contacted only the
  product and its product-owned room service. No analytics, advertising,
  payment, AI, external realtime service, or third-party font/script appeared.
- Offline play and background updates are not promised. The tested offline
  state gives a visible reconnect instruction.

## Accessibility, routes, and measured quality

- `npm run test:all` passed 6 service tests and 63 browser tests. The one skip
  is the intentional desktop copy of the phone-only frame-rate test.
- `npm run build` passed and created `dist/`: 25.61 kB JavaScript raw / 8.48 kB
  gzip and 12.00 kB CSS raw / 3.56 kB gzip.
- The supplied `verify-url.sh` passed in 664 ms with no console errors, one
  `h1`, `lang="en"`, a `main`, image alt coverage, and labelled buttons.
- Live Axe found no serious or critical issue. The full suite also covered
  legal routes, demo, high contrast, skip link, board keyboard controls,
  dialog focus, route and Back focus, 44 px targets, 200% reflow, and reduced
  motion.
- Home, demo, privacy, terms, robots, sitemap, favicon, touch icon, and social
  image returned 200. `/404.html` and an unknown path returned the intentional
  designed page with HTTP 404, navigation, footer, and return action.
- Route titles, legal pages, links, CSP, response-header `frame-ancestors`,
  referrer policy, nosniff, and permissions policy passed.
- Fresh live Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.581 s, CLS 0, total blocking time 44 ms,
  and transfer size 148,379 bytes.
- The isolated phone claim measured 60.00 fps; the full suite independently
  measured 59.00 fps at 4× CPU throttling. Both exceed the 55 fps floor.

## Earlier finding disposition

| Earlier finding | Current evidence |
| --- | --- |
| Retention/deletion | Room, move, and pass-hash cleanup and browser expired-entry cleanup passed. |
| Allowance bypass | Clean and live forwarding-value checks remained at 429 with `Retry-After`. |
| Hidden errors | Full-room, network, and invalid-room feedback stayed visible, focused, and actionable. |
| Missing-route status | Unknown URL and `/404.html` returned the designed HTTP 404 page. |
| Non-opaque passes | Hash-only SQLite inspection and live cross-room 403 passed. |
| 200% reflow | Home, demo, privacy, and terms stayed within the phone width. |
| Small touch targets | Header, demo, and enabled board controls met 44 px checks. |
| Missing route focus | Client navigation and Back focused the correct heading. |
| Initial incomplete claim inventory | The removed time claim and the durable-write, idempotency, destination, and limit claims now have coverage. |
| Four later missing outcomes | Copy, forget, restart, and footer-version claims all passed; F-04 is a newly identified draw-rule gap. |
| Missing frame-rate evidence | Fresh measurements were 60.00 and 59.00 fps at 4× throttling. |
| Build label/provenance | Footer, health revision, candidate diff, and byte-for-byte release assets agree. |

## Final count

- Findings: **4**
- Untested public claims: **0**
- Final verdict: **FAIL**

The first phone-only focus probe and first worker URL invocation stopped on
reviewer command mistakes before measuring a product failure. Corrected runs
passed and replaced those outputs. No product code or live resource was
changed during this review.
