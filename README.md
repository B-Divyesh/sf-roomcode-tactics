# Roomcode Tactics

Plan five simultaneous tactics turns with a friend in a private room link.
Roomcode Tactics is free for two remote friends. A match uses a 7×7 map,
five decisions each, names only, and no account. Create a room, share its link,
then both players choose their moves whenever they are ready.

## Run locally

Requires Node 22.13 or newer.

```bash
npm install
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

`npm run test:service` verifies durable SQLite recovery after a service restart,
signed room-pass isolation, idempotent move submission, a completed two-player
five-turn match, and rate-limit responses. `npm test` runs the browser claims,
two independent browser clients, phone layout, keyboard board control, axe,
legal routes, 404, and a live 429/`Retry-After` allowance check.

Each public product claim is listed in `.factory/claims.json` and can be run
alone with its listed `npm test -- --grep @claim:...` command.

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

The service is Node + Hono + SQLite. It persists the game before responding,
stores the SQLite database and generated HMAC signing key under `/data` in
production, validates signed opaque room passes, supports idempotency keys for
move submission, and applies per-client rate limits with `Retry-After`.

## Deploy

The product-specific deployment configuration is in `.factory/deploy.md`.
Build the static client from a known commit and deploy the room service with its
durable `/data` mount before publishing the static client. The service must
remain at one replica because SQLite and its generated signing key are
process-local durable state.

## Scope and privacy

Room data is limited to a nickname, room code, room pass, moves, and result.
It expires after 24 hours. There are no analytics, ad scripts, third-party
fonts, accounts, payments, public matchmaking, ladders, or long-lived worlds.
Read the in-product `/privacy` and `/terms` pages for player-facing details.

## Session shape

A round is usually 4–8 minutes when both friends are present, or can take up
to 24 hours asynchronously. A full match ends after five simultaneous turns.
