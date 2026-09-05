import { expect, test } from '@playwright/test';
import { createRoom, finishMatch, joinRoom } from './helpers';

test('@claim:demo-never-saves-real the sample does not create or change a real room', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.locator('[data-cell="3-5"]').click();
  await page.getByRole('button', { name: 'Resolve sample turn' }).click();
  await expect(page.getByText('Last resolution:')).toBeVisible();
  expect(requests.some((url) => url.includes(':8787/v1/rooms'))).toBe(false);
});

test('@claim:no-tracking the landing page makes no third-party tracking request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('.map-grid')).toBeVisible();
  expect(requests.every((url) => new URL(url).hostname === '127.0.0.1')).toBe(true);
});

test('@claim:restart-demo resetting the sample starts it again', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('[data-cell="3-5"]').click();
  await page.getByRole('button', { name: 'Resolve sample turn' }).click();
  await expect(page.getByText('Turn 2 of 5')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await expect(page.getByText('Turn 1 of 5')).toBeVisible();
  await expect(page.getByText('Demo reset. No real room was changed.')).toBeAttached();
});

test('@claim:settings-persist settings stay in this browser', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Use still resolution effects').check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByLabel('Use still resolution effects')).toBeChecked();
});

test('@claim:refresh-rejoin reloading reconnects to your saved room', async ({ page }) => {
  const roomUrl = await createRoom(page);
  const code = new URL(roomUrl).searchParams.get('room')!;
  await page.reload();
  await expect(page.getByText(`Room ${code}`).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Share this room link with one friend' })).toBeVisible();
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
  await expect(third.getByText('This room already has two players. Ask your friend for a new room link.')).toBeVisible();
  await firstContext.close();
  await secondContext.close();
  await thirdContext.close();
});

test('@claim:room-expiry new rooms expire after 24 hours', async ({ request }) => {
  const now = Date.now();
  const response = await request.post('http://127.0.0.1:8787/v1/rooms', { data: { name: 'Expiry check' }, headers: { 'X-Forwarded-For': '203.0.113.78' } });
  expect(response.status()).toBe(201);
  const body = await response.json() as { expiresAt: number };
  expect(body.expiresAt - now).toBeGreaterThanOrEqual(86_399_000);
  expect(body.expiresAt - now).toBeLessThanOrEqual(86_401_000);
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
  await first.screenshot({ path: testInfo.outputPath('two-client-end-screen.png'), fullPage: true });
  await firstContext.close();
  await secondContext.close();
});
