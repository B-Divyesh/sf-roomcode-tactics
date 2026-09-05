import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Coordinate = { x: number; y: number };
export type PlayerNumber = 1 | 2;

export type MapDefinition = {
  id: string;
  weather: string;
  blocked: Coordinate[];
  objectives: Coordinate[];
};

export const MAPS: MapDefinition[] = [
  {
    id: 'cypress-pass',
    weather: 'Clear paths',
    blocked: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 0, y: 5 }, { x: 6, y: 5 }],
    objectives: [{ x: 3, y: 3 }, { x: 1, y: 3 }, { x: 5, y: 2 }],
  },
  {
    id: 'sandbar-crossing',
    weather: 'Dry wind',
    blocked: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 2, y: 5 }, { x: 4, y: 1 }],
    objectives: [{ x: 3, y: 3 }, { x: 1, y: 4 }, { x: 5, y: 2 }],
  },
  {
    id: 'pine-fork',
    weather: 'Morning mist',
    blocked: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 1, y: 5 }, { x: 5, y: 5 }],
    objectives: [{ x: 3, y: 3 }, { x: 2, y: 4 }, { x: 4, y: 2 }],
  },
];

type RoomRow = {
  id: string; code: string; map_index: number; round: number; status: string;
  p1_name: string; p2_name: string | null; p1_x: number; p1_y: number; p2_x: number; p2_y: number;
  p1_score: number; p2_score: number; claims: string; winner: string | null; last_resolution: string | null;
  created_at: number; updated_at: number; expires_at: number;
};

type MoveRow = { move_id: string; target_x: number; target_y: number };
type PassRow = { room_id: string; player: PlayerNumber; expires_at: number };

export type PublicRoomState = {
  roomCode: string;
  map: MapDefinition;
  round: number;
  maxRounds: number;
  status: 'lobby' | 'active' | 'completed';
  expiresAt: number;
  players: { player: PlayerNumber; name: string; position: Coordinate; score: number }[];
  yourPlayer: PlayerNumber;
  yourMoveLocked: boolean;
  objectives: { x: number; y: number; owner: PlayerNumber | null }[];
  lastResolution: string | null;
  winner: 'you' | 'opponent' | 'draw' | null;
};

export class GameError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

function cleanName(value: unknown): string {
  if (typeof value !== 'string') throw new GameError(400, 'invalid_name', 'Enter a name between 2 and 20 characters.');
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 20) throw new GameError(400, 'invalid_name', 'Enter a name between 2 and 20 characters.');
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) throw new GameError(400, 'invalid_name', 'Use letters, numbers, spaces, apostrophes, dots, or hyphens in your name.');
  return name;
}

function roomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}

function roomId(): string {
  return randomBytes(18).toString('base64url');
}

type TokenPayload = { r: string; p: PlayerNumber; e: number };

function sameCoordinate(a: Coordinate, b: Coordinate): boolean {
  return a.x === b.x && a.y === b.y;
}

function asRoom(value: unknown): RoomRow | undefined {
  return value as RoomRow | undefined;
}

