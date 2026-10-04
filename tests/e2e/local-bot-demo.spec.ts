import { expect, test } from '@playwright/test';

test('local bot demo completes without account or production service requests', async ({ page }) => {
  test.setTimeout(90_000);
  const productionRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/(auth|documents|games|retention|shop)/.test(request.url())) productionRequests.push(request.url());
  });

  await page.goto('/demo/bot', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /play bitty botty/i })).toBeVisible();
  await expect(page.getByText(/no sign-in, database, gemini key/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => typeof (window as any).render_game_to_text), { timeout: 30_000 }).toBe('function');
  await page.getByTestId('demo-tile-c').click();
  await expect(page.getByTestId('demo-status')).toContainText('Building C');
  await page.getByTestId('demo-tile-a').click();
  await expect(page.getByTestId('demo-status')).toContainText('Building CA');
  await page.getByTestId('demo-tile-t').click();
  await expect(page.getByTestId('demo-status')).toContainText('CAT is ready');
  await page.getByRole('button', { name: 'Play CAT' }).click();
  await expect(page.getByTestId('demo-status')).toContainText('Bitty Botty added S');
  await expect(page.getByTestId('demo-player-score')).toHaveText('10');
  await expect(page.getByTestId('demo-bot-score')).toHaveText('6');

  const state = await page.evaluate(() => JSON.parse((window as any).render_game_to_text()));
  expect(state).toMatchObject({ mode: 'local-bot-demo', persistence: 'none', rewards: 'disabled', credentialsRequired: false, phase: 'complete' });
  expect(state.board).toMatchObject({ '7-6': 'C', '7-7': 'A', '7-8': 'T', '7-9': 'S' });
  expect(productionRequests).toEqual([]);

  await page.getByRole('button', { name: /play demo again/i }).click();
  await expect(page.getByTestId('demo-player-score')).toHaveText('0');
  await expect(page.getByTestId('demo-status')).toContainText('Tap C, A, and T');
});

test('sign-in screen clearly exposes the isolated local bot demo', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const demoLink = page.getByRole('link', { name: /play local bot demo/i });
  await expect(demoLink).toBeVisible();
  await expect(page.getByText(/no account, rewards, berries, ai key, or saved progress/i)).toBeVisible();
  await demoLink.click();
  await expect(page).toHaveURL(/\/demo\/bot$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /play bitty botty/i })).toBeVisible({ timeout: 30_000 });
});
