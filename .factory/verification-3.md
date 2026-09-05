# Verify a private five-turn match with a friend

## Verdict

**PASS — zero findings and zero untested public claims.**

## Candidate and live version

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation reviewed: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Documentation/release revision: `1e1abb188103166edb4a0a0a30d4075e9600a750`
- Verification date: 2026-09-05 UTC

`1e1abb1` changes only `.factory` report metadata from the implementation
candidate. The deployed footer says `1e1abb1`, and a fresh build at that
revision matched the live JavaScript and CSS byte-for-byte. The game runtime
source is unchanged from `bc1d448`; the build id is injected during the static
build. The live service health response reported `00afddae…`.

## First screen and game run

- Job: plan five simultaneous tactics turns with one friend.
- Audience: two friends who want a short match without accounts or live timing.
- First action: create a room, or open the sample beside it.

Fresh desktop (1440×900) and phone (390×844, 3× DPR) contexts showed those
items, the three facts, and the game board before scrolling. The board began
at 152 px on desktop and 632.75 px on phone.

The direct sample loaded the populated Mira-versus-Teo Cypress Pass game and
kept the `Demo — sample data, nothing is saved` label visible. The deterministic
five moves reached **You won**; reload retained the outcome; Reset demo returned
to turn one; Start for real removed only demo data and preserved a real-data
sentinel. The sample made no room-service request.

Two independent live clients created and joined a room, completed five rounds,
and reached **You won** and **You lost**. Both end states survived reload. A
third client got the visible two-seat recovery message. Copy room link wrote
the exact room URL; Forget this room removed the local entry while the shared
room still returned 200; Create another room returned the winner to the fresh
room form. Screenshots and machine evidence are in
`/work/.evidence/roomcode-tactics-verify-3/live/`.

## Claims and tests

From a separate clean clone of `bc1d448` after `npm ci`:

- All 21 exact commands in `.factory/claims.json` passed.
- Inventory audit found 21 claim ids and exactly one `@claim:<id>` source tag
  for every id.
- `npm run test:all` passed: 6 service tests and 63 browser tests. One desktop
  execution of the phone-only frame-rate test was intentionally skipped.
- `npm run build` passed and created `dist/`: JavaScript 25.61 kB raw / 8.48 kB
  gzip; CSS 12.00 kB raw / 3.56 kB gzip.
- The independent phone claim measured 60.00 fps at 4× CPU throttling, above
  the advertised 55 fps floor.

The full claim logs are in `/work/.evidence/roomcode-tactics-verify-3/claims/`.
There were no extra public performance, privacy, storage, room, or game claims
in the landing page, legal pages, demo documentation, or README without a
matching declared test.

## Live service, recovery, and privacy

- Health returned 200 and the expected service implementation revision.
- A valid pass for one room was rejected for another with 403.
- Repeated live requests reached 429 after 31 attempts with `Retry-After: 4`.
  Changing the caller-supplied forwarding value remained 429.
- The clean service claim proved an accepted move survives a restart against the
  same SQLite data. The prior controlled live restart record remains current;
  no deployment or service restart was performed during this no-deploy review.
- Normal play, invalid room, invalid/boundary names, missing pass, invalid
  origin, completed-move, full-room, offline, and reload recovery paths passed
  in the clean service/browser suite. The live full-room recovery path also
  passed.
- Fresh landing requests stayed first-party; real play contacted only the
  product and its product-owned room service. No analytics, third-party fonts,
  payment, AI request, public matchmaking, or offline/update promise was found.

## Accessibility, routes, and release checks

- Playwright axe found no serious or critical violations on the live home and
  privacy pages; the full suite also covered demo, legal pages, and high
  contrast.
- Keyboard skip link, board arrows, dialog focus/Escape return, route-heading
  focus, Back restoration, reduced motion, 44 px phone targets, and 200% text
  reflow passed.
- Home, demo, privacy, terms, robots, sitemap, and favicon returned 200.
  `/404.html` and an unknown route returned the designed 404 with a return
  action; those deliberate 404s are expected, not defects.
- Each route had its expected title and one heading. Live console evidence had
  no unexpected errors; the only entries were the deliberate 409 full-room and
  deliberate 404 route checks.
- Live response headers include CSP, `frame-ancestors 'none'`, strict referrer
  policy, nosniff, and restrictive permissions policy.

## Earlier finding disposition

All findings from verification 1 and 2 remain resolved: retention deletion,
request-limit identity, visible recovery errors, designed 404 response, opaque
passes, 200% reflow, touch targets, route focus, claim inventory, measured
frame rate, and accurate build provenance. The four claim-inventory outcomes
from verification 2 (clipboard copy, forget, real-match restart, and footer
version) each passed their clean tagged test and the live flow.

Evidence directory: `/work/.evidence/roomcode-tactics-verify-3/`.
