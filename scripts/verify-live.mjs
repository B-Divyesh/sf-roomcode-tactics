import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.BASE_URL || 'https://roomcode-tactics.sociobot.in';
const apiOrigin = process.env.API_URL || 'https://roomcode-tactics-realtime.sociobot.in';
const evidenceDir = process.env.EVIDENCE_DIR || '/work/.evidence/roomcode-tactics-repair-1/live';
mkdirSync(evidenceDir, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];
const watchErrors = (page) => {
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
};
const openPage = async (context) => {
  const page = await context.newPage();
  watchErrors(page);
  return page;
};
const visible = async (locator) => {
  await locator.waitFor({ state: 'visible', timeout: 20_000 });
  return locator;
};
const assertCleanAxe = async (page, label) => {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  assert.deepEqual(serious.map((violation) => violation.id), [], `${label} has serious accessibility violations`);
};

const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktop = await openPage(desktopContext);
await desktop.goto(origin, { waitUntil: 'networkidle' });
assert.equal(await desktop.title(), 'Roomcode Tactics — Plan turns with a friend');
assert.equal(await desktop.locator('h1').textContent(), 'Plan turns against a friend');
assert.match(await desktop.locator('.lede').textContent(), /two friends/i);
assert.equal(await desktop.locator('[data-build]').textContent(), '00afdda');
await visible(desktop.getByRole('button', { name: 'Create a room' }));
const desktopBoard = await desktop.locator('.game-board-panel').boundingBox();
assert.ok(desktopBoard && desktopBoard.y < 900, 'desktop board starts before the fold');
await assertCleanAxe(desktop, 'desktop home');
await desktop.screenshot({ path: `${evidenceDir}/first-screen-desktop.png` });
await desktopContext.close();

const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const phone = await openPage(phoneContext);
await phone.goto(origin, { waitUntil: 'networkidle' });
await visible(phone.getByRole('heading', { name: 'Plan turns against a friend' }));
await visible(phone.getByRole('link', { name: 'Try it with sample data' }));
const phoneBoard = await phone.locator('.game-board-panel').boundingBox();
assert.ok(phoneBoard && phoneBoard.y < 844, 'phone board starts before the fold');
const phoneTargets = phone.locator('.site-header a, .site-header button');
for (let index = 0; index < await phoneTargets.count(); index += 1) {
  const box = await phoneTargets.nth(index).boundingBox();
  assert.ok(box && box.width >= 44 && box.height >= 44, 'phone header target is at least 44 px');
}
await phone.screenshot({ path: `${evidenceDir}/first-screen-phone.png` });
await phoneContext.close();

const demoContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const demo = await openPage(demoContext);
const demoRequests = [];
demo.on('request', (request) => demoRequests.push(request.url()));
await demo.goto(`${origin}/demo`, { waitUntil: 'networkidle' });
const realSentinel = JSON.stringify({ token: 'test-only-sentinel', name: 'Unrelated local room', expiresAt: Date.now() + 60_000 });
await demo.evaluate((value) => localStorage.setItem('rct:room:KEEP22', value), realSentinel);
await visible(demo.getByText('Demo — sample data, nothing is saved'));
await visible(demo.getByText('Mira (you)', { exact: false }));
for (const move of ['3-5', '3-4', '3-3', '2-3', '1-3']) {
  await demo.locator(`[data-cell="${move}"]`).click();
  await demo.getByRole('button', { name: 'Resolve sample turn' }).click();
  await visible(demo.getByText('Demo — sample data, nothing is saved'));
}
await visible(demo.getByRole('heading', { name: 'You won' }));
await demo.screenshot({ path: `${evidenceDir}/sample-end-screen.png`, fullPage: true });
await demo.reload();
await visible(demo.getByRole('heading', { name: 'You won' }));
await demo.getByRole('button', { name: 'Reset demo' }).first().click();
await visible(demo.getByText('Turn 1 of 5'));
await demo.getByRole('button', { name: 'Start for real' }).click();
assert.deepEqual(await demo.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('demo:roomcode-tactics:'))), []);
assert.equal(await demo.evaluate(() => localStorage.getItem('rct:room:KEEP22')), realSentinel);
assert.ok(demoRequests.every((url) => new URL(url).origin === origin), 'demo contacts only its own origin');
await demoContext.close();

