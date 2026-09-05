# Roomcode Tactics handoff

## Independent verification 3

**PASS on 2026-09-05 UTC: zero findings and zero untested claims.**

Independent QA reviewed browser implementation
`bc1d44809599fdb4e3fb423317b7e1c9af61e067`, service implementation
`00afddae428a00b80338364df067348476f61718`, and documentation/release revision
`1e1abb188103166edb4a0a0a30d4075e9600a750`. The later revision only changes
factory documentation; it is the static build label shown live. A fresh build
of it exactly matched the deployed JS and CSS, while the game runtime source
remains the reviewed browser implementation.

From a separate clean clone after `npm ci`, all 21 declared claim commands,
`npm run test:all` (6 service tests, 63 browser tests, one intentional desktop
skip for the phone-only frame test), and `npm run build` passed. The independent
phone claim measured 60.00 fps at 4× CPU throttling. Fresh desktop and phone
live runs completed the deterministic sample and a two-client real match,
including reload, reset, copy, forget, restart, cross-room isolation, health,
and live 429/`Retry-After` behavior. Axe, keyboard, motion, focus, reflow,
routes, legal pages, expected 404s, and privacy request boundaries passed.

See `.factory/verification-3.md` and
`/work/.evidence/roomcode-tactics-verify-3/` for evidence. No known product
finding remains.

## Repair 2 result

Repair self-verification passed on 2026-09-05 UTC. The medium finding in
`.factory/verification-2.md` is resolved. All four public outcomes identified
by the verifier now have entries in `.factory/claims.json` and one tagged,
outcome-based browser test each.

- Live game: `https://roomcode-tactics.sociobot.in`
- Product room service: `https://roomcode-tactics-realtime.sociobot.in`
- Browser implementation: `bc1d44809599fdb4e3fb423317b7e1c9af61e067`
- Room-service implementation: `00afddae428a00b80338364df067348476f61718`
- Verification documentation: `5ba88c8e1a4d3703ab356804c05c55c9d9e43588`
- Job: play a private five-turn tactics match with one remote friend.
- Audience: two friends who want no account, matchmaking, or live timing.
- First action: create a room or open the sample beside it.

The later provenance commit changes report metadata only. The deployed footer
shows `bc1d448`, and the service health response reports its separate
implementation SHA above.

## Finding fixed

| Missing claim | Repeatable outcome now proved |
| --- | --- |
| Copy room link | Grants clipboard permission, creates a room, copies, reads the clipboard, and compares the exact full room URL. |
| Forget this room | Removes the matching browser entry, returns to the fresh game, and proves the authenticated shared room still returns 200. |
| Real-match restart | Finishes a real five-turn match in two independent contexts, uses the winner action, and observes an empty room form and board preview. |
| Footer version | Opens the terms route and compares the rendered footer value with the exact short Git revision used by the app. |

The ordinary copy-result check was replaced by the stronger claim test. The
live verifier now checks these outcomes too. Game rules, storage behavior, and
the service API were not changed.

## Verification

From a separate clean checkout of the browser implementation after `npm ci`:

- All 21 exact commands in `.factory/claims.json` passed. Every claim id has
  exactly one source tag.
- `npm run test:all` passed: 6 service tests and 63 browser checks passed. The
  desktop copy of the phone-only frame test was intentionally skipped.
- `npm run build` produced `dist/`. Initial JavaScript is 25.61 kB raw and
  8.48 kB gzip. CSS is 12.00 kB raw and 3.56 kB gzip.
- The clean phone run measured 60.00 fps under 4× CPU throttling against the
  declared 55 fps floor.
- Playwright axe found no serious or critical issue across the game, legal
  routes, and high-contrast setting. Keyboard, dialog focus, route focus,
  reduced motion, 200% reflow, 44 px targets, errors, offline feedback, and
  the designed 404 all passed.

On the deployed HTTPS product:

- Fresh desktop and phone contexts showed the job, audience, both first
  actions, three facts, and the board before scrolling.
- The sample reached its win screen, survived reload, reset to turn one, kept
  its demo label, and left a real-data sentinel unchanged.
- Two independent clients completed a real match and reached winner and loser
  screens. Copy, forget, and real restart passed against the live service.
- A controlled restart of only revision
  `sf-roomcode-tactics-realtime--0000004` preserved an accepted move. Health
  returned 200 afterward with the service SHA above.
- Cross-room access returned 403. Repeated requests returned 429 with
  `Retry-After: 5`, and changing a supplied forwarding value remained 429.
- The worker URL check loaded in 595 ms with no console errors. Lighthouse
  scored 100/100/100/100; LCP was 1.59 s, CLS 0, and total blocking time 36 ms.
- App routes and public assets returned 200. Unknown paths and `/404.html`
  returned the intentional designed 404. Live JS and CSS hashes match the
  deployed local build.

Evidence is under `/work/.evidence/roomcode-tactics-repair-2/`. The catalog
description was copied to `/work/.evidence/catalog-description.txt`.

## Earlier findings and remaining notes

All 11 findings from `.factory/verification-1.md` remain resolved: expiry
deletion, request-limit identity, visible recovery errors, 404 routing, opaque
passes, 200% reflow, touch targets, route focus, claim coverage, frame-rate
measurement, and build provenance all passed their current regression or live
check. See `.factory/verification-repair-2.md` for individual disposition.

No known product defect remains in the authorised scope. The current product
is free, as specified by the brief; there is no registered paid offer or
billing metadata. No AI feature is appropriate for this deterministic game.
The room service was restarted for persistence verification but was not
redeployed or reconfigured. Its durable `/data` SQLite mount and one-replica
bound remain in use.
