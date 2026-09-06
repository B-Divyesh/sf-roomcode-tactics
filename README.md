# Roomcode Tactics

Plan five simultaneous tactics turns with a friend in a private room link.
Roomcode Tactics is free for two remote friends. When both friends are ready,
set aside under 10 minutes of active play for a five-turn match. A room stays open for 24
hours when you play apart. Use a pointer, touch, or keyboard on a 7×7 map with
five decisions each, names only, and no account. Create a room, share its link,
then both players choose their moves whenever they are ready.

## Run locally

Requires Node 22.13 or newer. Install the locked dependencies from a clean
checkout:

```bash
npm ci
npm run dev:service
npm run dev
```

Open `http://127.0.0.1:5173`. The browser client uses the local room service at
`http://127.0.0.1:8787` during development. The service creates its SQLite
database and signing key in `./data` unless `DATA_DIR` is set.

## Test and build

```bash
npm run check
npm run test:service
npm test
npm run build
```

`npm run test:service` verifies automatic deletion, durable SQLite recovery,
opaque room-pass isolation, idempotent moves, a complete match, and request
limits. `npm test` runs the browser claims, two independent clients, phone
reflow, keyboard controls, accessibility checks, legal routes, and the 404.

Each public product claim is listed in `.factory/claims.json` and can be run
alone with its exact listed command. After deployment, `npm run verify:live`
checks both screen sizes, the sample, two real clients, recovery, and public
service boundaries.

## Demo

Open `/demo` or click **Try it with sample data**. The sample is an active
Mira-versus-Teo match in its own `demo:roomcode-tactics:` localStorage namespace.
It has a persistent demo label, reset action, and no real room-service request.
See `.factory/demo.md` for the exact sandbox behavior.

## Product architecture

The static browser game deploys at
`https://roomcode-tactics.sociobot.in`. Real rooms use the separate,
product-owned `sf-roomcode-tactics-realtime` service at
`https://roomcode-tactics-realtime.sociobot.in`.

The service is Node + Hono + SQLite. It saves an accepted move before replying
and restores that move after a restart. Repeating the same move ID returns the
saved state without adding another move. New room passes are opaque, and only
their hashes are stored. Repeated requests from one observed client receive
HTTP 429 and `Retry-After` when the allowance is used.

## Deploy

The product-specific deployment configuration is in `.factory/deploy.md`.
Build the static client from a known commit and deploy the room service with its
durable `/data` mount before publishing the static client. The service must
remain at one replica because SQLite and its generated signing key are
process-local durable state.

## Scope and privacy

Room data is limited to names, a room code, pass hashes, moves, and the result.
The service deletes the room and related rows after 24 hours. The browser
removes expired room entries on the next visit. There are no analytics, ad
scripts, third-party fonts, accounts, payments, public matchmaking, ladders,
or long-lived worlds. Read `/privacy` and `/terms` for player-facing details.

## Match and performance

A full match ends after five simultaneous turns. Each match uses a 7×7 map.
Real rooms use a deterministic generated map with its seed shown on the board.
The generator cycles through difficulty 1–5 by adding blocked trails. Rain,
mist, and wind close marked trails, so weather changes legal moves. Marker
rules also vary: the centre or outer markers can be worth two points. The
higher score wins after turn five; equal scores draw.

Board cells work with a pointer or touch. Keyboard players move board focus
with the arrow keys by default, choose a focused legal square with Enter or
Space, and can remap the four focus keys in Settings. The active-play session
length is checked by the `active-session-length` claim in
`.factory/claims.json`.

Board resolution targets 60 fps and averages at least 55 fps in the tested
mid-range phone profile. The exact test is listed in `.factory/claims.json`.
