import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createRoom, joinRoom } from './helpers';

test('the first screen shows the playable board, job, audience, and first action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plan turns against a friend' })).toBeVisible();
  await expect(page.getByText('For two friends who want a short tactical match without accounts or live timing.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create a room' })).toBeVisible();
  await expect(page.locator('.map-grid')).toBeVisible();
  await expect(page.getByText('Free to play')).toBeVisible();
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
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Roomcode Tactics');
  await expect(page.getByRole('heading', { name: 'Privacy for your room' })).toBeVisible();
  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — Roomcode Tactics');
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'This map link does not exist' })).toBeVisible();
  await expect(page).toHaveTitle('Page not found — Roomcode Tactics');
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
