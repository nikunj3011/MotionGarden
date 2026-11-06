import { test, expect } from '@playwright/test';
test('player sheet taps, drags and supports keyboard; main controls stay in place', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await expect(page.locator('.bottom-sheet')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next artwork' })).toBeInViewport();
  await page.getByRole('link', { name: 'Expand artwork', exact: true }).click();
  await expect(page.locator('.player')).toBeVisible();
  const handle = page.locator('.sheet-handle');
  await expect(handle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'New seed', exact: true })).toHaveCount(0);
  await handle.click();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('slider').first()).toBeVisible();
  await expect(page.locator('.bottom-sheet')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  let box = await handle.boundingBox();
  if (!box) throw Error('Missing handle');
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 12 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(() =>
      handle.evaluate(
        (el) => Math.abs(el.getBoundingClientRect().y - (innerHeight - el.offsetHeight)) < 2,
      ),
    )
    .toBe(true);
  box = await handle.boundingBox();
  if (!box) throw Error('Missing handle');
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 200, { steps: 12 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
  await handle.focus();
  await page.keyboard.press('ArrowDown');
  await expect(handle).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowUp');
  await expect(handle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(handle).toHaveAttribute('aria-expanded', 'false');
  await expect(handle).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect
    .poll(() =>
      handle.evaluate(
        (el) => Math.abs(el.getBoundingClientRect().y - (innerHeight - el.offsetHeight)) < 2,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: 'outputs/motiongarden-player-minimized.png' });
  await handle.click();
  await expect(page.locator('.bottom-sheet')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.frameLocator('iframe').locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.screenshot({ path: 'outputs/motiongarden-player-sheet-dark.png' });
  await page.getByRole('button', { name: 'Use white theme' }).click();
  await expect(page.frameLocator('iframe').locator('html')).toHaveCSS('color-scheme', 'light');
  await page.screenshot({ path: 'outputs/motiongarden-player-sheet-white.png' });
});

test('New seed randomizes controls and palette and saved moments restore the full variation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/art/flow-field');
  await page.locator('.sheet-handle').click();
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  const sliders = page.getByRole('slider');
  const before = await sliders.evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value),
  );
  const initialPalette = await page.evaluate(() => localStorage.getItem('mg:palettes:v2'));
  await page.getByRole('button', { name: 'New seed', exact: true }).click();
  const after = await sliders.evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value),
  );
  for (let i = 0; i < before.length; i++) expect(after[i]).not.toBe(before[i]);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('mg:palettes:v2')))
    .not.toBe(initialPalette);
  await expect(page.getByRole('status').filter({ hasText: 'New variation:' })).toBeVisible();
  await page.getByRole('button', { name: 'Save this moment' }).click();
  const savedPalette = await page.evaluate(() => localStorage.getItem('mg:palettes:v2'));
  await page.getByRole('button', { name: 'New seed', exact: true }).click();
  await page.getByRole('button', { name: 'Restore saved preset' }).click();
  expect(
    await sliders.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
  ).toEqual(after);
  expect(await page.evaluate(() => localStorage.getItem('mg:palettes:v2'))).toBe(savedPalette);
});
