import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createRoom, joinRoom } from './helpers';

test('the first screen shows the playable board, job, audience, and first action', async ({ page }, testInfo) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { name: 'Plan turns against a friend' });
  const audience = page.getByText('For two friends who want a short tactical match without accounts or live timing.');
  const action = page.getByRole('button', { name: 'Create a room' });
  const board = page.locator('.game-board-panel');
  await expect(heading).toBeInViewport();
  await expect(audience).toBeInViewport();
  await expect(action).toBeInViewport();
  await expect(page.getByText('Free to play')).toBeInViewport();
  expect((await board.boundingBox())?.y).toBeLessThan(page.viewportSize()!.height);
  await expect(page.locator('[data-build]')).toHaveText(/^[0-9a-f]{7,40}$/);
  await page.screenshot({ path: testInfo.outputPath('first-screen.png') });
});

test('the skip link is the first keyboard action and moves focus to the game', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to game' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('a wrong room pass is rejected by the live room service', async ({ browser, request }) => {
  const firstContext = await browser.newContext();
  const first = await firstContext.newPage();
  const firstUrl = await createRoom(first, 'Mira');
  const second = await request.post('http://127.0.0.1:8787/v1/rooms', { data: { name: 'Lina' }, headers: { 'X-Forwarded-For': '203.0.113.90' } });
  expect(second.status()).toBe(201);
  const secondBody = await second.json() as { roomCode: string };
  const saved = await first.evaluate(() => {
    const code = new URL(location.href).searchParams.get('room')!;
    return localStorage.getItem(`rct:room:${code}`)!;
  });
  const token = JSON.parse(saved).token;
  const wrong = await request.get(`http://127.0.0.1:8787/v1/rooms/${secondBody.roomCode}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(wrong.status()).toBe(403);
  expect((await wrong.json()).error.code).toBe('wrong_room');
  expect(new URL(firstUrl).searchParams.get('room')).toBeTruthy();
  await firstContext.close();
});

test('mobile controls are keyboard reachable and have no serious accessibility violations', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).focus();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  await page.locator('[data-cell="3-5"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-cell="3-6"]')).toBeFocused();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || '')).map((violation) => violation.id)).toEqual([]);
});

test('home, legal, and high-contrast screens have one heading and no serious accessibility violations', async ({ page }) => {
  for (const route of ['/', '/privacy', '/terms']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || '')).map((violation) => `${route}:${violation.id}`)).toEqual([]);
  }
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Use high-contrast colors').check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  const highContrast = await new AxeBuilder({ page: page as never }).analyze();
  expect(highContrast.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || '')).map((violation) => `high-contrast:${violation.id}`)).toEqual([]);
});

test('settings dialog traps focus, closes with Escape, and returns focus to its trigger', async ({ page }) => {
  await page.goto('/demo');
  const trigger = page.getByRole('button', { name: 'Settings' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close settings' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('reduced-motion users get an effectively still resolution', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await page.locator('[data-cell="3-5"]').click();
  await page.getByRole('button', { name: 'Resolve sample turn' }).click();
  const durations = await page.locator('.scout').evaluateAll((scouts) => scouts.map((scout) => getComputedStyle(scout).animationDuration));
  expect(durations.every((duration) => Number.parseFloat(duration) <= 0.00001)).toBe(true);
});

test('the room service reports health and enforces request allowances with Retry-After', async ({ request }) => {
  const health = await request.get('http://127.0.0.1:8787/health');
  expect(health.ok()).toBeTruthy();
  let response = health;
  for (let index = 0; index < 45; index += 1) {
    response = await request.post('http://127.0.0.1:8787/v1/rooms', { data: { name: `Rate ${index}` }, headers: { 'X-Forwarded-For': '203.0.113.201' } });
    if (response.status() === 429) break;
  }
  expect(response.status()).toBe(429);
  expect(response.headers()['retry-after']).toMatch(/^[1-9]\d*$/);
});

test('privacy, terms, and a designed 404 route have their own titles', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Roomcode Tactics — Plan turns with a friend');
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Roomcode Tactics');
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Roomcode Tactics');
  await expect(page.getByRole('heading', { name: 'Privacy for your room' })).toBeVisible();
  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — Roomcode Tactics');
  const response = await page.goto('/qa-missing-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page).toHaveTitle('Page not found — Roomcode Tactics');
  const explicit = await page.goto('/404.html');
  expect(explicit?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('client navigation focuses each route heading and restores focus on Back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page).toHaveTitle('Privacy — Roomcode Tactics');
  await expect(page.getByRole('heading', { name: 'Privacy for your room' })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Plan turns against a friend' })).toBeFocused();
});

test('phone controls have 44 pixel targets and every app route reflows at 200 percent text size', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/demo');
  const targets = page.locator('.site-header a, .site-header button, button.map-cell:not(:disabled), .demo-banner button');
  for (let index = 0; index < await targets.count(); index += 1) {
    const box = await targets.nth(index).boundingBox();
    const label = await targets.nth(index).getAttribute('aria-label') || await targets.nth(index).textContent();
    expect(box?.width, `${label} width`).toBeGreaterThanOrEqual(44);
    expect(box?.height, `${label} height`).toBeGreaterThanOrEqual(44);
  }
  for (const route of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(route);
    await page.addStyleTag({ content: ':root { font-size: 200% !important; }' });
    await expect.poll(() => page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))).toEqual({ scroll: 390, client: 390 });
  }
  await context.close();
});

test('a failed room request shows visible recovery text and keeps the entered name', async ({ page }) => {
  await page.route('http://localhost:8787/v1/rooms', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.getByLabel('Your name').fill('Mira');
  await page.getByRole('button', { name: 'Create room' }).click();
  const error = page.locator('.notice-error');
  await expect(error).toHaveText('The room service could not be reached. Check your connection, then try again.');
  await expect(error).toBeInViewport();
  await expect(error).toBeFocused();
  await expect(page.getByLabel('Your name')).toHaveValue('Mira');
});

test('an invalid room and offline state show visible recovery actions', async ({ page, context }) => {
  await page.goto('/?room=ABC222');
  await page.getByLabel('Your name').fill('Mira');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.locator('.notice-error')).toHaveText('That room code does not exist. Check the link and try again.');
  await expect(page.getByLabel('Your name')).toHaveValue('Mira');
  await context.setOffline(true);
  await expect(page.getByText('You are offline. Reconnect before submitting a move.')).toBeVisible();
  await context.setOffline(false);
});

test('all public app links resolve and loading emits no browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const paths = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute('href')!))]);
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
  expect(errors).toEqual([]);
});

test('copying a room link shows a visible result', async ({ page }) => {
  await createRoom(page, 'Mira');
  await page.getByRole('button', { name: 'Copy room link' }).click();
  const result = page.locator('.notice');
  await expect(result).toContainText(/Room link copied|browser address bar/);
  await expect(result).toBeVisible();
});

test('a second independent client can join after refresh', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  const roomUrl = await createRoom(first, 'Mira');
  await first.reload();
  await joinRoom(second, roomUrl, 'Teo');
  await first.getByRole('button', { name: 'Check room' }).click();
  await expect(first.getByRole('heading', { name: 'Choose your move for this turn' })).toBeVisible();
  await firstContext.close();
  await secondContext.close();
});
