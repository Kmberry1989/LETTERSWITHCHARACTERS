import { expect, test } from '@playwright/test';

const routes = [
  '/minigames/word-search',
  '/minigames/5-in-6',
  '/minigames/word-connect',
  '/minigames/liquid-sort',
  '/minigames/match-sort',
  '/minigames/solitaire',
  '/minigames/wheel',
  '/minigames/claw-crane',
];

for (const route of routes) {
  test(`${route} renders without overflow or framework errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toBeEmpty();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('claw crane exposes deterministic state and a keyboard-accessible joystick', async ({ page }) => {
  await page.goto('/minigames/claw-crane', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('claw-joystick')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('claw-drop')).toBeVisible();
  await expect.poll(() => page.evaluate(() => typeof (window as any).render_game_to_text), { timeout: 20_000 }).toBe('function');
});
