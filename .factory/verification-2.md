# Verify a private five-turn match with a friend

## Verdict

**FAIL — 1 medium-severity finding. Zero public claims were left untested.**

The game, sample, room service, accessibility paths, and all 17 declared claim
commands pass. The product is not accepted because four public outcomes are
missing from the repeatable claims inventory.

## Product and candidate

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser and service implementation reviewed:
  `00afddae428a00b80338364df067348476f61718`
- Documentation revision reviewed:
  `1e629d5913251dc029d9178836d4662515a1c54e`
- Verification date: 2026-09-05 UTC
- Browsers: fresh Playwright Chromium desktop at 1440×900 and phone at
  390×844 with 3× DPR, plus keyboard, reduced-motion, high-contrast, offline,
  and 200% text-size contexts

No product runtime file differs between the implementation and documentation
revisions. The live JavaScript and CSS names and SHA-256 hashes match a clean
build of the reviewed source. The live client footer shows documentation build
`1e629d5`; the room-service health response reports implementation build
`00afddae428a00b80338364df067348476f61718`. The later documentation and
verification-tooling changes do not change the game runtime.

## First screen before scrolling

- Job: plan five simultaneous tactics turns against one friend.
- Audience: two remote friends who want a short match without accounts or live
  timing.
- First action: create a room, or open the one-click sample beside it.
- Desktop: the job, audience, both actions, three facts, and full board were
  visible before scrolling; the board began at 152 CSS px in a 900 px viewport.
- Phone: the same job, audience, actions, facts, and the start of the game board
  were visible; the board began at 632.75 CSS px in an 844 px viewport.

## Finding

### F-01 — Medium — The public claim inventory is incomplete

Four public outcomes are absent from `.factory/claims.json`, so no exact tagged
claim command runs them on every build:

1. **Copy room link** promises that the room URL reaches the clipboard.
2. The privacy page says **Forget this room** removes the browser entry while
   the shared room remains until automatic deletion.
3. The real end screen promises **Create another room**, which is the required
   one-action restart from a completed multiplayer match.
4. The terms page says the footer shows the **current version**.

Independent live checks proved all four outcomes: clipboard text equalled the
room URL; forgetting removed the local room key while an authenticated service
read still returned 200; the real winner screen returned to a fresh room form;
and the footer build matched the deployed documentation revision while the
runtime assets matched the implementation candidate. The existing ordinary
copy-result and build-format checks are not tagged claims, and the forget and
real restart outcomes have no clean-checkout regression test. This is an
inventory and repeatability defect, not a failed live user path.

Finding count: 1. Untested public claim count: 0, because the verifier exercised
each omitted outcome directly. The claims contract still requires each one to
be listed with a tagged sandbox command.

## Declared claim commands