export class GameStore {
  private db: DatabaseSync;
  private secret: Buffer;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(public readonly dataDir: string, private readonly retentionMs = 86_400_000) {
    mkdirSync(dataDir, { recursive: true });
    this.secret = this.readOrCreateSecret();
    // Azure Files' SMB mount does not expose SQLite's POSIX byte locks. The
    // room service is deliberately pinned to one replica, so disable SQLite's
    // cross-process lock calls while retaining one durable database and its
    // atomic in-process transactions.
    this.db = new DatabaseSync(`file:${join(dataDir, 'roomcode-tactics-live.sqlite')}?nolock=1`);
    // Azure Files uses network file locking. SQLite's default rollback journal is
    // the compatible single-writer mode here; WAL mode can leave the mounted
    // database locked during a container restart.
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        map_index INTEGER NOT NULL,
        round INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'lobby',
        p1_name TEXT NOT NULL,
        p2_name TEXT,
        p1_x INTEGER NOT NULL DEFAULT 3,
        p1_y INTEGER NOT NULL DEFAULT 6,
        p2_x INTEGER NOT NULL DEFAULT 3,
        p2_y INTEGER NOT NULL DEFAULT 0,
        p1_score INTEGER NOT NULL DEFAULT 0,
        p2_score INTEGER NOT NULL DEFAULT 0,
        claims TEXT NOT NULL DEFAULT '{}',
        winner TEXT,
        last_resolution TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS moves (
        room_id TEXT NOT NULL,
        round INTEGER NOT NULL,
        player INTEGER NOT NULL,
        move_id TEXT NOT NULL,
        target_x INTEGER NOT NULL,
        target_y INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (room_id, round, player),
        UNIQUE (room_id, player, move_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS room_passes (
        token_hash TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        player INTEGER NOT NULL CHECK (player IN (1, 2)),
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS rooms_expiry_idx ON rooms(expires_at);
      CREATE INDEX IF NOT EXISTS room_passes_expiry_idx ON room_passes(expires_at);
    `);
    this.scheduleCleanup();
  }

  close(): void {
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
    this.cleanupTimer = null;
    this.db.close();
  }

  purgeExpired(now = Date.now()): number {
    return Number(this.db.prepare('DELETE FROM rooms WHERE expires_at <= ?').run(now).changes);
  }

  private scheduleCleanup(): void {
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
    this.purgeExpired();
    const next = this.db.prepare('SELECT MIN(expires_at) AS expires_at FROM rooms').get() as { expires_at: number | null };
    if (next.expires_at === null) {
      this.cleanupTimer = null;
      return;
    }
    const delay = Math.min(2_147_000_000, Math.max(1, next.expires_at - Date.now()));
    this.cleanupTimer = setTimeout(() => this.scheduleCleanup(), delay);
    this.cleanupTimer.unref();
  }

  private readOrCreateSecret(): Buffer {
    const secretPath = join(this.dataDir, 'roomcode-tactics-signing-key');
    if (existsSync(secretPath)) return Buffer.from(readFileSync(secretPath, 'utf8').trim(), 'base64url');
    const secret = randomBytes(32);
    writeFileSync(secretPath, secret.toString('base64url'), { mode: 0o600 });
    return secret;
  }

  private sign(input: string): string {
    return createHmac('sha256', this.secret).update(input).digest('base64url');
  }

  private issueToken(room: RoomRow, player: PlayerNumber): string {
    const token = randomBytes(32).toString('base64url');
    this.db.prepare('INSERT INTO room_passes (token_hash, room_id, player, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(this.sign(token), room.id, player, room.expires_at, Date.now());
    return token;
  }

  playerFromToken(token: string): TokenPayload {
    const opaque = this.db.prepare('SELECT room_id, player, expires_at FROM room_passes WHERE token_hash = ?')
      .get(this.sign(token)) as PassRow | undefined;
    if (opaque) {
      if (opaque.expires_at <= Date.now()) throw new GameError(401, 'invalid_token', 'Your room pass expired. Create a new room to play again.');
      return { r: opaque.room_id, p: opaque.player, e: opaque.expires_at };
    }

    // Accept passes issued before opaque storage was introduced. They expire
    // with their original room and cannot be used to issue a new legacy pass.
    const [body, signature] = token.split('.');
    if (!body || !signature) throw new GameError(401, 'invalid_token', 'Your room pass is missing or invalid. Rejoin using the room link.');
    const expected = Buffer.from(this.sign(body));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new GameError(401, 'invalid_token', 'Your room pass is missing or invalid. Rejoin using the room link.');
    }
    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
      if (!payload.r || (payload.p !== 1 && payload.p !== 2) || !Number.isFinite(payload.e) || payload.e < Date.now()) {
        throw new Error('bad token');
      }
      return payload;
    } catch {
      throw new GameError(401, 'invalid_token', 'Your room pass is missing or invalid. Rejoin using the room link.');
    }
  }

  private findRoom(code: string): RoomRow {
    this.purgeExpired();
    const room = asRoom(this.db.prepare('SELECT * FROM rooms WHERE code = ?').get(code));
    if (!room) throw new GameError(404, 'room_not_found', 'That room code does not exist. Check the link and try again.');
    return room;
  }

  private roomForToken(code: string, token: string): { room: RoomRow; player: PlayerNumber } {
    const room = this.findRoom(code);
    const payload = this.playerFromToken(token);
    if (payload.r !== room.id) throw new GameError(403, 'wrong_room', 'This room pass belongs to a different room. Open the link you were given.');
    if (payload.p === 2 && !room.p2_name) throw new GameError(403, 'wrong_room', 'This room pass is no longer valid. Rejoin using the room link.');
    return { room, player: payload.p };
  }

  createRoom(nameInput: unknown): { state: PublicRoomState; token: string } {
    const name = cleanName(nameInput);
    const now = Date.now();
    this.purgeExpired(now);
    const mapCount = this.db.prepare('SELECT COUNT(*) AS count FROM rooms').get() as { count: number };
    let room: RoomRow | undefined;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = roomCode();
      try {
        this.db.prepare(`INSERT INTO rooms (id, code, map_index, p1_name, created_at, updated_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(roomId(), candidate, mapCount.count % MAPS.length, name, now, now, now + this.retentionMs);
        room = this.findRoom(candidate);
        break;
      } catch (error) {
        if (!(error instanceof Error) || !/UNIQUE constraint failed: rooms.code/.test(error.message)) throw error;
      }
    }
    if (!room) throw new GameError(503, 'room_unavailable', 'A room could not be created. Please try again.');
    const token = this.issueToken(room, 1);
    this.scheduleCleanup();
    return { state: this.publicState(room, 1), token };
  }

  joinRoom(code: string, nameInput: unknown): { state: PublicRoomState; token: string } {
    const name = cleanName(nameInput);
    const room = this.findRoom(code);
    if (room.p2_name) throw new GameError(409, 'room_full', 'This room already has two players. Ask your friend for a new room link.');
    const now = Date.now();
    const update = this.db.prepare("UPDATE rooms SET p2_name = ?, status = 'active', updated_at = ? WHERE id = ? AND p2_name IS NULL")
      .run(name, now, room.id);
    if (update.changes !== 1) throw new GameError(409, 'room_full', 'This room already has two players. Ask your friend for a new room link.');
    const joined = this.findRoom(code);
    const token = this.issueToken(joined, 2);
    return { state: this.publicState(joined, 2), token };
  }

  getState(code: string, token: string): PublicRoomState {
    const { room, player } = this.roomForToken(code, token);
    return this.publicState(room, player);
  }

  submitMove(code: string, token: string, payload: unknown): PublicRoomState {
    const { room, player } = this.roomForToken(code, token);
    if (!payload || typeof payload !== 'object') throw new GameError(400, 'invalid_move', 'Choose an adjacent open square before submitting your move.');
    const input = payload as { target?: Coordinate; move_id?: string };
    if (!input.target || !Number.isInteger(input.target.x) || !Number.isInteger(input.target.y) || typeof input.move_id !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(input.move_id)) {
      throw new GameError(400, 'invalid_move', 'Choose an adjacent open square before submitting your move.');
    }
    if (room.status === 'completed') throw new GameError(409, 'room_complete', 'This match is complete. Create a new room to play again.');
    if (room.status !== 'active') throw new GameError(409, 'room_waiting', 'Wait for your friend to join before submitting a move.');
    this.assertLegalTarget(room, player, input.target);

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const fresh = this.findRoom(code);
      const existing = this.db.prepare('SELECT move_id, target_x, target_y FROM moves WHERE room_id = ? AND round = ? AND player = ?')
        .get(fresh.id, fresh.round, player) as MoveRow | undefined;
      if (existing) {
        if (existing.move_id === input.move_id && existing.target_x === input.target.x && existing.target_y === input.target.y) {
          this.db.exec('COMMIT');
          return this.getState(code, token);
        }
        throw new GameError(409, 'move_locked', 'Your move is already locked for this turn. Wait for the resolution.');
      }
      this.db.prepare('INSERT INTO moves (room_id, round, player, move_id, target_x, target_y, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(fresh.id, fresh.round, player, input.move_id, input.target.x, input.target.y, Date.now());
      const moveOne = this.db.prepare('SELECT move_id, target_x, target_y FROM moves WHERE room_id = ? AND round = ? AND player = 1')
        .get(fresh.id, fresh.round) as MoveRow | undefined;
      const moveTwo = this.db.prepare('SELECT move_id, target_x, target_y FROM moves WHERE room_id = ? AND round = ? AND player = 2')
        .get(fresh.id, fresh.round) as MoveRow | undefined;
      if (moveOne && moveTwo) this.resolveRound(fresh, moveOne, moveTwo);
      this.db.exec('COMMIT');
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* transaction already committed for an idempotent replay */ }
      throw error;
    }
    return this.getState(code, token);
  }

  private assertLegalTarget(room: RoomRow, player: PlayerNumber, target: Coordinate): void {
    if (target.x < 0 || target.x > 6 || target.y < 0 || target.y > 6) throw new GameError(400, 'invalid_move', 'Choose a square on the map.');
    const current = player === 1 ? { x: room.p1_x, y: room.p1_y } : { x: room.p2_x, y: room.p2_y };
    if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 1) throw new GameError(400, 'invalid_move', 'Choose your current square or one adjacent open square.');
    const map = MAPS[room.map_index];
    if (map.blocked.some((cell) => sameCoordinate(cell, target))) throw new GameError(400, 'invalid_move', 'That forest square is blocked. Choose an adjacent open square.');
  }

