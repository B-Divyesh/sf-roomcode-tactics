# Roomcode Tactics handoff

## Public product

- Public game: `https://roomcode-tactics.sociobot.in`
- Product-owned room service: `https://roomcode-tactics-realtime.sociobot.in/health`
- Job: let two remote friends finish a short, private, asynchronous tactics
  match without an account.
- Audience: friends who want a room-link game without matchmaking or a live
  community.

## Published implementation

- Browser client implementation SHA: `77ba7390b6943d3781396ee15e35e6367143f766`
- Room-service implementation SHA: `c26fd022ad7b6447e0efa41f9c6b4a298650b5f7`
- The static client was rebuilt with `VITE_BUILD_SHA=77ba739` and deployed after
  the service was healthy.
- The service image reports its exact server SHA at `/health`.

The client is a Vite + TypeScript browser game. The separate
`sf-roomcode-tactics-realtime` Container App uses Hono, Node SQLite, signed
opaque room passes, idempotent move ids, and a durable `/data` mount. It is
fixed at one replica. Azure Files lacks SQLite POSIX byte locks, so the service
uses SQLite's `nolock=1` URI mode together with that one-replica bound and
in-process transactions. Room state is stored at
`/data/roomcode-tactics-live.sqlite`; the generated signing key is also in
`/data`.

## What was done

- Built the complete five-turn, simultaneous two-player 7×7 tactics game with
  map rotation, weather labels, markers, conflict resolution, win/loss/draw,
  keyboard board controls, room creation and joining, refresh/rejoin, errors,
  settings, responsive layout, legal pages, 404, and offline feedback.
- Added a labelled `/demo` sandbox with Mira and Teo, persistent demo storage,
  reset, start-real action, and no request to the real room API.
- Added original folded-map assets: generated field texture with prompt sidecar,
  hand-made map SVG/PNG social and touch assets, and the documented forest,
  sand, cyan visual system.
- Added privacy-first headers, no third-party fonts/scripts/analytics, local
  demo storage isolation, claims, README, MIT license, sitemap, robots, and
  deployment wrappers.

## Verification

From the clean local setup:

- `npm run test:all` passed: TypeScript checks, 3 durable-service tests, and
  30 Playwright checks across desktop and phone.
- Every command in `.factory/claims.json` was run from a clean test setup.
- `npm run build` passed. Initial JS is 7.73 KB gzip; CSS is 3.39 KB gzip.
- Playwright axe integration passed with no serious or critical violations.
- `verify-url.sh` passed locally and on final public HTTPS: title, `lang`, one
  h1, main landmark, image alt coverage, labelled buttons, and no console
  errors.

Live product evidence:

- Fresh desktop and phone browsers loaded the public page with the game board
  on the first screen. Evidence screenshots are in the run workspace under
  `.evidence/public/`.
- Two independent real clients created, joined, played five simultaneous turns,
  reached the real winner screen, and then refreshed into the same completed
  room.
- A signed pass used against another room returned HTTP 403.
- Health returned HTTP 200. The live request allowance returned HTTP 429 with
  `Retry-After: 10` after its allowed invalid requests.
- A controlled restart of the active product revision returned health HTTP 200
  and restored a previously created room with its signed pass.
- The final public cold check returned HTTP 200 in 664 ms with no browser
  console errors and build `77ba739` visible in the footer.

## Earlier findings and disposition

There was no earlier implementation, handoff, verification report, or review
history in the seed repository. During this build, the first Azure Files SQLite
startup revisions crash-looped on unsupported SMB file locking. The cause was
fixed with the one-replica `nolock=1` SQLite configuration, then verified by a
healthy live service and an actual product-revision restart/rejoin check.

## Known gaps and next steps

There are no known user-path gaps in the shipped free scope. The failed initial
bootstrap database file may remain on the newly created product share, but no
real player data existed before the healthy revision; the active service uses
the documented stable database path. Keep the room service at one replica when
changing deployment configuration, because the SQLite mode intentionally relies
on a single writer.
