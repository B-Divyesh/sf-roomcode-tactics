# Verify the Roomcode Tactics repair 2

## Verdict

**PASS in repair self-verification.** The one medium finding from
`.factory/verification-2.md` is resolved. The claims inventory now contains 21
public outcomes, each with one tagged outcome test, and every exact command
passes from a clean checkout.

## Candidate and deployment

- Live product: `https://roomcode-tactics.sociobot.in`
- Browser implementation: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Verification date: 2026-09-05 UTC

The static bundle was rebuilt with browser build `bc1d448`, pushed, and
deployed successfully. Its JavaScript and CSS SHA-256 values match the local
production build. The service did not require a code or configuration change;
`/health` still reports its separate implementation SHA.

## Current finding disposition

The four outcomes missing from the prior inventory are now declared and
tested:

1. `copy-room-link` compares clipboard text with the exact created room URL.
2. `forget-room` proves the browser entry is removed while the shared room
   remains readable with its previously issued pass.
3. `real-match-restart` completes a real two-client match before proving that
   the winner action returns to an empty room form and board preview.
4. `footer-version` compares the footer value with the exact short Git
   revision used by the running app.

These are observable outcomes, not source-string or control-presence checks.
The pre-existing untagged copy-result test was removed instead of retaining
duplicate coverage.

## Clean verification

A separate clone at `bc1d44809599fdb4e3fb423317b7e1c9af61e067` was prepared
with `npm ci`.

- All 21 commands copied directly from `.factory/claims.json` passed.
- Inventory audit: 21 claim ids; exactly one source tag for each id.
- `npm run test:all`: 6 service tests and 63 browser checks passed; one
  desktop copy of the phone-only frame check was skipped as designed.
- `npm run build`: 25.61 kB JavaScript raw / 8.48 kB gzip and 12.00 kB CSS raw
  / 3.56 kB gzip.
- The phone profile measured 60.00 fps under 4× CPU throttling.
- Integrated axe checks found zero serious or critical issues.

## Live game and sample

- Desktop 1440×900: the board began at 152 CSS px.
- Phone 390×844 at 3× DPR: the board began at 632.75 CSS px.
- Both fresh first screens showed the job, audience, create action, sample
  action, price/privacy facts, and the game before scrolling.
- The direct sample used Mira, Teo, Cypress Pass, scores, objectives, and the
  persistent “Demo — sample data, nothing is saved” label. Five deterministic
  moves reached the win screen. Reload, reset, and Start for real all passed,
  and the unrelated real-data sentinel did not change.
- Two independent real clients finished five turns and reached winner and
  loser screens. Both outcomes survived reload. A third client received the
  visible two-seat recovery error.
- Live clipboard text exactly matched the room URL. Forget removed only the
  browser entry and the shared room still returned 200. The winner restart
  returned to the fresh room form. The terms footer showed `bc1d448`.

## Backend, recovery, accessibility, and performance

- One room pass received 403 against another room.
- Repeated public requests reached 429 with `Retry-After: 5`; a changed
  caller-supplied forwarding value remained 429.
- A move was accepted before a controlled restart of only
  `sf-roomcode-tactics-realtime--0000004`. The same move remained locked after
  restart, proving recovery from the existing durable SQLite mount.
- `/health` returned 200 with service build `00afddae…` after restart.
- Worker URL verification passed in 595 ms with no console errors, one `h1`,
  `lang="en"`, one `main`, complete image alt coverage, and labelled buttons.
- Playwright axe found no serious or critical issue. Existing coverage also
  passed keyboard board movement, dialog and route focus, reduced motion,
  high contrast, 200% text reflow, and 44 px touch targets.
- Lighthouse mobile scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.586 s, CLS 0, total blocking time 36 ms,
  and transferred bytes were 148,388.
- Home, demo, privacy, terms, robots, sitemap, social art, and favicon returned
  200. A missing route and `/404.html` returned the expected designed 404.
- Expected console entries were limited to the deliberate third-seat 409 and
  missing-route 404. No unexpected console error occurred.

## Earlier verification history

| Earlier finding | Current disposition |
| --- | --- |
| F-01 retention | Resolved. The clean expiry claim deletes the room, move, and pass-hash rows; browser expiry cleanup also passes. |
| F-02 request-limit bypass | Resolved. Clean and live checks remain limited after supplied forwarding values change. |
| F-03 hidden errors | Resolved. Network, invalid-room, and third-seat errors are visible, focused, and actionable. |
| F-04 404 routing | Resolved. Both tested missing paths return 404 with the designed page. |
| F-05 non-opaque passes | Resolved. The service test proves opaque 32-byte passes and hash-only storage; live cross-room access returns 403. |
| F-06 200% reflow | Resolved. Home, demo, privacy, and terms remain within 390 CSS px. |
| F-07 touch targets | Resolved. Tested phone controls and enabled board cells remain at least 44×44 CSS px. |
| F-08 route focus | Resolved. Client navigation and Back focus the new route heading. |
| F-09 claim inventory | Resolved. All 21 current public claims have one tag and every exact command passes. |
| F-10 frame-rate evidence | Resolved. The clean mid-range phone profile measured 60.00 fps against the 55 fps floor. |
| F-11 build label | Resolved. The live footer shows the deployed browser build `bc1d448`; the service reports its own full SHA. |

## Remaining notes

No known finding remains. Offline play, extra modes, AI, analytics, and payment
are not promised. The researched brief defines the current offer as free, so
no billing-offer file applies. Evidence is under
`/work/.evidence/roomcode-tactics-repair-2/`.