  private resolveRound(room: RoomRow, first: MoveRow, second: MoveRow): void {
    const targetOne = { x: first.target_x, y: first.target_y };
    const targetTwo = { x: second.target_x, y: second.target_y };
    const oneStart = { x: room.p1_x, y: room.p1_y };
    const twoStart = { x: room.p2_x, y: room.p2_y };
    const conflict = sameCoordinate(targetOne, targetTwo);
    const oneEnd = conflict ? oneStart : targetOne;
    const twoEnd = conflict ? twoStart : targetTwo;
    const map = MAPS[room.map_index];
    const claims = JSON.parse(room.claims) as Record<string, PlayerNumber>;
    let scoreOne = room.p1_score;
    let scoreTwo = room.p2_score;
    const newlyClaimed: string[] = [];
    map.objectives.forEach((objective, index) => {
      const key = String(index);
      if (claims[key]) return;
      if (sameCoordinate(oneEnd, objective)) { claims[key] = 1; scoreOne += 1; newlyClaimed.push('north marker'); }
      if (sameCoordinate(twoEnd, objective)) { claims[key] = 2; scoreTwo += 1; newlyClaimed.push('south marker'); }
    });
    const finalRound = room.round === 5;
    let winner: string | null = null;
    if (finalRound) winner = scoreOne === scoreTwo ? 'draw' : scoreOne > scoreTwo ? 'p1' : 'p2';
    const resolution = conflict
      ? 'Both plans reached the same square, so neither scout moved.'
      : newlyClaimed.length ? `A ${newlyClaimed.join(' and a ')} was secured.` : 'Both plans resolved without securing a marker.';
    this.db.prepare(`UPDATE rooms SET p1_x = ?, p1_y = ?, p2_x = ?, p2_y = ?, p1_score = ?, p2_score = ?, claims = ?,
        round = ?, status = ?, winner = ?, last_resolution = ?, updated_at = ? WHERE id = ?`)
      .run(oneEnd.x, oneEnd.y, twoEnd.x, twoEnd.y, scoreOne, scoreTwo, JSON.stringify(claims), finalRound ? 5 : room.round + 1,
        finalRound ? 'completed' : 'active', winner, resolution, Date.now(), room.id);
  }

