# Deployment configuration

The browser client is the static app `sf-roomcode-tactics` at
`https://roomcode-tactics.sociobot.in`.

The real room service is the separate, product-owned Container App
`sf-roomcode-tactics-realtime` at
`https://roomcode-tactics-realtime.sociobot.in`. Deploy it with:

```bash
./deploy/realtime.sh
```

That wrapper sets `WO_DATA_DIR=/data`. The factory deployer mounts the durable
`sf-roomcode-tactics-realtime-data` share at `/data` and pins the app to one
replica. It preserves existing volumes, environment values, probes, and the
single-replica bound on repair deployments.

Build the client from a known commit id and publish it with:

```bash
VITE_BUILD_SHA=$(git rev-parse --short HEAD) npm run build
./deploy/static.sh
```

The static client uses only the product-owned realtime URL in production.
