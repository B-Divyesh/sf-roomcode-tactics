import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createRoom, finishMatch, joinRoom } from './helpers';

const expectedBuild = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();

test('@claim:demo-never-saves-real the complete sample neither reads nor changes a real room', async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  const realSession = JSON.stringify({ token: 'real-private-pass', name: 'Secret Real Name', expiresAt: Date.now() + 60_000 });
  await page.evaluate((value) => localStorage.setItem('rct:room:KEEP22', value), realSession);
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Mira (you)', { exact: false })).toBeVisible();
  await expect(page.getByText('Secret Real Name')).toHaveCount(0);
  for (const move of ['3-5', '3-4', '3-3', '2-3', '1-3']) {
    await page.locator(`[data-cell="${move}"]`).click();
    await page.getByRole('button', { name: 'Resolve sample turn' }).click();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'You won' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('sample-end-screen.png'), fullPage: true });
  expect(requests.some((url) => url.includes(':8787/v1/rooms'))).toBe(false);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:5173')).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('rct:room:KEEP22'))).toBe(realSession);
  await page.getByRole('button', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('demo:roomcode-tactics:')))).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('rct:room:KEEP22'))).toBe(realSession);
});

test('@claim:no-tracking the landing page makes no third-party tracking request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('.map-grid')).toBeVisible();
  expect(requests.every((url) => new URL(url).hostname === '127.0.0.1')).toBe(true);
});

test('@claim:request-destinations real play contacts only the game and its room service', async ({ browser }) => {
  const origins = new Set<string>();
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  first.on('request', (request) => origins.add(new URL(request.url()).origin));
  second.on('request', (request) => origins.add(new URL(request.url()).origin));
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await finishMatch(first, second);
  await expect(first.getByRole('heading', { name: 'You won', exact: true })).toBeVisible();
  expect([...origins].sort()).toEqual(['http://127.0.0.1:5173', 'http://localhost:8787']);
  await firstContext.close();
  await secondContext.close();
});

