import { expect, Page } from '@playwright/test';

export async function createRoom(page: Page, name = 'Mira'): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page.getByRole('heading', { name: 'Share this room link with one friend' })).toBeVisible();
  return page.url();
}

export async function joinRoom(page: Page, roomUrl: string, name = 'Teo'): Promise<void> {
  await page.goto(roomUrl);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('heading', { name: 'Choose your move for this turn' })).toBeVisible();
}

export async function finishMatch(first: Page, second: Page): Promise<void> {
  await first.getByRole('button', { name: 'Check room' }).click();
  await expect(first.getByRole('heading', { name: 'Choose your move for this turn' })).toBeVisible();
  const moves = ['3-5', '3-4', '3-3', '2-3', '1-3'];
  for (const move of moves) {
    await first.locator(`[data-cell="${move}"]`).click();
    await first.getByRole('button', { name: 'Submit move' }).click();
    await expect(first.getByRole('heading', { name: 'Your move is locked' })).toBeVisible();
    await second.locator('[data-cell="3-0"]').click();
    await second.getByRole('button', { name: 'Submit move' }).click();
    await first.getByRole('button', { name: 'Refresh room' }).click();
  }
}
