# Roomcode Tactics handoff

## Status

**PASS — strict review 4 found zero findings of every severity and zero
untested public claims.**

- Browser implementation: `b14f6f18c608af3cab3580734c83f7951cd949fb`
- Room-service implementation: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation revision reviewed: `dbd0479a7c6c9266d3475b1aec87c14fbd1d4044`
- Live footer/build revision: `4e1bac644251b08c1245ee3aab4e0717c955aadd`
- Live URL: `https://roomcode-tactics.sociobot.in`
- Full report: `.factory/review-4.md`

Later commits contain no runtime changes after browser candidate `b14f6f1`.
The room-service source is unchanged after `7a37e41`. A clean build labelled
`4e1bac6` matched the live HTML, JavaScript, and CSS byte for byte.

## Product check

The job is to plan five simultaneous tactics turns with one friend. It is for
two remote friends who want a short match without accounts or live timing. The
first action is **Create a room**, with **Try it with sample data** beside it.

Fresh 1440×900 and 390×844 live contexts showed the job, audience, actions,
facts, and board before scrolling. One-click desktop and phone samples reached
**You won** through five turns and were recorded. The demo label persisted,
reset returned to turn one, and leaving the demo removed only demo storage.
Independent real clients reached winner, loser, and draw end screens and kept
them after reload. All four remapped board directions worked.

## Verification

From a separate clean clone after `npm ci`:

- All 25 exact commands in `.factory/claims.json` passed.
- Every claim id is unique and occurs in exactly one source tag.
- `npm run test:all` passed 8 service tests and 69 browser tests, with one
  intended desktop skip for the phone-only frame-rate measurement.
- The phone frame-rate claim measured 58.00 fps under 4× CPU throttling.
- `VITE_BUILD_SHA=4e1bac6 npm run build` produced `dist/` with 29.06 kB
  JavaScript raw / 9.51 kB gzip and 13.51 kB CSS raw / 3.86 kB gzip.
- The supplied URL verifier passed in 639 ms with no console errors.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP was 1.726 s, CLS 0, and TBT 27 ms.

Live checks passed one-click sample isolation, two-client play, win/loss/draw,
reconnect, cross-room isolation 403, room-full recovery, exact-link copying,
local-only forget, and 429 with `Retry-After`. A controlled restart of only
`sf-roomcode-tactics-realtime--0000005` preserved an accepted locked move. No
private pass was recorded.

Accessibility and recovery checks cover keyboard-only operation, focus
management, reduced motion, high contrast, 44 px phone targets, 200% text
reflow, invalid rooms, failed requests, offline guidance, legal pages, route
titles, all links, and the designed HTTP 404. No offline play or background
update behavior is promised, and no service worker is registered.

## Evidence

- Report: `.factory/review-4.md`
- Evidence directory: `/work/.evidence/roomcode-tactics-review-4/`
- Required report copy: `/work/.evidence/qa-report.md`
- Required machine verdict: `/work/.evidence/qa-result.json`

The evidence directory contains first-screen and end-screen images, desktop
and phone sample WebM recordings, all exact claim logs, live verification and
restart results, request-origin checks, response headers, the URL verifier,
full-suite and build logs, and the Lighthouse report.

## Remaining work

No product gap is known. Review 4 changed only reports.

## Run and verify

```bash
npm ci
npm run test:all
VITE_BUILD_SHA=4e1bac6 npm run build
EXPECTED_CLIENT_BUILD=4e1bac6 \
  EXPECTED_SERVICE_BUILD=7a37e41a5e865d05b857cae70c85b9e66a3273ab \
  npm run verify:live
```
