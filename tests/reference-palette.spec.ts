import { test, expect } from '@playwright/test';
test('ivory/gold/blue surfaces retain the original text colors and copy in both modes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await expect(page.locator('.oversized-type span').first()).toHaveText('ART & SOUND');
  await expect(page.locator('.oversized-type span').last()).toHaveText('IN MOTION');
  await expect(page.locator('.oversized-type')).toHaveCSS('color', 'rgb(21, 20, 25)');
  await expect(page.locator('.work-description p')).toHaveCSS('color', 'rgb(98, 91, 109)');
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--paper').trim()),
  ).toBe('#f3f0e6');
  await page.screenshot({ path: 'outputs/motiongarden-reference-white.png' });
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.frameLocator('iframe').locator('html')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('.oversized-type')).toHaveCSS('color', 'rgb(233, 227, 241)');
  await expect(page.locator('.work-description p')).toHaveCSS('color', 'rgb(181, 167, 198)');
  expect(
    await page
      .locator('html')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--paper').trim()),
  ).toBe('#101112');
  await page.screenshot({ path: 'outputs/motiongarden-reference-dark.png' });
});
