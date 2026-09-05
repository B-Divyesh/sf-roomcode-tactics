import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('durable state, idempotent move, and wrong-room rejection survive a service restart', async () => {
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
  } finally { service.store.close(); await rm(dir, { recursive: true, force: true }); }
});

test('rate limits return 429 and Retry-After after the allowance', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'roomcode-tactics-rate-'));
  const service = createGameApp({ dataDir: dir, rateLimit: 3, rateWindowMs: 10_000 });
  try {
    for (let index = 0; index < 3; index += 1) {
      const response = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.40' }, body: JSON.stringify({ name: `Player ${index}` }) });
      assert.equal(response.status, 201);
    }
    const blocked = await request(service, '/v1/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.40' }, body: JSON.stringify({ name: 'Fourth player' }) });
    assert.equal(blocked.status, 429);
    assert.match(blocked.headers.get('Retry-After') || '', /^[1-9]\d*$/);
  } finally { service.store.close(); await rm(dir, { recursive: true, force: true }); }
});