  private publicState(room: RoomRow, player: PlayerNumber): PublicRoomState {
    const currentMove = this.db.prepare('SELECT move_id FROM moves WHERE room_id = ? AND round = ? AND player = ?')
      .get(room.id, room.round, player) as { move_id: string } | undefined;
    const claims = JSON.parse(room.claims) as Record<string, PlayerNumber>;
    const opponent: PlayerNumber = player === 1 ? 2 : 1;
    const winner = room.winner === null ? null : room.winner === 'draw' ? 'draw' : room.winner === `p${player}` ? 'you' : 'opponent';
    return {
      roomCode: room.code,
      map: MAPS[room.map_index],
      round: room.round,
      maxRounds: 5,
      status: room.status as PublicRoomState['status'],
      expiresAt: room.expires_at,
      players: [
        { player: 1, name: room.p1_name, position: { x: room.p1_x, y: room.p1_y }, score: room.p1_score },
        ...(room.p2_name ? [{ player: 2 as PlayerNumber, name: room.p2_name, position: { x: room.p2_x, y: room.p2_y }, score: room.p2_score }] : []),
      ],
      yourPlayer: player,
      yourMoveLocked: Boolean(currentMove),
      objectives: MAPS[room.map_index].objectives.map((objective, index) => ({ ...objective, owner: claims[String(index)] ?? null })),
      lastResolution: room.last_resolution,
      winner,
    };
  }
}
