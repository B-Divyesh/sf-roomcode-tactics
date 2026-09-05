# Verify a private five-turn match with a friend

## Verdict

**FAIL — 11 findings, including 3 high-severity findings. One public claim is untested.**

The declared tests pass, and two real clients can finish and recover a match.
The product is not accepted because privacy, abuse control, error recovery,
routing, accessibility, claim coverage, and release provenance still have
findings.

## Product and candidate

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation reviewed: `77ba7390b6943d3781396ee15e35e6367143f766`
- Room-service implementation reviewed: `c26fd022ad7b6447e0efa41f9c6b4a298650b5f7`
- Documentation revision reviewed: `17e228bde4d4f9fc82575e889e1864f597998028`
- Verification date: 2026-09-05 UTC
- Browsers: fresh Playwright Chromium desktop at 1440×900 and phone at
  390×844, plus reduced-motion and 200% text-size contexts

The two commits after the browser candidate change only `.factory/handoff.md`.
A clean default build produced the same JavaScript and CSS asset names and the
same SHA-256 hashes as live. The service `/health` response reports the exact
service candidate SHA. This proves the reviewed implementations are live even
though the browser build label has the release-provenance finding below.

## First screen before scrolling

- Job: plan five simultaneous tactics turns against one friend.
- Audience: two remote friends who want a short match without accounts or live
  timing.
- First action: create a room, or open the one-click sample beside it.
- Desktop: the job, audience, actions, three facts, and complete board were
  visible before scrolling.
- Phone: the same copy and actions were visible, and the board began at 633 px
  in an 844 px viewport. The game itself was visible before scrolling.

## Findings

### F-01 — High — Stored room data is not deleted after 24 hours

The privacy page says the service stores names, codes, passes, moves, and
results “for up to 24 hours.” The server sets `expires_at` and rejects access
after that time, but it has no deletion or cleanup path. Expired names, moves,
and results remain in SQLite. Real room sessions and nicknames also remain in
browser localStorage because no path removes `rct:room:*` keys. The privacy page
incorrectly says the service stores the signed pass; the pass is stored by the
browser instead. The `room-expiry` claim test only checks the generated
timestamp, so it does not prove deletion or even a post-expiry 410 response.

### F-02 — High — A caller can bypass the public request allowance

The service trusts the first caller-supplied `X-Forwarded-For` value as the
rate-limit identity. From one public client, 41 requests with one chosen value
returned 429, while the next request with a different chosen value returned
404 instead of 429. The same caller can therefore rotate the header and avoid
the advertised per-client throttle. Evidence:
`same-client-supplied-xff=429 changed-client-supplied-xff=404`.

### F-03 — High — Room and network errors are invisible to sighted players

A third player correctly receives HTTP 409 when a room is full, but the message
is rendered only in the clipped 1×1 px `.sr-only` announcer. The visible join
form simply resets. The same rendering path handles invalid rooms, server
failures, move failures, and copy-link results. A player cannot see what
happened or what to do next. The current two-seat claim test passes because it
finds the off-screen text; it does not prove visible recovery feedback.

### F-04 — Medium — Missing URLs do not use the designed 404 response

`/qa-missing-route-verify-1` returns HTTP 200 and renders the home app.
`/404.html` also returns HTTP 200. The configured designed 404 is therefore not
served with 404 status for a missing route. The standalone 404 also lacks the
standard site header and footer.

### F-05 — Medium — Room passes are signed but not opaque

The README and product contract call the passes opaque. The first token segment
is base64url JSON containing the internal room id, player number, and expiry;
only its signature is protected. This does not allow token forgery, but it is a
false security description and exposes fields that an opaque pass would hide.

### F-06 — Medium — The phone layout does not reflow at 200% text size

At 390 px wide with the root text size doubled, the document becomes 501 px
wide. The header navigation is 433.5 px wide and the Settings control ends at
499.5 px, forcing horizontal scrolling. This fails the required 200% text
resize/reflow check.

### F-07 — Medium — Phone navigation targets are shorter than 44 px

At the 390 px phone viewport, Demo, Privacy, and Terms are 19.7 px high,
Settings is 39.7 px high, and the home mark is 37 px high. All are below the
44×44 px touch-target baseline.

### F-08 — Medium — Client-side route changes do not focus the new heading

Activating Privacy from the main navigation changes the title and content, but
focus falls to `BODY` instead of the new `h1`. The renderer only looks for
`#page-title`, while the legal headings do not have that id. This fails the
route focus requirement for keyboard and screen-reader users. Back navigation
does restore the home route.

### F-09 — Medium — The public claims inventory is incomplete

The README says a round is “usually 4–8 minutes,” but that quantitative claim
is absent from `.factory/claims.json` and has no measurement. This is the one
untested public claim counted in the verdict. Other public statements about
durable writes, idempotency, request destinations, and rate limiting are also
absent from the inventory; some have ordinary tests or independent evidence,
but they do not meet the every-claim-has-one-tagged-test contract. The retention
and rate-limit statements are additionally false or incomplete as described in
F-01 and F-02.

### F-10 — Medium — The required frame-rate evidence is missing

