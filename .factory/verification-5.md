# Verify a private five-turn match with a friend

## Verdict

**PASS — zero findings of every severity and zero untested public claims.**

The live game works from entry through sample, real win, loss, and draw end
screens. Every declared claim command passes from a clean checkout. All earlier
findings, including low-severity items, are resolved.

## Product and reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation candidate:
  `b14f6f18c608af3cab3580734c83f7951cd949fb`
- Room-service implementation candidate:
  `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation revision and live footer:
  `4e1bac644251b08c1245ee3aab4e0717c955aadd`
- Verification date: 2026-09-06 UTC
- Browsers: fresh Chromium desktop at 1440×900 and phone at 390×844 with 3×
  device scale, plus keyboard, touch, reduced-motion, high-contrast, offline,
  and 200% text checks

The three commits after `b14f6f1` change only `.factory/handoff.md` and
`.factory/repair-result.json`. No runtime source, test, build, or asset file
differs. A clean `VITE_BUILD_SHA=4e1bac6 npm run build` produced JavaScript and
CSS that match the live files byte for byte. The service health response reports
the exact service candidate SHA.

## First screen before scrolling

- Job: plan five simultaneous tactics turns against one friend.
- Audience: two friends who want a short tactical match without accounts or
  live timing.
- First action: create a room, with the sample action beside it.

The desktop first screen showed the job, audience, both actions, three plain
facts, and full board before scrolling. The board began at 152 CSS px. The phone
first screen showed the same information and the start of the game board at
632.75 CSS px in an 844 px viewport. The title is
`Roomcode Tactics — Plan turns with a friend`, and the page uses one plain
`h1`: `Plan turns against a friend`.

## Live game runs

The direct `/demo` route opened a populated Cypress Pass match with Mira, Teo,
scores, markers, board rules, and seed `CYPRESS-01`. The persistent
`Demo — sample data, nothing is saved` label remained visible through all five
turns. Moves `3-5`, `3-4`, `3-3`, `2-3`, and `1-3` reached the actual
**You won** end screen at 2–0. Reload kept the completed state. Reset returned
to turn one. Start for real removed every demo key and left an unrelated real
room sentinel unchanged. The sample made no room-service request.

Two independent live browser contexts created and joined a real room. Five
simultaneous turns reached **You won** at 3–0 and **You lost** for the other
player. Both end states survived reload. A separate two-client match held both
scouts for five turns and reached **The match is a draw** at 0–0. A third client
saw the large room-full recovery message. Copy room link wrote the exact URL;
Forget this room removed only its browser entry; and Create another room
returned to an empty room form.

A fresh desktop pass and a separate fresh phone pass proved all four default
arrow directions, remapped Left=A, Up=W, Right=D, and Down=S, proved each arrow
was replaced, and found all four bindings after reload. The complete sample run
was recorded as WebM, and sample, winner, loser, and draw end screens were
captured as PNG files.

## Declared claim commands

A separate clone at documentation revision `4e1bac6` used Node 22.23.2 and
`npm ci`. Every exact command in the 25-entry `.factory/claims.json` inventory
passed. Every claim id is unique and occurs in exactly one source tag.

| Claim | Result and observed outcome |
| --- | --- |
| `demo-never-saves-real` | Passed on desktop and phone; completed sample left the real sentinel unchanged |
| `no-tracking` | Passed on desktop and phone; landing requests stayed first-party |
| `request-destinations` | Passed on desktop and phone; real play contacted only the game and its room service |
| `restart-demo` | Passed on desktop and phone; reset returned to turn one |
| `settings-persist` | Passed on desktop and phone; still and high-contrast settings survived reload |
| `remappable-controls` | Passed on desktop and phone; all four defaults, A/W/D/S replacements, arrow removal, and reload persistence passed |
| `refresh-rejoin` | Passed on desktop and phone; the saved room returned after reload |
| `copy-room-link` | Passed on desktop and phone; clipboard content exactly matched the room URL |
| `forget-room` | Passed on desktop and phone; only the browser entry was removed |
| `expired-session-cleanup` | Passed on desktop and phone; expired browser entries were removed |
| `free-join` | Passed on desktop and phone; two independent clients joined without account or payment |
| `two-seat-room` | Passed on desktop and phone; a third client received visible recovery text |
| `room-expiry` | Passed in the service sandbox; room, move, and pass-hash rows were deleted |
| `five-turn-match` | Passed on desktop and phone; both clients reached an end screen after five turns |
| `real-match-restart` | Passed on desktop and phone; restart returned to a fresh room form |
| `footer-version` | Passed on desktop and phone; footer matched the checked-out build id |
| `seven-by-seven-map` | Passed on desktop and phone; sample and generated boards had 49 cells in seven columns |
| `seeded-map-content` | Passed; ten rooms proved two 1–5 cycles, all weather and marker rules, closed-trail rejection, and restart repeatability |
| `scoring-draw` | Passed; the exact command proved both higher-score win and equal-score draw |
| `active-session-length` | Passed on desktop and phone; automated complete runs took seconds, below the 10-minute limit |
| `durable-room-state` | Passed across a service restart; the accepted move stayed locked |
| `idempotent-moves` | Passed; repeating a move id did not add another move |
| `opaque-room-pass` | Passed with SQLite inspection; only the fixed-length hash was stored |
| `request-limits` | Passed; caller-supplied forwarding changes did not avoid 429 |
| `resolution-frame-rate` | Passed at 60.00 fps in the isolated run and 59.50 fps in the full suite under 4× CPU throttling |

The landing page, demo, legal pages, README, and game instructions were also
cross-checked for claim-like statements. Each public outcome is covered by the
inventory. No offline, update, audio, payment, AI, matchmaking, or additional
mode promise exists.

## Backend, invalid input, privacy, and recovery

- Live health returned 200 with service build `7a37e41…`.
- A pass from one live room returned 403 against another room.
- The live allowance returned 429 on attempt 25 with `Retry-After: 1`.
  Changing the caller-supplied forwarding value remained 429.
- A move was accepted and locked, then only product revision
  `sf-roomcode-tactics-realtime--0000005` was restarted. Health returned 200
  on the same build, and the same move remained locked. No private pass was
  recorded.
- Clean service checks passed missing, short, long, and disallowed names;
  invalid origins; missing and wrong passes; blocked and repeated moves;
  completed-match boundaries; cleanup; and request limits.
- Clean browser checks passed invalid rooms, failed requests, offline recovery,
  room-full recovery, clipboard, local forget, reload, and match restart paths.
- The offline state gives a visible reconnect instruction. Offline play and
  background updates are not promised, and no service worker is registered.
- Sample requests stayed on the static product origin. Real play contacted only
  the static product and its product-owned room service. No tracking, outside
  script, outside font, advertising, payment, AI request, or third-party
  realtime service was observed.

## Accessibility, routes, and measured quality

- `npm run test:all` passed 8 service tests and 69 browser tests. The only skip
  is the intentional desktop duplicate of the phone-only frame-rate test.
- The production build produced `dist/`: 29.06 kB JavaScript raw / 9.51 kB
  gzip and 13.51 kB CSS raw / 3.86 kB gzip.
- The supplied `verify-url.sh` passed in 676 ms with no console errors, one
  `h1`, `lang="en"`, a main landmark, image alt coverage, and labelled buttons.
- Live Playwright Axe checks found zero serious or critical issues on home and
  privacy. The clean suite also covered demo, terms, high contrast, heading
  structure, and dialog semantics.
- Keyboard checks passed the skip link, board navigation and selection,
  settings-dialog focus and Escape return, client-route heading focus, and Back
  focus restoration. Phone controls met 44×44 CSS px. All app routes reflowed
  within 390 px at 200% text size.
- Reduced motion made the resolution effectively still. There is no sound,
  autoplay, looping motion, or flash.
- Home, demo, privacy, terms, robots, sitemap, favicon, touch icon, and social
  card returned 200. `/404.html` and an unknown URL returned the expected
  designed page with HTTP 404, navigation, footer, title, and return action.
- Route titles, canonical links, legal pages, CSP, response-header
  `frame-ancestors`, strict referrer policy, nosniff, and permissions policy
  passed.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.759 s, CLS was 0, total blocking time was
  0 ms, and transferred bytes were 149,763.

## Earlier finding disposition

| Earlier finding | Current proof |
| --- | --- |
| Verification 1 F-01: retention/deletion | Exact expiry checks delete room, move, and pass-hash rows; browser cleanup passed |
| Verification 1 F-02: request-limit bypass | Clean and live forwarding-value changes remained 429 with `Retry-After` |
| Verification 1 F-03: invisible errors | Full-room, invalid-room, failed-service, and offline messages are visible and actionable |
| Verification 1 F-04: missing-route status | Unknown URLs and `/404.html` return the designed HTTP 404 page |
| Verification 1 F-05: non-opaque passes | Hash-only storage passed; the live pass is opaque and cross-room use returned 403 |
| Verification 1 F-06: 200% overflow | Home, demo, privacy, and terms reflow within the 390 px phone width |
| Verification 1 F-07: small touch targets | Tested phone header, demo, and board controls meet 44 px |
| Verification 1 F-08: route focus | Client navigation and Back focus the meaningful route heading or main target |
| Verification 1 F-09: incomplete claims | All current public statements are listed; all 25 exact commands pass |
| Verification 1 F-10: missing frame evidence | Fresh measurements were 60.00 and 59.50 fps at 4× throttling |
| Verification 1 F-11: `dev` label | Live footer is `4e1bac6`; runtime assets and service SHA match the reviewed candidates |
| Verification 2 F-01: copy, forget, restart, and version inventory | All four exact commands and live paths pass |
| Review 3 F-01: content floor | Two full 1–5 cycles, unique repeatable seeds, all weather rules, and all marker rules pass |
| Review 3 F-02: README session and input facts | README states under 10 minutes and pointer, touch, and keyboard; the claims pass |
| Review 3 F-03: no remapping | All four directions work, replace defaults, and persist on live desktop, live phone, and clean tests |
| Review 3 F-04: draw omitted | The manifest and exact scoring command prove win and draw; live 0–0 draw passed |
| Verification 4 F-01: incomplete exact claim coverage | Expanded tagged tests now prove the full map, scoring, timing, and four-direction wording |
| Earlier Azure Files locking/restart concern | The clean restart claim and a fresh controlled live revision restart both preserved a locked move |

Review 1, review 2, and verification 3 already reported no findings. The two
repair reports were also inspected; their repaired paths are covered above.

## Evidence and final count

Evidence is under `/work/.evidence/roomcode-tactics-verify-5/`. It includes
desktop and phone first screens, sample/winner/loser/draw end screens, a recorded
sample run, the live verification JSON, headers, URL verification, and the
Lighthouse JSON.

The first live harness launch used the implementation SHA where the deployed
documentation build id was expected and stopped before testing product paths.
A later draw click met a transient re-render during one harness run. Corrected
fresh runs completed all paths. The first Lighthouse launch used the wrong
environment variable for its Chromium path and stopped before an audit. These
were verifier setup or timing events, not product failures.

- Findings: **0**
- Untested public claims: **0**
- Final verdict: **PASS**
