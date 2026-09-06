# Roomcode Tactics handoff

## Status

**PASS — repair 4 resolved the one medium claims-coverage finding.**

- Browser release implementation: `b14f6f18c608af3cab3580734c83f7951cd949fb`
- Room-service implementation: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Verification documentation/evidence revision: `2815033b3d261d4491e9b6b17c6f7d98f2b2184c`
- Live URL: `https://roomcode-tactics.sociobot.in`

The static client was rebuilt with build id `b14f6f1`, deployed, and verified live. The room service had no runtime change, so its durable one-replica SQLite deployment remains unchanged.

## Product check

The job is to plan five simultaneous tactics turns with one friend. It is for two remote friends who want a short match without accounts or live timing. The first action is **Create a room**, with **Try it with sample data** beside it.

Fresh 1440×900 and 390×844 browser contexts showed the job, audience, both actions, facts, and playable board before scrolling. The board began at 152 px on desktop and 632.75 px on phone.

The live verifier completed the sample through **You won**, retained the demo label, reloaded the result, reset to turn one, and left a real-data sentinel unchanged. It completed independent two-client win/loss and draw matches, reloaded their end states, checked a visible third-seat recovery error, copied the exact link, forgot only a browser entry, and returned a winner to a fresh room form. It also verified opaque passes, cross-room 403 isolation, 429 with `Retry-After`, unchanged limiting after a rotated forwarding value, health 200, and the designed HTTP 404.

## Repair made

The independent verifier found incomplete exact claim coverage. Product behavior already worked; this repair makes public claims and outcome tests match.

- README now promises a measurable active session of **under 10 minutes**, not an untested five-minute lower bound.
- `seeded-map-content` now creates ten rooms and proves two 1–5 difficulty cycles, distinct and restart-repeatable seeds, every weather state, every marker-value rule, weather-closed legal-move rejection, and one added ordinary blocked trail per difficulty.
- `scoring-draw` now proves both a higher-score win and an equal-score draw.
- `remappable-controls` now proves default navigation, remapping, arrow-key replacement, and reload persistence for Left=A, Up=W, Right=D, and Down=S.

## Verification

From the documented clean setup (`npm ci`):

- All 25 exact commands from `.factory/claims.json` passed.
- Claim audit found 25 ids, each with exactly one `@claim:` tag.
- `npm run test:all` passed 8 service tests and 69 browser tests; one desktop duplicate of the phone-only frame-rate test was intentionally skipped.
- The phone frame-rate claim measured 60.00 fps at 4× CPU throttling.
- `VITE_BUILD_SHA=b14f6f1 npm run build` passed and produced `dist/` with 29.06 kB JavaScript raw / 9.51 kB gzip and 13.51 kB CSS raw / 3.86 kB gzip.
- `/opt/fleet/lib/verify-url.sh` passed live in 603 ms with no console errors, correct title/lang/main/one heading, complete image alt coverage, and labelled buttons.
- The live Playwright Axe scans in `npm run verify:live` found zero serious or critical issues on home and privacy. The local suite also covers demo, terms, high contrast, keyboard, dialog focus, route and Back focus, reduced motion, 44 px phone targets, and 200% text reflow.

Live evidence is in `/work/.evidence/roomcode-tactics-repair-4/`, including desktop and phone first screens, sample and real end screens, URL verification output, and the machine-readable live result.

## Earlier findings

All earlier verification and review findings remain resolved: expiry deletes room, move, and pass-hash rows; request allowance cannot be reset with caller-supplied forwarding values; recovery errors are visible; unknown routes return designed HTTP 404 responses; passes stay opaque; phone reflow and 44 px targets pass; and navigation focuses route headings.

The expanded claim tests now also cover the previous content, controls, draw, session-fact, frame-rate, and release-provenance concerns.

## Deployment and remaining notes

`./deploy/static.sh` successfully published the static `b14f6f1` release and the HTTPS custom domain returned 200. No room-service deployment was needed, preserving the service volume, environment, probes, and one-replica bound.

The product remains free as specified by the researched brief. It has no paid offer, so no billing-registration metadata is needed. The catalog description is a 75-character verb-first description and was copied to `/work/.evidence/catalog-description.txt`.

No product gap is known. The standalone Axe CLI and Lighthouse CLI could not start their Selenium/CDP Chrome in this worker despite the Playwright browser being available; both failed before measuring a page. The live Playwright Axe scan and complete browser suite passed. No new Lighthouse score is recorded for this repair; verification 4 previously recorded a 100 score in all four categories.

## Run and deploy

```bash
npm ci
npm run test:all
VITE_BUILD_SHA=$(git rev-parse --short HEAD) npm run build
./deploy/static.sh
EXPECTED_CLIENT_BUILD=$(git rev-parse --short HEAD) \
  EXPECTED_SERVICE_BUILD=7a37e41a5e865d05b857cae70c85b9e66a3273ab \
  npm run verify:live
```
