# Roomcode Tactics handoff

## Independent verification 4

**FAIL on 2026-09-06 UTC: one medium finding and one untested public claim.**

The game implementation works end to end, but the repaired claim tests do not
fully prove their public wording. See `.factory/verification-4.md` for the full
finding and evidence.

## Reviewed versions

- Implementation candidate: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation/static release: `2e802936fca37ba3400d0b68d1f0a1b2038b5677`
- Live room-service build: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Live URL: `https://roomcode-tactics.sociobot.in`

Only the handoff, repair metadata, and live-verifier script differ between the
implementation candidate and documentation revision. A clean `2e80293` build
matched the live HTML, JavaScript, and CSS byte-for-byte.

## What verification proved

- All 25 exact claim commands passed from a separate clean clone after
  `npm ci`.
- `npm run test:all` passed 8 service tests and 69 browser tests, with one
  intentional desktop skip for the phone-only frame check.
- `npm run build` produced `dist/`: 29.06 kB JavaScript raw / 9.51 kB gzip and
  13.51 kB CSS raw / 3.86 kB gzip.
- Fresh desktop and phone browsers showed the job, audience, actions, facts,
  and board before scrolling.
- The sample reached its win screen on desktop and phone, persisted on reload,
  reset to turn one, kept its demo label, and did not change a real-data
  sentinel.
- Independent real clients reached winner and loser screens. A separate match
  reached a 0–0 draw. Reload, clipboard, room forget, third-seat recovery, and
  fresh-room restart passed.
- Fifteen live rooms covered difficulty 1–5, four weather states, three marker
  rules, unique seeds, and same-seed repeatability.
- All four keyboard directions remapped and persisted. Pointer, explicit touch,
  default keyboard, reduced motion, 200% reflow, 44 px targets, focus, and live
  Axe checks passed.
- Tenant isolation returned 403. Live limiting returned 429 with
  `Retry-After` after forwarding-value rotation.
- A move survived a controlled restart of only
  `sf-roomcode-tactics-realtime--0000005`; health and authenticated reads
  returned 200 afterward.
- The worker URL check passed. Lighthouse scored 100 in performance,
  accessibility, best practices, and SEO; LCP was 1.659 s and CLS was 0.

Evidence is under `/work/.evidence/roomcode-tactics-verify-4/`.

## Known gap

The public claims and their exact tagged tests do not align completely:

- README says 5–10 minutes, while the manifest and test assert only under 10.
- The seeded-map command does not assert the complete 1–5 cycle, every stated
  weather/marker variant, or same-seed repeatability.
- The scoring/draw command asserts only the draw half.
- The remapping command changes only Down, while README promises four keys.

These outcomes worked in independent live checks, except the human five-minute
lower-bound estimate remains untested. The claims contract is still a release
gate, so the verdict is FAIL.

## Next steps

1. Decide whether 5–10 minutes is a measured promise or an intended session
   description. Match README, manifest wording, and a meaningful test.
2. Expand the seeded-map tagged test to cover difficulty 1–5, the public
   weather and marker variants, and same-seed regeneration.
3. Make the scoring test assert both a higher-score winner and an equal-score
   draw.
4. Make the controls test remap and use all four directions, then rerun every
   claim command, the full suite, build, and live verification.

No product code was changed during verification 4.
