import './style.css';

type Coordinate = { x: number; y: number };
type PlayerNumber = 1 | 2;
type MapDefinition = { id: string; weather: string; blocked: Coordinate[]; objectives: Coordinate[] };
type RoomState = {
  roomCode: string; map: MapDefinition; round: number; maxRounds: number; status: 'lobby' | 'active' | 'completed'; expiresAt: number;
  players: { player: PlayerNumber; name: string; position: Coordinate; score: number }[];
  yourPlayer: PlayerNumber; yourMoveLocked: boolean; objectives: { x: number; y: number; owner: PlayerNumber | null }[];
  lastResolution: string | null; winner: 'you' | 'opponent' | 'draw' | null;
};

type Settings = { quietResolution: boolean; highContrast: boolean };
type Session = { token: string; name: string; expiresAt?: number };
type NoticeKind = 'status' | 'error';

const app = document.querySelector<HTMLDivElement>('#app')!;
const API_URL = import.meta.env.VITE_REALTIME_URL || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:8787' : 'https://roomcode-tactics-realtime.sociobot.in');
const BUILD_ID = import.meta.env.VITE_BUILD_SHA || 'dev';
const DEMO_KEY = 'demo:roomcode-tactics:sample';
const REAL_SETTINGS_KEY = 'rct:settings';
const DEMO_SETTINGS_KEY = 'demo:roomcode-tactics:settings';

const demoMap: MapDefinition = {
  id: 'cypress-pass', weather: 'Clear paths',
  blocked: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 0, y: 5 }, { x: 6, y: 5 }],
  objectives: [{ x: 3, y: 3 }, { x: 1, y: 3 }, { x: 5, y: 2 }],
};

function demoSeed(): RoomState {
  return {
    roomCode: 'SAMPLE', map: demoMap, round: 1, maxRounds: 5, status: 'active', expiresAt: Date.now() + 86_400_000,
    players: [
      { player: 1, name: 'Mira', position: { x: 3, y: 6 }, score: 0 },
      { player: 2, name: 'Teo', position: { x: 3, y: 0 }, score: 0 },
    ],
    yourPlayer: 1, yourMoveLocked: false,
    objectives: demoMap.objectives.map((cell) => ({ ...cell, owner: null })), lastResolution: 'Sample match ready. Mira moves first; Teo holds each turn.', winner: null,
  };
}

let roomState: RoomState | null = null;
let selected: Coordinate | null = null;
let notice = '';
let noticeKind: NoticeKind = 'status';
let inFlight = false;
let settings = readSettings();
let lastResolutionSeen = '';
let lastRenderedPath = location.pathname;
let draftName = '';

function isDemo(): boolean { return location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1'; }
function roomCodeFromUrl(): string | null {
  const value = new URLSearchParams(location.search).get('room')?.toUpperCase() || null;
  return value && /^[A-Z2-9]{6}$/.test(value) ? value : null;
}
function sessionKey(code: string): string { return `rct:room:${code}`; }
function safeParse<T>(value: string | null): T | null { try { return value ? JSON.parse(value) as T : null; } catch { return null; } }
function legacyTokenExpiry(token: string): number | null {
  try {
    const body = token.split('.')[0];
    if (!body) return null;
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))) as { e?: number };
    return Number.isFinite(payload.e) ? payload.e! : null;
  } catch { return null; }
}
function sessionExpiry(session: Session): number | null { return session.expiresAt || legacyTokenExpiry(session.token); }
function getSession(code: string): Session | null {
  const key = sessionKey(code);
  const session = safeParse<Session>(localStorage.getItem(key));
  const expiry = session ? sessionExpiry(session) : null;
  if (session && expiry !== null && expiry <= Date.now()) {
    localStorage.removeItem(key);
    return null;
  }
  return session;
}
function saveSession(code: string, session: Session): void { localStorage.setItem(sessionKey(code), JSON.stringify(session)); }
function purgeExpiredSessions(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith('rct:room:')) continue;
    const session = safeParse<Session>(localStorage.getItem(key));
    const expiry = session ? sessionExpiry(session) : null;
    if (!session || (expiry !== null && expiry <= Date.now())) localStorage.removeItem(key);
  }
}
function readSettings(): Settings { return { quietResolution: false, highContrast: false, ...(safeParse<Settings>(localStorage.getItem(isDemo() ? DEMO_SETTINGS_KEY : REAL_SETTINGS_KEY)) || {}) }; }
function persistSettings(): void {
  localStorage.setItem(isDemo() ? DEMO_SETTINGS_KEY : REAL_SETTINGS_KEY, JSON.stringify(settings));
  document.documentElement.classList.toggle('high-contrast', settings.highContrast);
}
function escapeHtml(value: string): string { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!); }
function prettyMap(id: string): string { return id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '); }

function setRouteMetadata(path: string): void {
  const route = path === '/demo' ? '/demo' : path === '/privacy' ? '/privacy' : path === '/terms' ? '/terms' : '/';
  const descriptions: Record<string, string> = {
    '/': 'Plan five simultaneous turns with one friend in a private room-code tactics match.',
    '/demo': 'Play a complete five-turn Roomcode Tactics sample with separate browser storage.',
    '/privacy': 'Read what Roomcode Tactics stores, where requests go, and when rooms are deleted.',
    '/terms': 'Read the terms for playing a private Roomcode Tactics match.',
  };
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', descriptions[route]);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://roomcode-tactics.sociobot.in${route}`);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
  } catch {
    throw new Error('The room service could not be reached. Check your connection, then try again.');
  }
  const body = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || 'The room service did not respond. Check your connection and try again.');
  return body;
}

