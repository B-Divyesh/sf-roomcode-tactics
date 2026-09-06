# Review: Play a private five-turn tactics match with a friend

## Verdict

**PASS — zero findings and zero untested public claims.**

## Reviewed versions

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation candidate: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Live browser documentation/release revision: `1e1abb188103166edb4a0a0a30d4075e9600a750`
- Live room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Report revision at review start: `596814c385e6926ee8f85186a00d20c584772606`
- Review date: 2026-09-06 UTC

The documentation/release revision differs from the implementation candidate
only in `.factory` records. A clean build at `1e1abb1` matched deployed
`index.html`, JavaScript, and CSS byte-for-byte. The live footer showed
`1e1abb1`; `/health` reported the service implementation above.

## First screen before scrolling

- Job: plan five simultaneous tactics turns with one friend.
- Audience: two friends who want a short match without accounts or live timing.
- First action: create a room, or use the sample beside it.

Fresh Chromium at 1440×900 and fresh phone Chromium at 390×844 showed the
plain-language title, audience, both actions, three facts, and the playable
board before scrolling. Board top positions were 152 CSS px desktop and
632.75 CSS px phone. The first screen is the game board, not a menu wall.

## Live game runs

The direct `/demo` sample opened the populated Cypress Pass match with Mira
and Teo. Its persistent `Demo — sample data, nothing is saved` label remained
through five deterministic resolutions (`3-5`, `3-4`, `3-3`, `2-3`, `1-3`) to
the **You won** end screen. Reload retained the end state. Reset returned it to
turn 1 and zero score. Start for real removed demo keys while an unrelated real
room sentinel was unchanged; demo requests stayed on the product origin.

Two independent live browser contexts created and joined a room, completed all
five simultaneous turns, and reached persistent **You won** and **You lost**
end screens. A third client received the visible two-seat recovery message.
Copy room link wrote the exact URL. Forget this room removed only its browser
entry; the authenticated shared room still returned 200. Create another room
returned the winner to a blank create-room form.

Evidence: `/work/.evidence/roomcode-tactics-review-2/live/` contains first
screens, sample and real end-screen captures, and `live-verification.json`.

## Claims and clean checkout

From a separate clean checkout at `bc1d448`, after `npm ci`, every exact
command in the 21-entry `.factory/claims.json` inventory passed. Each claim id
has exactly one `@claim:` tag. Logs are in
`/work/.evidence/roomcode-tactics-review-2/claims/`.

The phone frame-rate command measured 57.00 fps at 4× CPU throttling; the full
suite independently measured 58.00 fps. Both exceed the declared 55 fps
floor. `npm run test:all` passed six service tests and 63 browser tests, with
one intentional desktop skip of the phone-only frame test. `npm run build`
passed and produced `dist/` (25.61 kB JS raw / 8.48 kB gzip; 12.00 kB CSS raw /
3.56 kB gzip).

No unlisted public privacy, storage, game, performance, price, mode, offline,
or update claim was found in the live copy or README. Offline play and
background updates are not promised; the tested offline recovery gives a clear
reconnect action. There is no service worker or advertised extra game mode.

## Backend, recovery, privacy, and invalid paths

- Live health returned 200 with the expected service revision.
- A valid opaque pass returned 403 against a different room.
- Live request 31 returned 429 with `Retry-After: 5`; changing a supplied
  forwarding value remained 429.
- Clean service checks passed durable accepted-move recovery after restart,
  idempotent move submission, 24-hour cleanup of room/move/pass-hash data, and
  invalid, boundary, missing-pass, and invalid-origin recovery paths.
- Clean browser checks passed invalid-room, failed-request, offline, reload,
  completed-match, full-room, clipboard, and room-forget recovery paths.
- Fresh landing requests were first-party. Real play contacted only the product
  and its product-owned room service. No tracking, payment, AI, third-party
  font/script, or public-matchmaking request was observed.

## Accessibility, routes, and measured quality

- The supplied `verify-url.sh` passed in 674 ms with no console errors, one
  `h1`, `lang="en"`, a `main`, complete image alt coverage, and labelled buttons.
- Live Axe found no serious or critical violations on home and privacy. The
  clean suite also covered demo, terms, high contrast, keyboard board controls,
  skip link, dialog focus/Escape, route and Back focus, 44 px touch targets,
  200% reflow, and reduced motion.
- Home, demo, privacy, terms, robots, sitemap, favicon, touch icon, and social
  image returned 200. `/404.html` and an unknown route returned the intentional
  designed page with HTTP 404, navigation, footer, and return action.
- Route titles, legal pages, links, CSP, `frame-ancestors`, strict referrer
  policy, nosniff, and permissions policy passed.
- Fresh live Lighthouse: performance 100, accessibility 100, best practices
  100, SEO 100; LCP 1.603 s, CLS 0, total blocking time 0 ms, transfer 148,358
  bytes. Report: `/work/.evidence/roomcode-tactics-review-2/lighthouse/report.json`.

## Earlier findings

Every earlier review and verification finding, including minor items, remains
resolved and was rechecked:

| Earlier finding | Current evidence |
| --- | --- |
| Retention/deletion | Short-retention service claim deletes room, move, and pass-hash rows; browser expired-session cleanup passes. |
| Allowance bypass | Clean and live forwarding-value checks stay at 429 with `Retry-After`. |
| Hidden errors | Full-room, network, and invalid-room feedback is visible, focused, and actionable. |
| Missing-route status | Unknown path and `/404.html` are designed HTTP 404 responses. |
| Non-opaque room passes | Hash-only service claim and live cross-room 403 pass. |
| 200% reflow | All app routes reflow within the phone width. |
| Small touch targets | Header, demo, and board controls meet 44 px checks. |
| Missing route focus | Client navigation and Back move focus to the correct heading. |
| Incomplete claims | All 21 outcomes have one exact command and passed. |
| Missing frame-rate evidence | Fresh phone measurements were 57.00 and 58.00 fps at 4× throttling. |
| Build label/provenance | Footer, health revision, candidate diff, and byte-for-byte release assets agree. |
| Copy, forget, restart, footer outcomes | Their four tagged clean tests and live flows passed. |

## Final count

- Findings: **0**
- Untested public claims: **0**
- Final verdict: **PASS**

The initial live-verifier and Lighthouse launches had reviewer setup mistakes
(dependencies in the wrong checkout and missing Chrome launch flags). They did
not exercise a product path. The corrected documented clean setup and
explicit Chromium run produced the passing evidence above.