test('@claim:seven-by-seven-map the sample and generated real maps use seven-by-seven boards', async ({ browser, page }) => {
  await page.goto('/demo');
  const board = page.getByRole('group', { name: 'Seven by seven tactical map' });
  await expect(board.locator('[data-cell]')).toHaveCount(49);
  const columns = await page.locator('.map-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' '));
  expect(columns).toHaveLength(7);
  const mapSeeds = new Set<string>();
  for (let index = 0; index < 3; index += 1) {
    const context = await browser.newContext();
    const roomPage = await context.newPage();
    await createRoom(roomPage, `Map player ${index}`);
    await expect(roomPage.getByRole('group', { name: 'Seven by seven tactical map' }).locator('[data-cell]')).toHaveCount(49);
    mapSeeds.add((await roomPage.locator('.map-rules dd').first().textContent())!);
    await context.close();
  }
  expect(mapSeeds.size).toBe(3);
});

test('@claim:restart-demo resetting the sample starts it again', async ({ page }) => {
  await page.goto('/demo');
  for (const move of ['3-5', '3-4', '3-3', '2-3', '1-3']) {
    await page.locator(`[data-cell="${move}"]`).click();
    await page.getByRole('button', { name: 'Resolve sample turn' }).click();
  }
  await expect(page.getByRole('heading', { name: 'You won' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await expect(page.getByText('Turn 1 of 5')).toBeVisible();
  await expect(page.getByLabel(/Row 7, column 4.*Mira's scout/)).toBeVisible();
  await expect(page.getByRole('list', { name: 'Score' }).getByRole('listitem').first()).toContainText('0');
  await expect(page.getByText('Demo reset. No real room was changed.')).toBeAttached();
});

test('@claim:settings-persist settings stay in this browser', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Use still resolution effects').check();
  await page.getByLabel('Use high-contrast colors').check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Use still resolution effects')).toBeChecked();
  await expect(page.getByLabel('Use high-contrast colors')).toBeChecked();
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:5173')).toBe(true);
});

test('@claim:remappable-controls board focus keys work by default, can change, and persist', async ({ page }) => {
  await page.goto('/demo');
  const origin = page.locator('[data-cell="3-5"]');
  const downward = page.locator('[data-cell="3-6"]');
  await origin.focus();
  await page.keyboard.press('ArrowDown');
  await expect(downward).toBeFocused();

  await page.getByRole('button', { name: 'Settings' }).click();
  const downBinding = page.locator('[data-key-binding="down"]');
  await downBinding.click();
  await page.keyboard.press('s');
  await expect(downBinding).toHaveAccessibleName('Move board focus down. Current key: s');
  await page.getByRole('button', { name: 'Close settings' }).click();

  await origin.focus();
  await page.keyboard.press('ArrowDown');
  await expect(origin).toBeFocused();
  await page.keyboard.press('s');
  await expect(downward).toBeFocused();

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: 'Move board focus down. Current key: s' })).toBeVisible();
});

test('@claim:active-session-length a two-player match reaches its end screen in under ten minutes of active play', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const started = performance.now();
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await finishMatch(first, second);
  const elapsedMs = performance.now() - started;
  await expect(first.getByRole('heading', { name: 'You won', exact: true })).toBeVisible();
  expect(elapsedMs).toBeLessThan(10 * 60 * 1_000);
  await firstContext.close();
  await secondContext.close();
});

test('@claim:refresh-rejoin reloading reconnects to your saved room', async ({ page }) => {
  const roomUrl = await createRoom(page);
  const code = new URL(roomUrl).searchParams.get('room')!;
  await page.reload();
  await expect(page.getByText(`Room ${code}`).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Share this room link with one friend' })).toBeVisible();
});

test('@claim:copy-room-link copying a room link writes the exact room URL to the clipboard', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:5173' });
  const roomUrl = await createRoom(page);
  await page.getByRole('button', { name: 'Copy room link' }).click();
  await expect(page.locator('.notice')).toHaveText('Room link copied.');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(roomUrl);
});

test('@claim:forget-room forgetting a room removes only its browser entry', async ({ page, request }) => {
  const roomUrl = await createRoom(page);
  const code = new URL(roomUrl).searchParams.get('room')!;
  const session = await page.evaluate((roomCode) => JSON.parse(localStorage.getItem(`rct:room:${roomCode}`)!) as { token: string }, code);

  await page.getByRole('button', { name: 'Forget this room' }).click();

  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { name: 'Plan turns against a friend' })).toBeVisible();
  await expect(page.getByText('This room was removed from this browser. The shared room still expires automatically.')).toBeVisible();
  expect(await page.evaluate((roomCode) => localStorage.getItem(`rct:room:${roomCode}`), code)).toBeNull();
  const sharedRoom = await request.get(`http://127.0.0.1:8787/v1/rooms/${code}`, { headers: { Authorization: `Bearer ${session.token}` } });
  expect(sharedRoom.status()).toBe(200);
});

test('@claim:free-join two people create and join a room without an account or payment', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await expect(second.getByText('Teo (you)', { exact: false })).toBeVisible();
  await expect(second.getByText('Mira', { exact: true })).toBeVisible();
  await firstContext.close();
  await secondContext.close();
});

test('@claim:two-seat-room a room has two seats', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const thirdContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const third = await thirdContext.newPage();
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await third.goto(roomUrl);
  await third.getByLabel('Your name').fill('Lina');
  await third.getByRole('button', { name: 'Join room' }).click();
  const error = third.locator('.notice-error');
  await expect(error).toHaveText('This room already has two players. Ask your friend for a new room link.');
  await expect(error).toBeVisible();
  const box = await error.boundingBox();
  expect(box?.width).toBeGreaterThan(200);
  expect(box?.height).toBeGreaterThan(30);
  await firstContext.close();
  await secondContext.close();
  await thirdContext.close();
});

