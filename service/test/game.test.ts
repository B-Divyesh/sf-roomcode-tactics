import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createGameApp } from '../src/app.ts';

type CreatedRoom = { roomCode: string; token: string };

async function sandbox(): Promise<{ dir: string; service: ReturnType<typeof createGameApp> }> {
  const dir = await mkdtemp(join(tmpdir(), 'roomcode-tactics-'));
  return { dir, service: createGameApp({ dataDir: dir, rateLimit: 1000 }) };
}

function request(service: ReturnType<typeof createGameApp>, path: string, init: RequestInit = {}): Promise<Response> {
  return service.app.request(`http://room.test${path}`, init);
}

async function create(service: ReturnType<typeof createGameApp>, name: string, ip = '198.51.100.8'): Promise<CreatedRoom> {
  const response = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ name }) });
  assert.equal(response.status, 201);
  return response.json() as Promise<CreatedRoom>;
}

async function joinRoom(service: ReturnType<typeof createGameApp>, code: string, name: string): Promise<CreatedRoom> {
  const response = await request(service, `/v1/rooms/${code}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.9' }, body: JSON.stringify({ name }) });
  assert.equal(response.status, 200);
  return response.json() as Promise<CreatedRoom>;
}

test('@claim:durable-room-state @claim:idempotent-moves durable state and idempotent moves survive a service restart', async () => {
  const { dir, service } = await sandbox();
  try {
    const first = await create(service, 'Mira');
    const second = await joinRoom(service, first.roomCode, 'Teo');
    const move = { target: { x: 3, y: 5 }, move_id: 'mira_move_001' };
    const locked = await request(service, `/v1/rooms/${first.roomCode}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` }, body: JSON.stringify(move) });
    assert.equal(locked.status, 200);
    assert.equal((await locked.json() as { yourMoveLocked: boolean }).yourMoveLocked, true);
    const replay = await request(service, `/v1/rooms/${first.roomCode}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` }, body: JSON.stringify(move) });
    assert.equal(replay.status, 200, 'the same idempotency key returns the saved move');
    const changed = await request(service, `/v1/rooms/${first.roomCode}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` }, body: JSON.stringify({ target: { x: 2, y: 6 }, move_id: 'mira_move_002' }) });
    assert.equal(changed.status, 409, 'a second, different move is rejected');

    const other = await create(service, 'Lina', '198.51.100.10');
    const wrongRoom = await request(service, `/v1/rooms/${other.roomCode}`, { headers: { Authorization: `Bearer ${first.token}` } });
    assert.equal(wrongRoom.status, 403, 'a signed pass cannot read another room');
    service.store.close();

    const restarted = createGameApp({ dataDir: dir, rateLimit: 1000 });
    const afterRestart = await request(restarted, `/v1/rooms/${first.roomCode}`, { headers: { Authorization: `Bearer ${first.token}` } });
    assert.equal(afterRestart.status, 200, 'the same room pass reconnects after restart');
    const state = await afterRestart.json() as { players: { name: string }[]; yourMoveLocked: boolean };
    assert.deepEqual(state.players.map((player) => player.name), ['Mira', 'Teo']);
    assert.equal(state.yourMoveLocked, true, 'the persisted submitted move remains locked');
    restarted.store.close();
    void second;
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('two independent players can finish five simultaneous turns', async () => {
  const { dir, service } = await sandbox();
  try {
    const first = await create(service, 'Mira');
    const second = await joinRoom(service, first.roomCode, 'Teo');
    const moves = [{ x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }];
    let final: { status: string; winner: string; round: number } | null = null;
    for (const [index, target] of moves.entries()) {
      const one = await request(service, `/v1/rooms/${first.roomCode}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` }, body: JSON.stringify({ target, move_id: `north_turn_${index}` }) });
      assert.equal(one.status, 200);
      const two = await request(service, `/v1/rooms/${first.roomCode}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${second.token}` }, body: JSON.stringify({ target: { x: 3, y: 0 }, move_id: `south_turn_${index}` }) });
      assert.equal(two.status, 200);
      final = await two.json() as typeof final;
    }
    assert.equal(final?.status, 'completed');
    assert.equal(final?.winner, 'opponent', 'the second player sees the first player win');
    assert.equal(final?.round, 5);
    const extraMove = await request(service, `/v1/rooms/${first.roomCode}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` },
      body: JSON.stringify({ target: moves.at(-1), move_id: 'north_turn_after_end' }),
    });
    assert.equal(extraMove.status, 409, 'a completed match rejects later moves');
  } finally { service.store.close(); await rm(dir, { recursive: true, force: true }); }
});

test('invalid, boundary, origin, and missing-pass requests return useful errors', async () => {
  const { dir, service } = await sandbox();
  try {
    for (const name of [undefined, 'A', 'A'.repeat(21), 'Mira<script>']) {
      const response = await request(service, '/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      assert.equal(response.status, 400);
      const body = await response.json() as { error?: { message?: string } };
      assert.ok(body.error?.message?.length, 'the invalid request explains what to correct');
    }
    const origin = await request(service, '/v1/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://not-roomcode.example' },
      body: JSON.stringify({ name: 'Mira' }),
    });
    assert.equal(origin.status, 403);

    const created = await create(service, 'Mira');
    const missingPass = await request(service, `/v1/rooms/${created.roomCode}`);
    assert.equal(missingPass.status, 401);
    const badCode = await request(service, '/v1/rooms/ABC');
    assert.equal(badCode.status, 404);
    const health = await request(service, '/health');
    assert.equal(health.status, 200);
  } finally { service.store.close(); await rm(dir, { recursive: true, force: true }); }
});

test('@claim:request-limits caller-supplied forwarding values cannot reset the request allowance', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'roomcode-tactics-rate-'));
  const service = createGameApp({ dataDir: dir, rateLimit: 3, rateWindowMs: 10_000 });
  try {
    for (let index = 0; index < 3; index += 1) {
      const response = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `caller-${index}, 203.0.113.40` }, body: JSON.stringify({ name: `Player ${index}` }) });
      assert.equal(response.status, 201);
    }
    const blocked = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': 'a-new-caller-value, 203.0.113.40' }, body: JSON.stringify({ name: 'Fourth player' }) });
    assert.equal(blocked.status, 429);
    assert.match(blocked.headers.get('Retry-After') || '', /^[1-9]\d*$/);
    const otherClient = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': 'a-new-caller-value, 203.0.113.41' }, body: JSON.stringify({ name: 'Other client' }) });
    assert.equal(otherClient.status, 201);
  } finally { service.store.close(); await rm(dir, { recursive: true, force: true }); }
});

test('@claim:opaque-room-pass new room passes expose no room or player fields', async () => {
  const { dir, service } = await sandbox();
  let serviceClosed = false;
  try {
    const first = await create(service, 'Mira');
    assert.match(first.token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(first.token.includes('.'), false);
    assert.equal(Buffer.from(first.token, 'base64url').byteLength, 32);
    const state = await request(service, `/v1/rooms/${first.roomCode}`, { headers: { Authorization: `Bearer ${first.token}` } });
    assert.equal(state.status, 200);
    service.store.close();
    serviceClosed = true;
    const database = new DatabaseSync(`file:${join(dir, 'roomcode-tactics-live.sqlite')}?nolock=1`);
    try {
      const stored = database.prepare('SELECT token_hash FROM room_passes').get() as { token_hash: string };
      assert.notEqual(stored.token_hash, first.token, 'the database does not store the bearer pass');
      assert.equal(stored.token_hash.length, 43);
    } finally { database.close(); }
  } finally {
    if (!serviceClosed) service.store.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('@claim:room-expiry expired rooms, moves, and pass hashes are deleted', async () => {
  const defaultSandbox = await sandbox();
  try {
    const started = Date.now();
    const created = await request(defaultSandbox.service, '/v1/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Default expiry' }),
    });
    assert.equal(created.status, 201);
    const state = await created.json() as { expiresAt: number };
    assert.ok(state.expiresAt - started >= 86_399_000 && state.expiresAt - started <= 86_401_000);
  } finally {
    defaultSandbox.service.store.close();
    await rm(defaultSandbox.dir, { recursive: true, force: true });
  }

  const dir = await mkdtemp(join(tmpdir(), 'roomcode-tactics-expiry-'));
  const service = createGameApp({ dataDir: dir, rateLimit: 1000, retentionMs: 1_000 });
  let serviceClosed = false;
  try {
    const first = await create(service, 'Mira');
    await joinRoom(service, first.roomCode, 'Teo');
    const move = await request(service, `/v1/rooms/${first.roomCode}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` },
      body: JSON.stringify({ target: { x: 3, y: 5 }, move_id: 'expiry_move_001' }),
    });
    assert.equal(move.status, 200);
    await delay(1_400);
    service.store.close();
    serviceClosed = true;

    const database = new DatabaseSync(`file:${join(dir, 'roomcode-tactics-live.sqlite')}?nolock=1`);
    try {
      assert.equal((database.prepare('SELECT COUNT(*) AS count FROM rooms').get() as { count: number }).count, 0);
      assert.equal((database.prepare('SELECT COUNT(*) AS count FROM moves').get() as { count: number }).count, 0);
      assert.equal((database.prepare('SELECT COUNT(*) AS count FROM room_passes').get() as { count: number }).count, 0);
    } finally { database.close(); }
    const restarted = createGameApp({ dataDir: dir, rateLimit: 1000 });
    try {
      const gone = await request(restarted, `/v1/rooms/${first.roomCode}`, { headers: { Authorization: `Bearer ${first.token}` } });
      assert.equal(gone.status, 404);
    } finally { restarted.store.close(); }
  } finally {
    if (!serviceClosed) service.store.close();
    await rm(dir, { recursive: true, force: true });
  }
});
