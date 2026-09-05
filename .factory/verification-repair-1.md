# Verify the Roomcode Tactics repair

## Verdict

**PASS in repair self-verification.** All 11 findings from
`.factory/verification-1.md` are resolved in implementation
`00afddae428a00b80338364df067348476f61718` and verified locally and on the
public HTTPS product.

## Evidence summary

- All 17 declared claim commands passed from a separate clean checkout after
  `npm ci`.
- `npm run test:all`: 6 service tests passed; 57 browser checks passed; one
  desktop copy of the phone-only frame test was skipped.
- `npm run build`: JS 25.61 kB raw / 8.48 kB gzip; CSS 12.00 kB raw / 3.56 kB
  gzip.
- Live deterministic sample: win, reload, reset, persistent demo label, demo
  storage removal, and unchanged real-data sentinel all passed.
- Live real match: two independent clients reached winner and loser screens
  and restored them after reload; the third-seat error was visible.
- Live backend: opaque pass, cross-room 403, restart persistence, health 200,
  and 429 with `Retry-After` after rotating caller-supplied forwarding values.
- Live routing: `/demo`, `/privacy`, and `/terms` return 200; an unknown path
  and `/404.html` return 404 with the designed page.
- Accessibility: no serious or critical Playwright axe findings; focus,
  keyboard, reduced motion, 200% reflow, and 44 px targets passed.
- Worker URL check: 578 ms, no console errors, one `h1`, `lang`, `main`, image
  alt coverage, and labelled buttons.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.50 s, CLS 0, TBT 36 ms.
- Frame-rate claim: 58.05 fps with a 390×844, 3× DPR profile and 4× CPU
  throttling; required floor 55 fps.

Machine-readable results, screenshots, Lighthouse output, worker URL output,
and restart evidence are under
`/work/.evidence/roomcode-tactics-repair-1/`.

## Expected errors

The live browser records one HTTP 409 while deliberately testing a third seat
and one HTTP 404 while deliberately testing the missing route. They are
expected responses, not unexpected console failures.

## Remaining note

The factory container wrapper expects a success response at the service root,
but this API returns 404 there and exposes health at `/health`. The deployment
itself completed, the exact build is healthy, and a controlled revision restart
restored a room from the existing durable mount.