The browser-game contract requires a measured 60 fps claim and a tagged test on
a mid-range phone, with the result in the handoff. There is no frame-rate claim,
measurement, or test in the repository. The game uses discrete DOM updates and
a 300 ms CSS resolution effect; Lighthouse does not substitute for gameplay
frame measurement.

### F-11 — Low — The live browser release is labelled `dev`

The live footer says `Build dev`, while the handoff says build `77ba739` is
visible. The live JavaScript and CSS are byte-for-byte equal to a clean default
build of the candidate source, so this is a build-label and handoff-accuracy
defect rather than evidence of stale product code.

## Live game run

The one-click `/demo` opened a populated Cypress Pass match with Mira and Teo,
scores, objectives, and the persistent “Demo — sample data, nothing is saved”
label. Five scripted moves (`3-5`, `3-4`, `3-3`, `2-3`, `1-3`) reached the real
sample winner screen at 2–0. Reload preserved that end state. Reset returned to
turn 1, and Start for real removed all `demo:roomcode-tactics:*` keys. No room
service request occurred during the sample flow.

Two fresh independent browser contexts then created and joined room `7AVU6Y`.
Mira QA and Teo QA each submitted five simultaneous turns. The first context
reached “You won this five-turn match” / “You won”; the second reached “Your
friend won this five-turn match” / “You lost.” Both clients reloaded into the
same completed room. Winner, loser, populated sample, and sample end-screen
screenshots are under `/work/.evidence/roomcode-tactics-verify-1/screens/`.

## Backend checks

- Health: HTTP 200, build
  `c26fd022ad7b6447e0efa41f9c6b4a298650b5f7`.
- Tenant isolation: a valid pass used on another room returned HTTP 403 with
  `wrong_room`.
- Restart persistence: a QA room was created, only the current
  `sf-roomcode-tactics-realtime` revision was restarted, health returned 200,
  and the same signed pass read the room with HTTP 200 afterward.
- Allowance behavior: request 41 in one caller-controlled bucket returned 429
  with `Retry-After: 10`; F-02 records the bypass.
- Invalid and boundary requests: missing, one-character, 21-character, and
  disallowed-character names returned 400; missing token returned 401; invalid
  code returned 404; move after completion returned 409; disallowed Origin
  returned 403.
- Local service tests also passed restart recovery, idempotent submission,
  wrong-room rejection, five-turn completion, and 429/`Retry-After`.

No credential is included in this report or its copied summary.

## Declared claim commands

Every exact command in `.factory/claims.json` ran from a fresh clone at the
documentation revision after `npm ci`.

| Claim | Command result | Review result |
| --- | --- | --- |
| `demo-never-saves-real` | 2 passed | Pass; live demo also made no API request |
| `no-tracking` | 2 passed | Pass; live first load used only the product origin |
| `restart-demo` | 2 passed | Pass; live reset returned to turn 1 |
| `settings-persist` | 2 passed | Pass; live reload kept the setting |
| `refresh-rejoin` | 2 passed | Pass; both live clients recovered the completed room |
| `free-join` | 2 passed | Pass; live independent clients joined without account or payment |
| `two-seat-room` | 2 passed | Command passed; visible error feedback fails under F-03 |
| `room-expiry` | 2 passed | Command passed; retention wording and coverage fail under F-01 |
| `five-turn-match` | 2 passed | Pass; local and live runs reached winner and loser screens |

Declared claim commands run: 9 of 9. Untested public claims: 1.

## Other verification

- `npm run test:all`: passed; TypeScript checks, 3 service tests, and 30
  Playwright tests.
- `npm run build`: passed and produced `dist/`.
- Initial JavaScript: 22.97 kB raw, 7.72 kB gzip. CSS: 11.02 kB raw,
  3.39 kB gzip.
- Worker `verify-url.sh`: passed; load 680 ms, no load-time console errors,
  title, `lang`, one `h1`, `main`, image alt coverage, and labelled buttons.
- Playwright axe: no violations on home, demo, privacy, or the high-contrast
  demo state.
- Reduced motion: the media query matched and motion durations became 0.01 ms.
- Keyboard: skip link had a 4 px cyan focus ring; map arrow navigation moved
  from cell `3-5` to `3-6`; the native settings dialog focused its close button.
- Lighthouse 12.2.1 mobile: 100 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 856 ms, CLS 0, TBT 13.5 ms.
- Routes and assets: home, demo, privacy, terms, robots, sitemap, social image,
  and favicon returned 200. F-04 covers the incorrect missing-route behavior.
- No offline use is promised. The live offline state gave a visible reconnect
  instruction. No service worker or update promise was found.
- No external links, analytics, third-party scripts, fonts, AI calls, payment,
  or advertised additional game modes were present.

## Earlier findings

No earlier review or verification report exists in repository history. The
builder recorded earlier Azure Files locking failures. Their current
disposition is **resolved**: local restart recovery passed, the live service is
healthy, and the controlled live revision restart preserved a newly created
room. The 11 findings above are new independent-verification findings.

## Evidence

Machine-readable and visual evidence is stored at
`/work/.evidence/roomcode-tactics-verify-1/`. The required report copy is
`/work/.evidence/qa-report.md`; the required verdict file is
`/work/.evidence/qa-result.json`.
