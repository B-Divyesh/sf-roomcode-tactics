# Roomcode Tactics handoff

## Repair 3

**PASS in repair self-verification on 2026-09-06 UTC.** The four findings in
`.factory/review-3.md` are resolved in deployed implementation
`7a37e41a5e865d05b857cae70c85b9e66a3273ab`.

The implementation revision is `7a37e41a5e865d05b857cae70c85b9e66a3273ab`.
The later verification-documentation base is
`497119b70f8c24c63e83b24953b145e9adab4ee9`; it changes reports and the live
verifier only, not the deployed browser or service implementation.

Roomcode Tactics is a free private five-turn tactics game for two remote
friends. A player creates a room, shares its link, and both players lock moves
at their own pace. The first screen shows the job, audience, actions, facts,
and playable board before scrolling on desktop and phone.

## What changed

- Real rooms now persist a deterministic `RCT-` map seed. The generator cycles
  difficulty 1–5, keeps the short centre route fair, and produces new blocked
  trails for every seed.
- Rain, mist, and dry wind close marked trails in the actual move rules.
  Marker rules rotate between one-point markers, a two-point centre, and
  two-point outer markers. The board visibly shows the seed, difficulty,
  weather rule, marker rule, and two-point markers.
- Existing rooms with no stored seed retain their legacy map after the SQLite
  migration, so an in-progress room is not changed by deployment.
- Settings now has accessible, persisted board-focus key remapping. Arrow keys
  remain the default, Enter and Space select a focused legal square, and each
  changed key is announced to assistive technology.
- README opening copy now states the intended 5–10 minute active session and
  pointer, touch, and keyboard support. It also explains seeded maps, scoring,
  and remapping.
- The scoring rule now says higher score wins and equal scores draw. A
  deterministic two-client 0–0 match proves the draw end screen.
- Claims now cover generated content, remappable controls, active session
  length, and scoring/draws. The live verifier also covers the new controls,
  visible map rules, and draw run.

## Verification

- From a separate clean clone of implementation `7a37e41`, after `npm ci`, all
  25 exact commands in `.factory/claims.json` passed.
- `npm run test:all` passed: 8 service tests and 69 browser tests. One desktop
  execution was intentionally skipped because frame rate is measured only in
  the phone project. The fresh phone measurement was 59.01 fps at 4× CPU
  throttling; the isolated clean claim measured 59.50 fps.
- `npm run build` passed and produced `dist/`: 29.06 kB JavaScript raw
  (9.51 kB gzip) and 13.51 kB CSS raw (3.86 kB gzip).
- Live `verify:live` used fresh desktop and phone browsers. Desktop board top
  was 152 px and phone board top was 632.75 px. It completed the sample,
  checked its persistent demo label, reset, and untouched real-data sentinel;
  completed a two-client winner/loser game; completed a distinct real draw;
  verified remapped Down-to-S focus; and verified reload, clipboard, forget,
  third-seat feedback, fresh-room restart, opaque-pass isolation, 429 with
  `Retry-After`, route 404, titles, and live axe checks.
- `/opt/fleet/lib/verify-url.sh` passed on the HTTPS product: 565 ms load, no
  browser errors, one `h1`, `lang="en"`, main landmark, complete image alt
  coverage, and labelled buttons.
- Live Lighthouse: performance 99, accessibility 100, best practices 100,
  SEO 100; LCP 1.761 s, CLS 0, TBT 67 ms, 149,699 transferred bytes.

Evidence is under `/work/.evidence/roomcode-tactics-repair-3/`. The catalog
description is copied to `/work/.evidence/catalog-description.txt`.

## Deployment

- Static client deployed to `https://roomcode-tactics.sociobot.in` from
  implementation `7a37e41`.
- Product-owned service deployed to
  `https://roomcode-tactics-realtime.sociobot.in`; `/health` reports the full
  implementation SHA `7a37e41a5e865d05b857cae70c85b9e66a3273ab`.
- The service deployment preserved its durable `/data` share, existing
  environment and probes, and one-replica bound. Its wrapper kept checking the
  intentional API-root 404 after deployment, so it was stopped only after the
  direct HTTPS `/health` check confirmed the new revision.

## Finding disposition

| Finding | Current disposition |
| --- | --- |
| Review 3: fixed maps, label-only weather, one rule | Resolved by persisted seeded generator, difficulty cycle, weather closures, marker values, and service/UI regression checks. |
| Review 3: README session and input facts | Resolved in the opening paragraph, with active-session claim coverage. |
| Review 3: no key remapping | Resolved with persisted settings, default/remapped keyboard tests, and live test. |
| Review 3: draw rule unclaimed | Resolved by `scoring-draw`, which completes a 0–0 match to the real draw screen. |
| Verification 1: retention, limits, errors, 404, opaque passes | Still resolved and passed in service/browser/live checks. |
| Verification 1: reflow, touch targets, route focus, frame rate, build label | Still resolved by current browser suite, mobile measurement, live build footer, and health revision. |
| Verification 2: copy, forget, restart, footer claims | Still resolved and passed in the clean claim run and live verifier. |

## Remaining notes

There are no known product defects in the authorised scope. The researched
brief defines this product as free, so there is no paid offer or billing
registration dependency. No AI feature is appropriate for this deterministic
room game. Offline play and background updates are not promised.