test('new room timestamps are 24 hours after creation', async ({ request }) => {
  const now = Date.now();
  const response = await request.post('http://127.0.0.1:8787/v1/rooms', { data: { name: 'Expiry check' }, headers: { 'X-Forwarded-For': '203.0.113.78' } });
  expect(response.status()).toBe(201);
  const body = await response.json() as { expiresAt: number };
  expect(body.expiresAt - now).toBeGreaterThanOrEqual(86_399_000);
  expect(body.expiresAt - now).toBeLessThanOrEqual(86_401_000);
});

test('@claim:expired-session-cleanup expired room passes are removed from browser storage on the next visit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rct:room:OLD222', JSON.stringify({ token: 'expired-pass', name: 'Old name', expiresAt: Date.now() - 1 })));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('rct:room:OLD222'))).toBeNull();
});

test('@claim:resolution-frame-rate board rendering holds at least 55 frames per second during a sample resolution', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'Frame rate is measured once in the declared phone profile.');
  await page.goto('/demo');
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const measurement = page.evaluate(() => new Promise<number>((resolve) => {
    const samples: number[] = [];
    const start = performance.now();
    const frame = (time: number) => {
      samples.push(time);
      if (time - start < 2_000) requestAnimationFrame(frame);
      else resolve((samples.length - 1) * 1000 / (samples.at(-1)! - samples[0]));
    };
    requestAnimationFrame(frame);
  }));
  await page.locator('[data-cell="3-5"]').click();
  await page.getByRole('button', { name: 'Resolve sample turn' }).click();
  const framesPerSecond = await measurement;
  const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await testInfo.attach('frame-rate.json', { body: JSON.stringify({ framesPerSecond, viewport: page.viewportSize(), devicePixelRatio, cpuThrottleRate: 4 }, null, 2), contentType: 'application/json' });
  console.log(`Measured resolution frame rate: ${framesPerSecond.toFixed(2)} fps at 4x CPU throttle.`);
  expect(framesPerSecond).toBeGreaterThanOrEqual(55);
});

test('@claim:five-turn-match a match ends after five simultaneous turns', async ({ browser }, testInfo) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await finishMatch(first, second);
  await expect(first.getByRole('heading', { name: 'You won this five-turn match' })).toBeVisible();
  await expect(first.getByRole('heading', { name: 'You won', exact: true })).toBeVisible();
  await expect(second.getByRole('heading', { name: 'Your friend won this five-turn match' })).toBeVisible();
  await expect(second.getByRole('heading', { name: 'You lost' })).toBeVisible();
  await first.screenshot({ path: testInfo.outputPath('two-client-end-screen.png'), fullPage: true });
  await second.screenshot({ path: testInfo.outputPath('two-client-loser-end-screen.png'), fullPage: true });
  await first.reload();
  await second.reload();
  await expect(first.getByRole('heading', { name: 'You won', exact: true })).toBeVisible();
  await expect(second.getByRole('heading', { name: 'You lost' })).toBeVisible();
  await firstContext.close();
  await secondContext.close();
});

test('@claim:real-match-restart a completed real match returns to a fresh room form', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const roomUrl = await createRoom(first, 'Mira');
  await joinRoom(second, roomUrl, 'Teo');
  await finishMatch(first, second);
  await expect(first.getByRole('heading', { name: 'You won', exact: true })).toBeVisible();

  await first.locator('.game-intro').getByRole('button', { name: 'Create another room' }).click();

  await expect(first).toHaveURL('http://127.0.0.1:5173/');
  await expect(first.getByRole('heading', { name: 'Plan turns against a friend' })).toBeVisible();
  await expect(first.getByRole('heading', { name: 'Create a private room' })).toBeVisible();
  await expect(first.getByLabel('Your name')).toHaveValue('');
  await expect(first.getByText('Board preview')).toBeVisible();
  await firstContext.close();
  await secondContext.close();
});

test('@claim:footer-version the terms page footer identifies the checked-out version', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByText('The current version is shown in the page footer.')).toBeVisible();
  await expect(page.locator('[data-build]')).toHaveText(expectedBuild);
});