function relativeTime(expiresAt: number): string {
  const hours = Math.max(0, Math.ceil((expiresAt - Date.now()) / 3_600_000));
  return hours === 1 ? 'about 1 hour' : `about ${hours} hours`;
}

function moveIsLegal(state: RoomState, target: Coordinate): boolean {
  const player = state.players.find((item) => item.player === state.yourPlayer)!;
  return target.x >= 0 && target.x < 7 && target.y >= 0 && target.y < 7
    && Math.abs(target.x - player.position.x) + Math.abs(target.y - player.position.y) <= 1
    && !state.map.blocked.some((cell) => cell.x === target.x && cell.y === target.y);
}

function playerAt(state: RoomState, cell: Coordinate): PlayerNumber | null {
  return state.players.find((player) => player.position.x === cell.x && player.position.y === cell.y)?.player || null;
}

function objectiveAt(state: RoomState, cell: Coordinate): PlayerNumber | null | undefined {
  return state.objectives.find((objective) => objective.x === cell.x && objective.y === cell.y)?.owner;
}

function boardMarkup(state: RoomState, interactive: boolean): string {
  const cells: string[] = [];
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const cell = { x, y };
      const blocked = state.map.blocked.some((item) => item.x === x && item.y === y);
      const player = playerAt(state, cell);
      const objective = objectiveAt(state, cell);
      const canMove = interactive && moveIsLegal(state, cell) && state.status === 'active' && !state.yourMoveLocked;
      const selectedCell = selected?.x === x && selected?.y === y;
      const description = [
        `Row ${y + 1}, column ${x + 1}`,
        blocked ? 'blocked forest' : 'open ground',
        objective !== undefined ? objective ? `marker held by ${objective === 1 ? 'north' : 'south'}` : 'unclaimed marker' : '',
        player ? `${state.players.find((item) => item.player === player)?.name}'s scout` : '',
        canMove ? 'available move' : '',
      ].filter(Boolean).join(', ');
      cells.push(`<button class="map-cell ${blocked ? 'is-forest' : 'is-sand'} ${canMove ? 'can-move' : ''} ${selectedCell ? 'is-selected' : ''} ${player ? `has-player player-${player}` : ''}" type="button" data-cell="${x}-${y}" aria-label="${escapeHtml(description)}" ${canMove ? '' : 'disabled'}>
        ${objective !== undefined ? `<span class="objective ${objective ? `claimed-by-${objective}` : ''}" aria-hidden="true"></span>` : ''}
        ${player ? `<span class="scout" aria-hidden="true">${player === 1 ? 'N' : 'S'}</span>` : ''}
      </button>`);
    }
  }
  return `<div class="board-shell ${lastResolutionSeen === state.lastResolution ? '' : 'resolve-flash'}" aria-label="Seven by seven tactical map" role="group">
    <div class="map-fold fold-v" aria-hidden="true"></div><div class="map-fold fold-h" aria-hidden="true"></div>
    <div class="map-grid">${cells.join('')}</div>
  </div>`;
}

