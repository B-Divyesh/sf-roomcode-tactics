# Roomcode Tactics handoff

## Status

**PASS — independent verification 5 found zero findings and zero untested
public claims.**

- Browser implementation: `b14f6f18c608af3cab3580734c83f7951cd949fb`
- Room-service implementation: `7a37e41a5e865d05b857cae70c85b9e66a3273ab`
- Documentation revision reviewed: `4e1bac644251b08c1245ee3aab4e0717c955aadd`
- Live URL: `https://roomcode-tactics.sociobot.in`
- Full report: `.factory/verification-5.md`

The later documentation commits do not change runtime files. The live footer
shows `4e1bac6`; clean production assets match live byte for byte; and the room
service reports the exact service implementation SHA.

## Product check

The job is to plan five simultaneous tactics turns with one friend. It is for
two remote friends who want a short match without accounts or live timing. The
first action is **Create a room**, with **Try it with sample data** beside it.

Fresh 1440×900 and 390×844 live contexts showed the job, audience, actions,
facts, and playable board before scrolling. The sample reached **You won**, kept
its demo label, survived reload, reset to turn one, and left a real-data
sentinel unchanged. Independent real clients reached win, loss, and 0–0 draw
end screens. All four remapped directions worked and persisted on fresh desktop
and phone contexts.

## Verification

From a separate clean clone after `npm ci`:

- All 25 exact commands in `.factory/claims.json` passed.
- Every claim id occurs in exactly one source tag.
- `npm run test:all` passed 8 service tests and 69 browser tests, with the one
  intended desktop skip for the phone-only frame-rate measurement.
- The phone frame-rate claim measured 60.00 fps alone and 59.50 fps in the full
  suite under 4× CPU throttling.
- `VITE_BUILD_SHA=4e1bac6 npm run build` produced `dist/` with 29.06 kB
  JavaScript raw / 9.51 kB gzip and 13.51 kB CSS raw / 3.86 kB gzip.
- The supplied live URL verifier passed in 676 ms with no console errors and
  the required title, language, heading, main landmark, alt text, and labels.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP was 1.759 s, CLS 0, and TBT 0 ms.

Live checks also passed two-client persistence, room isolation 403, health 200,
opaque passes, exact-link copying, local-only forget, full-room recovery, and
429 with `Retry-After` after the request allowance. A controlled restart of
only `sf-roomcode-tactics-realtime--0000005` preserved an accepted locked move.
No private pass was recorded.

Accessibility and recovery checks cover keyboard-only play, focus management,
reduced motion, high contrast, 44 px phone targets, 200% text reflow, invalid
rooms, failed requests, offline guidance, legal pages, route titles, links, and
the designed HTTP 404. No offline play or update behavior is promised.

## Evidence

- Report: `.factory/verification-5.md`
- Evidence directory: `/work/.evidence/roomcode-tactics-verify-5/`
- Required report copy: `/work/.evidence/qa-report.md`
- Required machine verdict: `/work/.evidence/qa-result.json`

The evidence directory contains first-screen and end-screen images, a WebM of
the deterministic sample run, the live verification JSON, response headers,
the URL verifier output, and the Lighthouse report.

## Remaining work

No product gap is known. No product code was changed during verification.

## Run and verify

```bash
npm ci
npm run test:all
VITE_BUILD_SHA=4e1bac6 npm run build
EXPECTED_CLIENT_BUILD=4e1bac6 \
  EXPECTED_SERVICE_BUILD=7a37e41a5e865d05b857cae70c85b9e66a3273ab \
  npm run verify:live
```
