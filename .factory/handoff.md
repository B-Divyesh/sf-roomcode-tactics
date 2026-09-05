# Roomcode Tactics handoff

## Repair result

Repair self-verification passed on 2026-09-05 UTC. The failed independent
report remains at `.factory/verification-1.md` as history; all 11 findings now
have outcome-based regression coverage and live evidence.

- Public game: `https://roomcode-tactics.sociobot.in`
- Product-owned room service: `https://roomcode-tactics-realtime.sociobot.in`
- Job: let two remote friends finish a five-turn tactics match without an
  account or live timing.
- Audience: two friends who want a private room link instead of matchmaking.
- First action: create a room or open the one-click sample beside it.

The deployed browser and service implementation is
`00afddae428a00b80338364df067348476f61718`. The browser footer shows
`00afdda`, and `/health` reports the full service SHA. Verification tooling and
README updates are based at `d9a7cb4bee98564b05afaabb9c3effba018bb49d`;
the final handoff commit is report-only and does not require another image.

## Finding disposition

| Finding | Disposition and proof |
| --- | --- |
| F-01 retention | Resolved. A scheduled cleanup deletes expired room rows; foreign-key cascades delete moves and pass hashes. The browser removes expired room entries on its next visit. The expiry claim inspects all three tables after an accelerated automatic cleanup. |
| F-02 request-limit bypass | Resolved. The service keys allowances from the rightmost ingress-appended address, not a caller-controlled leading value. Local rotation coverage passed. Live requests reached 429 with `Retry-After: 5`, and a changed supplied value remained 429. |
| F-03 hidden errors | Resolved. Room, network, move, and clipboard results use large visible status or alert panels. Errors receive focus and keep the entered name. A live third client saw the room-full recovery text. |
| F-04 404 routing | Resolved. Only the three app routes rewrite to the SPA. Static Web Apps rewrites missing responses to the full site-style 404 while retaining status 404. Both an unknown path and `/404.html` return 404 live. |
| F-05 non-opaque passes | Resolved. New passes are 32 random bytes encoded as one opaque value. Only a keyed hash is stored. Existing signed passes remain readable until their original room expires. |
| F-06 200% reflow | Resolved. The header wraps without document overflow. Automated 390 px checks cover home, demo, privacy, and terms at 200% root text size. |
| F-07 touch targets | Resolved. Header controls, demo actions, and enabled board cells measure at least 44 by 44 CSS pixels. |
| F-08 route focus | Resolved. Client navigation and Back focus the new route `h1`; titles, descriptions, and canonical links also update. |
| F-09 claim inventory | Resolved. The unsupported 4–8 minute statement was removed. Seventeen public claims now have one tagged outcome test and an exact command. All commands passed from a clean checkout. |
| F-10 frame-rate evidence | Resolved. The phone claim uses a 390×844, 3× DPR profile with 4× CPU throttling. The clean full run measured 58.05 fps against the 55 fps floor and 60 fps target. |
| F-11 build label | Resolved. The deployed client shows `00afdda`; the service reports the matching full SHA. |

## Clean verification

From a separate clean checkout of the implementation after `npm ci`:

- All 17 exact commands in `.factory/claims.json` passed. The expiry command
  was rerun after widening its accelerated test clock to remove a setup race.
- `npm run test:all` passed: TypeScript checks, 6 service tests, and 57 browser
  checks passed; the desktop copy of the phone-only frame test was skipped.
- `npm run build` produced `dist/`. Initial JavaScript is 25.61 kB raw and
  8.48 kB gzip. CSS is 12.00 kB raw and 3.56 kB gzip.
- Playwright axe found no serious or critical issue on home, demo, privacy,
  terms, or the high-contrast setting.
- Keyboard, dialog focus return, route focus, reduced motion, 200% text,
  44 px touch targets, invalid input, offline feedback, internal links, and
  unexpected console errors have browser coverage.

## Live verification

- Fresh 1440×900 and 390×844 contexts showed the job, audience, first actions,
  and board before scrolling. The board began at y=152 and y=632.75.
- The sample completed in five moves, showed the winner, survived reload,
  reset to turn one, and kept its banner. Starting for real removed demo keys
  without changing a seeded real-room entry or contacting the room service.
- Two independent clients completed a real five-turn match, saw winner and
  loser screens, and reloaded into the completed state. A third client received
  a visible two-seat error.
- A pass from one room received 403 on another. A new live pass was opaque.
- A controlled restart of revision
  `sf-roomcode-tactics-realtime--0000004` preserved a newly created room;
  `/health` returned 200 afterward with the implementation SHA.
- The worker URL check passed in 578 ms with no console errors. Lighthouse
  scored 100 for performance, accessibility, best practices, and SEO; LCP was
  1.50 s, CLS 0, and total blocking time 36 ms.
- Home, demo, privacy, terms, robots, sitemap, social art, and favicon return
  200. Missing routes and `/404.html` return the intentional 404 design.

Evidence is under `/work/.evidence/roomcode-tactics-repair-1/`. The catalog
description was copied to `/work/.evidence/catalog-description.txt`.

## Deployment and remaining notes

The realtime image and static bundle were deployed. The existing durable
Azure Files mount, environment, probes, and one-replica bound were preserved.
The shared SQLite database remains at `/data/roomcode-tactics-live.sqlite`.

No product defect remains known in the authorised scope. The fleet container
wrapper polls the service root for a 2xx/redirect, while this API deliberately
returns 404 at `/`; its image and revision deployment succeeded, and `/health`
was checked directly before the static publish. The 24-hour deletion interval
was verified with an accelerated local clock rather than waiting a day live.

There is no paid offer or billing metadata: the researched brief defines the
current product as free and only suggests testing a map pack later.