function scoreMarkup(state: RoomState): string {
  return `<ol class="score-list" aria-label="Score">
    ${state.players.map((player) => `<li class="${player.player === state.yourPlayer ? 'is-you' : ''}"><span><i class="team-dot team-${player.player}"></i>${escapeHtml(player.name)}${player.player === state.yourPlayer ? ' (you)' : ''}</span><strong>${player.score}</strong></li>`).join('')}
  </ol>`;
}

function noticeMarkup(): string {
  if (!notice) return '';
  return `<p class="notice notice-${noticeKind}" role="${noticeKind === 'error' ? 'alert' : 'status'}" ${noticeKind === 'error' ? 'tabindex="-1"' : ''}>${escapeHtml(notice)}</p>`;
}

function homeContent(): string {
  const code = roomCodeFromUrl();
  const state = roomState || previewState();
  const hasRoom = Boolean(roomState);
  const waitingToJoin = Boolean(code && !getSession(code) && !roomState);
  const headline = hasRoom ? gameHeadline(state) : 'Plan turns against a friend';
  return `<main id="main" tabindex="-1">
    <section class="game-layout" aria-labelledby="page-title">
      <div class="game-intro">
        <p class="eyebrow">Two-player tactics</p>
        <h1 id="page-title" tabindex="-1">${headline}</h1>
        <p class="lede">For two friends who want a short tactical match without accounts or live timing.</p>
        ${hasRoom ? roomActions(state) : `<div class="first-actions"><button class="button button-primary" type="button" data-action="show-create">Create a room</button><a class="button button-secondary" href="/demo">Try it with sample data</a></div>
        <p class="action-note">Create a room, then share its link before your first turn.</p>`}
        <ul class="facts"><li>Free to play</li><li>No tracking</li><li>Two-seat rooms</li></ul>
        <p class="network-note" id="network-status" aria-live="polite">${navigator.onLine ? 'Create or join when you are ready.' : 'You are offline. Reconnect before creating or joining a room.'}</p>
        ${noticeMarkup()}
      </div>
      <section class="game-board-panel" aria-labelledby="board-title"><img class="field-texture" src="/folded-map.webp" srcset="/folded-map-512.webp 512w, /folded-map.webp 1024w" sizes="(max-width: 760px) 92vw, 620px" width="1024" height="1024" alt="" decoding="async" />
        <div class="board-meta"><div><p class="eyebrow">${hasRoom ? escapeHtml(state.roomCode) : 'Board preview'}</p><h2 id="board-title">${hasRoom ? `${prettyMap(state.map.id)} · ${state.map.weather}` : 'Seven by seven folded map'}</h2></div><p>${hasRoom ? state.status === 'completed' ? 'Match complete' : `Turn ${state.round} of ${state.maxRounds}` : 'Markers decide the match'}</p></div>
        ${boardMarkup(state, hasRoom && state.status === 'active')}
        <div class="board-legend" aria-label="Map key"><span><i class="legend-scout north"></i>North scout</span><span><i class="legend-scout south"></i>South scout</span><span><i class="legend-marker"></i>Marker</span><span><i class="legend-forest"></i>Blocked forest</span></div>
      </section>
    </section>
    ${hasRoom ? playPanel(state) : waitingToJoin ? joinPanel(code!) : createPanel()}
    ${hasRoom ? howPanel() : `<section class="how-section" aria-labelledby="how-title"><h2 id="how-title">How the match works</h2><ol><li><strong>Create a room.</strong> Share its private link with one friend.</li><li><strong>Choose a square.</strong> Both players lock a move at their own pace.</li><li><strong>Read the result.</strong> The board resolves after both moves, for five turns.</li></ol></section>`}
    ${privacyPanel()}
  </main>`;
}

function previewState(): RoomState {
  return { ...demoSeed(), roomCode: 'PREVIEW', status: 'lobby', yourMoveLocked: true, lastResolution: 'Create a room to choose a scout move.' };
}

