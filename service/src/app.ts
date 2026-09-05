import { Hono } from 'hono';
import { GameError, GameStore } from './game.js';

type AppOptions = { dataDir: string; buildSha?: string; rateWindowMs?: number; rateLimit?: number; retentionMs?: number };

class RateLimiter {
  private entries = new Map<string, { used: number; started: number }>();
  constructor(private readonly windowMs: number, private readonly limit: number) {}

  take(key: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    if (this.entries.size > 1_000) {
      for (const [entryKey, value] of this.entries) {
        if (now - value.started >= this.windowMs) this.entries.delete(entryKey);
      }
    }
    const entry = this.entries.get(key);
    if (!entry || now - entry.started >= this.windowMs) {
      this.entries.set(key, { used: 1, started: now });
      return { allowed: true, retryAfter: 0 };
    }
    if (entry.used >= this.limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((this.windowMs - (now - entry.started)) / 1000)) };
    entry.used += 1;
    return { allowed: true, retryAfter: 0 };
  }
}

function clientIp(forwarded: string | undefined): string {
  // Azure ingress appends the network-observed client to the right. Values to
  // its left may be caller supplied, so they must never define an allowance.
  const chain = forwarded?.split(',').map((value) => value.trim()).filter(Boolean) || [];
  return chain.at(-1) || 'unknown';
}

function code(value: string): string {
  const normalized = value.toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(normalized)) throw new GameError(404, 'room_not_found', 'That room code does not exist. Check the link and try again.');
  return normalized;
}

function bearer(value: string | undefined): string {
  const match = value?.match(/^Bearer (.+)$/i);
  if (!match) throw new GameError(401, 'invalid_token', 'Your room pass is missing or invalid. Rejoin using the room link.');
  return match[1];
}

function allowedOrigin(origin: string | undefined): boolean {
  return !origin || origin === 'https://roomcode-tactics.sociobot.in' || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
}

export function createGameApp(options: AppOptions): { app: Hono; store: GameStore } {
  const app = new Hono();
  const store = new GameStore(options.dataDir, options.retentionMs);
  const limiter = new RateLimiter(options.rateWindowMs ?? 10_000, options.rateLimit ?? 40);

  app.use('*', async (context, next) => {
    const origin = context.req.header('Origin');
    if (!allowedOrigin(origin)) return context.json({ error: { code: 'origin_rejected', message: 'This request origin is not allowed.' } }, 403);
    if (origin) {
      context.header('Access-Control-Allow-Origin', origin);
      context.header('Vary', 'Origin');
      context.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      context.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (context.req.method === 'OPTIONS') return context.body(null, 204);
    if (context.req.path !== '/health') {
      const ip = clientIp(context.req.header('X-Forwarded-For'));
      const pathGroup = context.req.path.endsWith('/moves') ? 'moves'
        : context.req.path.endsWith('/join') ? 'join'
          : context.req.path === '/v1/rooms' ? 'create' : 'room-read';
      const result = limiter.take(`${ip}:${context.req.method}:${pathGroup}`);
      if (!result.allowed) {
        context.header('Retry-After', String(result.retryAfter));
        return context.json({ error: { code: 'rate_limited', message: 'Too many requests. Wait before trying again.' } }, 429);
      }
    }
    return next();
  });

  app.onError((error, context) => {
    if (error instanceof GameError) return context.json({ error: { code: error.code, message: error.message } }, error.status as 400);
    console.error(JSON.stringify({ level: 'error', event: 'request_failed', message: error instanceof Error ? error.message : 'unknown error' }));
    return context.json({ error: { code: 'server_error', message: 'The room service had a problem. Try again in a moment.' } }, 500);
  });

  app.get('/health', (context) => context.json({ status: 'ok', build: options.buildSha ?? 'dev' }));

  app.post('/v1/rooms', async (context) => {
    const body = await context.req.json().catch(() => { throw new GameError(400, 'invalid_request', 'Send a name to create a room.'); });
    const result = store.createRoom(body.name);
    return context.json({ ...result.state, token: result.token }, 201);
  });

  app.post('/v1/rooms/:code/join', async (context) => {
    const body = await context.req.json().catch(() => { throw new GameError(400, 'invalid_request', 'Send a name to join this room.'); });
    const result = store.joinRoom(code(context.req.param('code')), body.name);
    return context.json({ ...result.state, token: result.token });
  });

  app.get('/v1/rooms/:code', (context) => context.json(store.getState(code(context.req.param('code')), bearer(context.req.header('Authorization')))));

  app.post('/v1/rooms/:code/moves', async (context) => {
    const body = await context.req.json().catch(() => { throw new GameError(400, 'invalid_move', 'Choose an adjacent open square before submitting your move.'); });
    return context.json(store.submitMove(code(context.req.param('code')), bearer(context.req.header('Authorization')), body));
  });

  return { app, store };
}