Every exact command in `.factory/claims.json` ran from a separate clean checkout
of documentation revision `1e629d5` after `npm ci`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-never-saves-real` | Pass, 2 browser projects | isolated sample completed; real sentinel unchanged |
| `no-tracking` | Pass, 2 browser projects | fresh landing requests stayed first-party |
| `request-destinations` | Pass, 2 browser projects | real match contacted only the client and room service |
| `restart-demo` | Pass, 2 browser projects | completed sample reset to turn 1 |
| `settings-persist` | Pass, 2 browser projects | still and high-contrast settings survived reload |
| `refresh-rejoin` | Pass, 2 browser projects | saved room returned after reload |
| `expired-session-cleanup` | Pass, 2 browser projects | expired browser room entry was removed |
| `free-join` | Pass, 2 browser projects | two independent clients joined without account or payment |
| `two-seat-room` | Pass, 2 browser projects | third client received a large visible recovery message |
| `room-expiry` | Pass, service test | room, move, and pass-hash rows were deleted |
| `five-turn-match` | Pass, 2 browser projects | winner and loser end screens appeared and reloaded |
| `seven-by-seven-map` | Pass, 2 browser projects | sample and three rotating maps each had 49 cells |
| `durable-room-state` | Pass, service test | accepted move survived service restart |
| `idempotent-moves` | Pass, service test | repeated move id did not add a move |
| `opaque-room-pass` | Pass, service test | opaque pass worked and only its hash was stored |
| `request-limits` | Pass, service test | caller-supplied forwarding rotation did not bypass 429 |
| `resolution-frame-rate` | Pass, phone project | 60.00 fps at 4× CPU throttling, above the 55 fps floor |

There are 17 claim logs under
`/work/.evidence/roomcode-tactics-verify-2/claims/`.

## Live game runs

The direct `/demo` entry opened the populated Cypress Pass match with Mira and
Teo, scores, objectives, and the persistent “Demo — sample data, nothing is
saved” label. Moves `3-5`, `3-4`, `3-3`, `2-3`, and `1-3` reached the actual
“You won” screen. Reload restored the end state. Reset returned to turn 1.
Starting for real removed demo keys, left a seeded real-room entry unchanged,
and made no room-service request.

Two fresh, independent contexts created and joined a real room, submitted five
simultaneous turns, and reached “You won” and “You lost” end screens. Both end
states survived reload. A third context received a visible two-seat error. A
second completed live match proved “Create another room” returns to the fresh
room form. Winner, loser, sample end-screen, phone, and desktop images are in
`/work/.evidence/roomcode-tactics-verify-2/live/`.

## Backend, privacy, and recovery

- `/health` returned 200 with implementation SHA `00afdda…`.
- A valid pass from one room received 403 on another room.
- New live passes were opaque.
- Restarting only revision `sf-roomcode-tactics-realtime--0000004` preserved a
  newly created room; authenticated reads returned 200 before and after, and
  health returned 200 afterward.
- Live repeated requests reached 429 with `Retry-After: 5`; changing a
  caller-supplied forwarding value remained 429.
- Missing, one-character, 21-character, and disallowed-character names returned
  400; an invalid room returned 404; a missing pass returned 401; a disallowed
  Origin returned 403.
- The live demo contacted only its own origin. Real play contacted only the
  product client and product-owned room service.
- Offline play is not promised. Going offline produced a visible reconnect
  instruction. No service worker or update promise is present.

No room pass, credential, secret, or another service's configuration was logged
or included in evidence.

## Accessibility, routes, and performance

- Worker URL verification passed in 610 ms with no console errors, one `h1`,
  `lang="en"`, a `main`, image alt coverage, and labelled buttons.
- Live axe checks found no serious or critical issue on home, demo, privacy,
  terms, the designed 404, or high-contrast demo state.
- Keyboard checks passed for the skip link, board arrows, settings-dialog focus
  and Escape return, client-route heading focus, and Back focus restoration.
- Reduced motion changed scout animation durations to `0.00001s`. There was no
  flashing, audio, autoplay, or looping motion.
- Home, demo, privacy, and terms had no horizontal overflow at 390 px with 200%
  root text. The 11 sampled phone controls had minimum dimensions 44×44 CSS px.
- Home, demo, privacy, terms, robots, sitemap, social image, and favicon returned
  200. Unknown URLs and `/404.html` returned the intentional designed 404 with
  site header, footer, title, and return action.
- Route titles, descriptions, canonical links, single `h1`, and heading order
  were correct. The social image is 1200×630 and the touch icon is 180×180.
- Stable mobile Lighthouse scored 100 performance, 100 accessibility,
  100 best practices, and 100 SEO; LCP was 1.50 s, CLS 0, and TBT 27 ms.
- The production build emitted 25.61 kB JavaScript (8.48 kB gzip) and 12.00 kB
  CSS (3.56 kB gzip). Lighthouse transferred about 148 kB total.

The browser recorded one HTTP 409 for the deliberate third-seat test and one
HTTP 404 for the deliberate missing-route test. Those expected responses are
not product defects.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| F-01 retention | Resolved. Accelerated cleanup inspected and removed room, move, and pass-hash rows; browser expiry cleanup passed. |
| F-02 request-limit bypass | Resolved. Local claim and live rotating-header checks both remained rate limited with `Retry-After`. |
| F-03 hidden errors | Resolved. Live third-seat and local network/invalid-room errors were visible, focused, and actionable. |
| F-04 404 routing | Resolved. Unknown URLs and `/404.html` returned 404 with the designed full-site page. |
| F-05 non-opaque passes | Resolved. Local storage and live pass format were opaque; cross-room use returned 403. |
| F-06 200% reflow | Resolved. All four app routes stayed within 390 CSS px at 200% text size. |
| F-07 touch targets | Resolved. Sampled phone targets measured at least 44×44 CSS px. |
| F-08 route focus | Resolved. Privacy navigation focused its `h1`; Back restored the prior meaningful heading or `#main` focus target. |
| F-09 claim inventory | Reopened in part as current F-01. The original missing claims are covered, but four other public outcomes remain outside the inventory. |
| F-10 frame-rate evidence | Resolved. The fresh clean phone claim measured 60.00 fps under 4× CPU throttling. |
| F-11 build label | Resolved. The footer accurately shows current documentation build `1e629d5`; runtime comparison identifies implementation `00afdda`. |

## Other quality gates

- `npm run test:all`: 6 service tests and 57 browser tests passed; the desktop
  copy of the phone-only frame test was intentionally skipped.
- `npm run build`: passed and produced `dist/`.
- All 17 declared claims have exactly one source file containing their tag.
- README, MIT license, privacy, terms, demo documentation, visual thesis,
  copy audit, sitemap, robots, CSP, and security headers are present.
- No analytics, third-party script/font, AI request, payment, external realtime
  service, or advertised extra game mode was found.

Evidence is under `/work/.evidence/roomcode-tactics-verify-2/`. The required
report copy is `/work/.evidence/qa-report.md`; the required machine verdict is
`/work/.evidence/qa-result.json`.