function gameHeadline(state: RoomState): string {
  if (state.status === 'completed') return state.winner === 'you' ? 'You won this five-turn match' : state.winner === 'opponent' ? 'Your friend won this five-turn match' : 'This five-turn match ended level';
  if (state.status === 'lobby') return 'Share this room link with one friend';
  return state.yourMoveLocked ? 'Your move is locked' : 'Choose your move for this turn';
}

function createPanel(): string {
  return `<section class="room-panel" aria-labelledby="room-title"><div><p class="eyebrow">Start a real match</p><h2 id="room-title">Create a private room</h2><p>Use your first name or a short nickname. Your friend joins with the link.</p></div>
    <form id="create-form" class="room-form"><label for="create-name">Your name</label><input id="create-name" name="name" minlength="2" maxlength="20" autocomplete="nickname" value="${escapeHtml(draftName)}" required /><button class="button button-primary" type="submit">Create room</button></form>
    <p class="form-help">A room stays available for up to 24 hours.</p></section>`;
}

function joinPanel(code: string): string {
  return `<section class="room-panel" aria-labelledby="join-title"><div><p class="eyebrow">Room ${escapeHtml(code)}</p><h2 id="join-title">Join your friend’s match</h2><p>Choose a name, then both scouts can plan the first turn.</p></div>
    <form id="join-form" class="room-form"><label for="join-name">Your name</label><input id="join-name" name="name" minlength="2" maxlength="20" autocomplete="nickname" value="${escapeHtml(draftName)}" required /><button class="button button-primary" type="submit">Join room</button></form></section>`;
}

function roomActions(state: RoomState): string {
  if (state.status === 'completed') return `<div class="first-actions"><button class="button button-primary" data-action="new-room" type="button">Create another room</button><button class="button button-secondary" data-action="forget-room" type="button">Forget this room</button></div>`;
  if (state.status === 'lobby') return `<div class="first-actions"><button class="button button-primary" data-action="copy-link" type="button">Copy room link</button><button class="button button-secondary" data-action="refresh" type="button">Check room</button><button class="text-button" data-action="forget-room" type="button">Forget this room</button></div>`;
  return `<div class="first-actions"><button class="button button-primary" data-action="submit-move" type="button" ${!selected || state.yourMoveLocked ? 'disabled' : ''}>${state.yourMoveLocked ? 'Move locked' : 'Submit move'}</button><button class="button button-secondary" data-action="refresh" type="button">Refresh room</button><button class="text-button" data-action="forget-room" type="button">Forget this room</button></div>`;
}

function playPanel(state: RoomState): string {
  const you = state.players.find((player) => player.player === state.yourPlayer)!;
  const partner = state.players.find((player) => player.player !== state.yourPlayer);
  const selectedText = selected ? `Selected: row ${selected.y + 1}, column ${selected.x + 1}.` : 'Select your current square or an adjacent open square.';
  return `<section class="play-panel" aria-labelledby="turn-title"><div class="turn-copy"><p class="eyebrow">Room ${escapeHtml(state.roomCode)}</p><h2 id="turn-title">${state.status === 'completed' ? endMessage(state) : state.status === 'lobby' ? 'Waiting for your friend' : state.yourMoveLocked ? 'Waiting for your friend’s move' : `Plan ${escapeHtml(you.name)}’s move`}</h2>
    <p>${state.status === 'completed' ? 'Scores are final. Create another room for a fresh map.' : state.status === 'lobby' ? `Copy the link. This room expires in ${relativeTime(state.expiresAt)}.` : state.yourMoveLocked ? 'Your choice is saved. The board will resolve when your friend locks a move.' : selectedText}</p>
    ${state.lastResolution ? `<p class="resolution" aria-live="polite"><strong>Last resolution:</strong> ${escapeHtml(state.lastResolution)}</p>` : ''}
    ${state.status === 'completed' ? `<button class="button button-primary" type="button" data-action="new-room">Create another room</button>` : ''}</div>
    <div class="score-box"><h3>Markers secured</h3>${scoreMarkup(state)}${partner ? `<p>${escapeHtml(partner.name)} is ${partner.player === 1 ? 'north' : 'south'}. You are ${you.player === 1 ? 'north' : 'south'}.</p>` : '<p>North scout is ready. South scout joins from the room link.</p>'}</div></section>`;
}

function endMessage(state: RoomState): string { return state.winner === 'you' ? 'You won' : state.winner === 'opponent' ? 'You lost' : 'The match is a draw'; }

