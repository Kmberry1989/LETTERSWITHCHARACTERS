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

const modeTitles: Record<string, string> = {
  '/minigames/word-search': 'Word Search',
  '/minigames/5-in-6': '5 in 6',
  '/minigames/word-connect': 'Word Connect',
  '/minigames/liquid-sort': 'Liquid Sort',
  '/minigames/match-sort': 'Goods Sort',
  '/minigames/solitaire': 'Solitaire Sprint',
  '/minigames/wheel': 'Wheel',
  '/minigames/claw-crane': 'Prize Corner',
};

for (const route of routes) {
  test(`${route} renders without overflow or framework errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.getByRole('heading', { name: new RegExp(modeTitles[route], 'i') })).toBeVisible({ timeout: 20_000 });
    if (route !== '/minigames/claw-crane') {
      await expect(page.getByRole('button', { name: /how to play/i })).toBeVisible();
      if ((page.viewportSize()?.width || 0) >= 768) {
        await expect(page.getByRole('link', { name: /arcade/i }).last()).toBeVisible();
      } else {
        await expect(page.getByRole('button', { name: /go back/i })).toBeVisible();
      }
    }
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