const firstContext = await browser.newContext();
const secondContext = await browser.newContext();
const thirdContext = await browser.newContext();
const first = await openPage(firstContext);
const second = await openPage(secondContext);
const third = await openPage(thirdContext);
await first.goto(origin);
await first.getByRole('button', { name: 'Create a room' }).click();
await first.getByLabel('Your name').fill('Mira Live');
await first.getByRole('button', { name: 'Create room' }).click();
await visible(first.getByRole('heading', { name: 'Share this room link with one friend' }));
const roomUrl = first.url();
await second.goto(roomUrl);
await second.getByLabel('Your name').fill('Teo Live');
await second.getByRole('button', { name: 'Join room' }).click();
await visible(second.getByRole('heading', { name: 'Choose your move for this turn' }));
await third.goto(roomUrl);
await third.getByLabel('Your name').fill('Lina Live');
await third.getByRole('button', { name: 'Join room' }).click();
await visible(third.locator('.notice-error'));
assert.match(await third.locator('.notice-error').textContent(), /already has two players/);
await first.getByRole('button', { name: 'Check room' }).click();
await visible(first.getByRole('heading', { name: 'Choose your move for this turn' }));
for (const move of ['3-5', '3-4', '3-3', '2-3', '1-3']) {
  await first.locator(`[data-cell="${move}"]`).click();
  await first.getByRole('button', { name: 'Submit move' }).click();
  await visible(first.getByRole('heading', { name: 'Your move is locked' }));
  await second.locator('[data-cell="3-0"]').click();
  await second.getByRole('button', { name: 'Submit move' }).click();
  await first.getByRole('button', { name: 'Refresh room' }).click();
}
await visible(first.getByRole('heading', { name: 'You won', exact: true }));
await visible(second.getByRole('heading', { name: 'You lost' }));
await first.screenshot({ path: `${evidenceDir}/real-winner-end-screen.png`, fullPage: true });
await second.screenshot({ path: `${evidenceDir}/real-loser-end-screen.png`, fullPage: true });
await first.reload();
await second.reload();
await visible(first.getByRole('heading', { name: 'You won', exact: true }));
await visible(second.getByRole('heading', { name: 'You lost' }));

const fourthContext = await browser.newContext();
const fourth = await openPage(fourthContext);
await fourth.goto(origin);
await fourth.getByRole('button', { name: 'Create a room' }).click();
await fourth.getByLabel('Your name').fill('Isolation Live');
await fourth.getByRole('button', { name: 'Create room' }).click();
await visible(fourth.getByRole('heading', { name: 'Share this room link with one friend' }));
const otherCode = new URL(fourth.url()).searchParams.get('room');
const firstCode = new URL(roomUrl).searchParams.get('room');
const firstToken = await first.evaluate((code) => JSON.parse(localStorage.getItem(`rct:room:${code}`)).token, firstCode);
assert.match(firstToken, /^[A-Za-z0-9_-]{43}$/, 'the live room pass is opaque');
const isolation = await fetch(`${apiOrigin}/v1/rooms/${otherCode}`, { headers: { Authorization: `Bearer ${firstToken}` } });
assert.equal(isolation.status, 403, 'one room pass cannot read another room');
await firstContext.close();
await secondContext.close();
await thirdContext.close();
await fourthContext.close();

const routeContext = await browser.newContext();
const routePage = await openPage(routeContext);
const missing = await routePage.goto(`${origin}/repair-check-missing`);
assert.equal(missing.status(), 404);
assert.equal(await routePage.title(), 'Page not found — Roomcode Tactics');
await visible(routePage.getByRole('heading', { name: 'Page not found' }));
await visible(routePage.getByRole('navigation', { name: 'Main navigation' }));
await visible(routePage.getByRole('contentinfo'));
await routePage.goto(origin);
await routePage.getByRole('link', { name: 'Privacy', exact: true }).first().click();
await visible(routePage.getByRole('heading', { name: 'Privacy for your room' }));
assert.equal(await routePage.title(), 'Privacy — Roomcode Tactics');
assert.equal(await routePage.evaluate(() => document.activeElement?.id), 'page-title');
await assertCleanAxe(routePage, 'live privacy');
await routeContext.close();

let rateResponse;
let rateAttempts = 0;
for (; rateAttempts < 45; rateAttempts += 1) {
  rateResponse = await fetch(`${apiOrigin}/v1/rooms/ZZZZZZ`, { headers: { 'X-Forwarded-For': `198.51.100.${rateAttempts + 1}` } });
  if (rateResponse.status === 429) break;
}
assert.equal(rateResponse?.status, 429, 'the live request allowance returns 429');
assert.match(rateResponse.headers.get('Retry-After') || '', /^[1-9]\d*$/);
const rotated = await fetch(`${apiOrigin}/v1/rooms/ZZZZZZ`, { headers: { 'X-Forwarded-For': '203.0.113.200' } });
assert.equal(rotated.status, 429, 'changing a caller-supplied forwarding value does not bypass the allowance');

const health = await fetch(`${apiOrigin}/health`);
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.build, '00afddae428a00b80338364df067348476f61718');
const expectedHttpErrors = consoleErrors.filter((message) => /status of (409|404)/.test(message));
const unexpectedConsoleErrors = consoleErrors.filter((message) => !/status of (409|404)/.test(message));
assert.deepEqual(unexpectedConsoleErrors, []);

const result = {
  origin,
  apiOrigin,
  build: healthBody.build,
  clientBuild: '00afdda',
  firstScreen: { desktopBoardY: desktopBoard.y, phoneBoardY: phoneBoard.y },
  sample: { completed: true, persistedOnReload: true, resetToTurnOne: true, realSentinelUnchanged: true },
  realMatch: { independentClients: 2, winnerAndLoserShown: true, persistedOnReload: true, thirdSeatRejectedVisibly: true },
  opaquePass: true,
  isolationStatus: isolation.status,
  missingRouteStatus: missing.status(),
  rateLimit: { attemptsBefore429: rateAttempts + 1, retryAfter: rateResponse.headers.get('Retry-After'), changedForwardingValueStatus: rotated.status },
  accessibility: { seriousOrCriticalViolations: 0 },
  console: { unexpectedErrors: unexpectedConsoleErrors, expectedHttpErrors },
};
writeFileSync(`${evidenceDir}/live-verification.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
await browser.close();