function howPanel(): string {
  return `<section class="how-section" aria-labelledby="how-title"><h2 id="how-title">How to finish this match</h2><ol><li><strong>Lock one move each turn.</strong> Both players lock a move before the board resolves.</li><li><strong>Secure markers.</strong> Step onto an unclaimed cyan marker.</li><li><strong>Compare scores after turn five.</strong> More markers wins; equal scores draw.</li></ol></section>`;
}

function privacyPanel(): string {
  return `<section class="privacy-section" aria-labelledby="privacy-title"><h2 id="privacy-title">Privacy and limits</h2><p>Each room has two seats and expires after 24 hours.</p><p>Use a nickname if you prefer. <a href="/privacy">Read the privacy details</a>.</p></section>`;
}

function demoContent(): string {
  const state = roomState || demoSeed();
  return `<main id="main" tabindex="-1"><section class="demo-banner" aria-label="Demo mode"><span>Demo — sample data, nothing is saved</span><span><button type="button" data-action="reset-demo">Reset demo</button><button type="button" data-action="start-real">Start for real</button></span></section>
    <section class="game-layout demo-layout" aria-labelledby="page-title"><div class="game-intro"><p class="eyebrow">Sample match</p><h1 id="page-title" tabindex="-1">Plan five sample turns</h1><p class="lede">Try the full board as Mira against Teo. This sample stays separate from real rooms.</p>
      <div class="first-actions"><button class="button button-primary" data-action="submit-demo" type="button" ${!selected || state.status === 'completed' ? 'disabled' : ''}>${state.status === 'completed' ? 'Sample complete' : 'Resolve sample turn'}</button><button class="button button-secondary" data-action="reset-demo" type="button">Reset demo</button></div>
      <p class="action-note">Choose Mira’s square. Teo holds position so you can see each resolution.</p><ul class="facts"><li>Sample names: Mira and Teo</li><li>Separate demo storage</li><li>No real room created</li></ul>${noticeMarkup()}</div>
      <section class="game-board-panel" aria-labelledby="board-title"><img class="field-texture" src="/folded-map.webp" srcset="/folded-map-512.webp 512w, /folded-map.webp 1024w" sizes="(max-width: 760px) 92vw, 620px" width="1024" height="1024" alt="" decoding="async" /><div class="board-meta"><div><p class="eyebrow">Sample room</p><h2 id="board-title">Cypress Pass · Clear paths</h2></div><p>${state.status === 'completed' ? 'Sample complete' : `Turn ${state.round} of 5`}</p></div>${boardMarkup(state, state.status === 'active')}<div class="board-legend" aria-label="Map key"><span><i class="legend-scout north"></i>Mira</span><span><i class="legend-scout south"></i>Teo</span><span><i class="legend-marker"></i>Marker</span><span><i class="legend-forest"></i>Blocked forest</span></div></section></section>
    ${playPanel(state)}${howPanel()}</main>`;
}

function legalContent(kind: 'privacy' | 'terms'): string {
  const privacy = kind === 'privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Roomcode Tactics`;
  return `<main id="main" tabindex="-1" class="legal-main"><article class="legal-copy"><p class="eyebrow">Roomcode Tactics</p><h1 id="page-title" tabindex="-1">${privacy ? 'Privacy for your room' : 'Terms for playing Roomcode Tactics'}</h1>
  ${privacy ? `<h2>What the game stores</h2><p>The room service stores player names, room codes, moves, pass hashes, and results. It deletes all room data automatically after 24 hours.</p><p>Your browser stores the room code, your name, its expiry, and an opaque room pass so it can reconnect. It removes expired entries on your next visit.</p><h2>Why it stores this</h2><p>The game uses this data to let two players reconnect and finish the same room. It does not use analytics or advertising trackers.</p><h2>Where the data goes</h2><p>Your browser sends game requests only to Roomcode Tactics and its room service. The service keeps room state on its own durable storage.</p><h2>Your choices</h2><p>Use a nickname if you prefer. Choose “Forget this room” to remove that entry from this browser. The shared room remains until its automatic deletion.</p>` : `<h2>Using the game</h2><p>Roomcode Tactics is a free game for private matches between two people. Do not use a name or room link to harass another person.</p><h2>Room links</h2><p>Anyone with a room link can ask to join while the second seat is open. Keep the link between the two players you invite.</p><h2>Availability</h2><p>Room passes reconnect after a page refresh. The service deletes all room data after 24 hours.</p><h2>Changes</h2><p>We may update the game or these terms. The current version is shown in the page footer.</p>`}
  </article></main>`;
}

function header(): string {
  return `<header class="site-header"><a class="wordmark" href="/" aria-label="Roomcode Tactics home"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="m4 9 16-6 16 6v22l-16 6-16-6zM20 3v34M4 9l16 7 16-7"/><circle cx="20" cy="20" r="4"/></svg><span>Roomcode Tactics</span></a><nav aria-label="Main navigation"><a href="/demo">Demo</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button class="settings-button" type="button" data-action="settings">Settings</button></nav></header>`;
}

function footer(): string {
  return `<footer class="site-footer"><p>A five-turn room-code tactics game for two friends.</p><p><a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>Built by Param Factory</span></p><p>Build <span data-build>${escapeHtml(BUILD_ID)}</span> · Generated map texture.</p></footer>`;
}

function settingsDialog(): string {
  return `<dialog id="settings-dialog" aria-labelledby="settings-title"><form method="dialog"><div class="dialog-head"><div><p class="eyebrow">Controls</p><h2 id="settings-title">Game settings</h2></div><button class="icon-button" value="close" aria-label="Close settings">×</button></div><label class="switch-row"><input id="quiet-setting" type="checkbox" ${settings.quietResolution ? 'checked' : ''}/><span>Use still resolution effects</span></label><label class="switch-row"><input id="contrast-setting" type="checkbox" ${settings.highContrast ? 'checked' : ''}/><span>Use high-contrast colors</span></label><p>These settings stay only in this browser${isDemo() ? ' for the sample' : ''}.</p></form></dialog>`;
}

function render(): void {
  settings = readSettings();
  persistSettings();
  const path = location.pathname;
  setRouteMetadata(path);
  const routeChanged = lastRenderedPath !== path;
  lastRenderedPath = path;
  if (path === '/privacy') app.innerHTML = `${header()}${legalContent('privacy')}${footer()}${settingsDialog()}<p class="sr-only" aria-live="polite">Privacy page</p>`;
  else if (path === '/terms') app.innerHTML = `${header()}${legalContent('terms')}${footer()}${settingsDialog()}<p class="sr-only" aria-live="polite">Terms page</p>`;
  else {
    document.title = isDemo() ? 'Demo — Roomcode Tactics' : 'Roomcode Tactics — Plan turns with a friend';
    app.innerHTML = `${header()}${isDemo() ? demoContent() : homeContent()}${footer()}${settingsDialog()}`;
  }
  if (routeChanged) document.querySelector<HTMLElement>('#page-title')?.focus({ preventScroll: true });
  wire();
  if (roomState?.lastResolution) lastResolutionSeen = roomState.lastResolution;
}

function rerender(message = '', kind: NoticeKind = 'status'): void {
  notice = message;
  noticeKind = kind;
  render();
  if (kind === 'error') document.querySelector<HTMLElement>('.notice-error')?.focus();
}

async function createRoom(form: HTMLFormElement): Promise<void> {
  const name = String(new FormData(form).get('name') || '');
  draftName = name;
  inFlight = true;
  try {
    const result = await api<RoomState & { token: string }>('/v1/rooms', { method: 'POST', body: JSON.stringify({ name }) });
    saveSession(result.roomCode, { token: result.token, name, expiresAt: result.expiresAt });
    draftName = '';
    roomState = result;
    selected = null;
    navigate(`/?room=${result.roomCode}`, false);
    rerender('Room created. Copy the link for your friend.');
  } catch (error) { rerender(error instanceof Error ? error.message : 'The room could not be created. Try again.', 'error'); } finally { inFlight = false; }
}

async function joinRoom(form: HTMLFormElement): Promise<void> {
  const code = roomCodeFromUrl();
  if (!code) return;
  const name = String(new FormData(form).get('name') || '');
  draftName = name;
  inFlight = true;
  try {
    const result = await api<RoomState & { token: string }>(`/v1/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ name }) });
    saveSession(code, { token: result.token, name, expiresAt: result.expiresAt }); draftName = ''; roomState = result; selected = null; rerender('You joined the room. Choose your first move.');
  } catch (error) { rerender(error instanceof Error ? error.message : 'The room could not be joined. Check the link, then try again.', 'error'); } finally { inFlight = false; }
}

async function refreshRoom(): Promise<void> {
  const code = roomCodeFromUrl(); const session = code ? getSession(code) : null;
  if (!code || !session) return;
  try { roomState = await api<RoomState>(`/v1/rooms/${code}`, { headers: { Authorization: `Bearer ${session.token}` } }); selected = null; rerender('Room refreshed.'); }
  catch (error) { rerender(error instanceof Error ? error.message : 'The room could not be refreshed. Check your connection, then try again.', 'error'); }
}

async function submitMove(): Promise<void> {
  const code = roomCodeFromUrl(); const session = code ? getSession(code) : null;
  if (!code || !session || !roomState || !selected || inFlight) return;
  inFlight = true;
  try {
    roomState = await api<RoomState>(`/v1/rooms/${code}/moves`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ target: selected, move_id: crypto.randomUUID().replace(/-/g, '') }) });
    selected = null; rerender(roomState.yourMoveLocked ? 'Move locked. Waiting for your friend.' : roomState.lastResolution || 'Move resolved.');
  } catch (error) { rerender(error instanceof Error ? error.message : 'The move could not be submitted. Check your connection, then try again.', 'error'); } finally { inFlight = false; }
}

function updateDemo(target: Coordinate): void {
  const state = roomState || demoSeed();
  const p1 = state.players.find((player) => player.player === 1)!;
  const p2 = state.players.find((player) => player.player === 2)!;
  const conflict = target.x === p2.position.x && target.y === p2.position.y;
  const newPosition = conflict ? p1.position : target;
  const objectives = state.objectives.map((objective) => !objective.owner && objective.x === newPosition.x && objective.y === newPosition.y ? { ...objective, owner: 1 as PlayerNumber } : objective);
  const score = objectives.filter((objective) => objective.owner === 1).length;
  const complete = state.round === 5;
  roomState = {
    ...state,
    round: complete ? 5 : state.round + 1,
    status: complete ? 'completed' : 'active',
    players: [{ ...p1, position: newPosition, score }, p2], objectives,
    winner: complete ? score > p2.score ? 'you' : score < p2.score ? 'opponent' : 'draw' : null,
    lastResolution: conflict ? 'Mira and Teo chose the same square, so neither scout moved.' : objectives.some((objective) => objective.owner === 1 && objective.x === newPosition.x && objective.y === newPosition.y) ? 'Mira secured a cyan marker.' : 'Both sample plans resolved without securing a marker.',
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(roomState)); selected = null; rerender(roomState.status === 'completed' ? 'Sample match complete.' : roomState.lastResolution || 'Sample turn resolved.');
}

function copyLink(): void {
  if (!navigator.clipboard) {
    rerender('Copy the room link from your browser address bar.');
    return;
  }
  void navigator.clipboard.writeText(location.href)
    .then(() => rerender('Room link copied.'))
    .catch(() => rerender('The room link could not be copied. Copy it from your browser address bar.', 'error'));
}

function resetDemo(): void { localStorage.removeItem(DEMO_KEY); roomState = demoSeed(); selected = null; localStorage.setItem(DEMO_KEY, JSON.stringify(roomState)); rerender('Demo reset. No real room was changed.'); }
function startReal(): void { localStorage.removeItem(DEMO_KEY); localStorage.removeItem(DEMO_SETTINGS_KEY); roomState = null; selected = null; navigate('/', false); rerender('Demo cleared. Create a real room when you are ready.'); }
function forgetRoom(): void {
  const code = roomCodeFromUrl();
  if (code) localStorage.removeItem(sessionKey(code));
  roomState = null;
  selected = null;
  navigate('/', false);
  rerender('This room was removed from this browser. The shared room still expires automatically.');
}

function navigate(to: string, renderAfter = true): void { history.pushState({}, '', to); if (renderAfter) { roomState = null; selected = null; boot(); } }

function chooseCell(button: HTMLButtonElement): void {
  const [x, y] = (button.dataset.cell || '').split('-').map(Number);
  if (!roomState || !Number.isInteger(x) || !Number.isInteger(y) || !moveIsLegal(roomState, { x, y })) return;
  selected = { x, y }; rerender(`Selected row ${y + 1}, column ${x + 1}.`);
}

function wire(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault(); navigate(link.getAttribute('href') || '/');
  }));
  document.querySelector<HTMLFormElement>('#create-form')?.addEventListener('submit', (event) => { event.preventDefault(); void createRoom(event.currentTarget as HTMLFormElement); });
  document.querySelector<HTMLFormElement>('#join-form')?.addEventListener('submit', (event) => { event.preventDefault(); void joinRoom(event.currentTarget as HTMLFormElement); });
  document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((button) => button.addEventListener('click', () => chooseCell(button)));
  document.querySelector('[data-action="show-create"]')?.addEventListener('click', () => document.querySelector<HTMLInputElement>('#create-name')?.focus());
  document.querySelector('[data-action="copy-link"]')?.addEventListener('click', copyLink);
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => void refreshRoom());
  document.querySelector('[data-action="submit-move"]')?.addEventListener('click', () => void submitMove());
  document.querySelector('[data-action="submit-demo"]')?.addEventListener('click', () => { if (selected) updateDemo(selected); });
  document.querySelectorAll('[data-action="reset-demo"]').forEach((button) => button.addEventListener('click', resetDemo));
  document.querySelector('[data-action="start-real"]')?.addEventListener('click', startReal);
  document.querySelector('[data-action="forget-room"]')?.addEventListener('click', forgetRoom);
  document.querySelectorAll('[data-action="new-room"]').forEach((button) => button.addEventListener('click', () => { roomState = null; selected = null; navigate('/'); }));
  const dialog = document.querySelector<HTMLDialogElement>('#settings-dialog');
  document.querySelector('[data-action="settings"]')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector<HTMLInputElement>('#quiet-setting')?.addEventListener('change', (event) => { settings.quietResolution = (event.currentTarget as HTMLInputElement).checked; persistSettings(); });
  document.querySelector<HTMLInputElement>('#contrast-setting')?.addEventListener('change', (event) => { settings.highContrast = (event.currentTarget as HTMLInputElement).checked; persistSettings(); });
  document.querySelectorAll<HTMLButtonElement>('.map-cell').forEach((cell) => cell.addEventListener('keydown', (event) => {
    const [x, y] = (cell.dataset.cell || '').split('-').map(Number); let next: Coordinate | null = null;
    if (event.key === 'ArrowLeft') next = { x: x - 1, y }; if (event.key === 'ArrowRight') next = { x: x + 1, y };
    if (event.key === 'ArrowUp') next = { x, y: y - 1 }; if (event.key === 'ArrowDown') next = { x, y: y + 1 };
    if (next && next.x >= 0 && next.x < 7 && next.y >= 0 && next.y < 7) { event.preventDefault(); document.querySelector<HTMLButtonElement>(`[data-cell="${next.x}-${next.y}"]`)?.focus(); }
  }));
}

async function boot(): Promise<void> {
  purgeExpiredSessions();
  if (isDemo()) {
    roomState = safeParse<RoomState>(localStorage.getItem(DEMO_KEY)) || demoSeed();
    localStorage.setItem(DEMO_KEY, JSON.stringify(roomState)); selected = null; render(); return;
  }
  const code = roomCodeFromUrl(); const session = code ? getSession(code) : null;
  if (code && session) {
    try { roomState = await api<RoomState>(`/v1/rooms/${code}`, { headers: { Authorization: `Bearer ${session.token}` } }); notice = 'Rejoined your saved room.'; }
    catch (error) { roomState = null; notice = error instanceof Error ? error.message : 'Open the room link to join again.'; noticeKind = 'error'; }
  }
  render();
}

window.addEventListener('popstate', () => { roomState = null; selected = null; void boot(); });
window.addEventListener('online', () => rerender('You are back online. Refresh the room to check for a move.'));
window.addEventListener('offline', () => rerender('You are offline. Reconnect before submitting a move.'));
document.addEventListener('visibilitychange', () => { if (!document.hidden && roomState && !isDemo() && roomState.status === 'active') void refreshRoom(); });
void boot();
