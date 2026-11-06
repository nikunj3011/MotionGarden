import { test, expect } from '@playwright/test';
test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });
test('music panel minimizes, expands and remembers its size without stopping playback', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  const panel = page.locator('.soundtrack-panel');
  await expect(panel).toHaveAttribute('data-size', 'expanded');
  const expanded = (await panel.boundingBox())!.height;
  await page.getByRole('button', { name: 'Minimize music panel', exact: true }).click();
  await expect(panel).toHaveAttribute('data-size', 'minimized');
  expect((await panel.boundingBox())!.height).toBeLessThan(expanded);
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toBeVisible();
  await page.reload();
  await expect(panel).toHaveAttribute('data-size', 'minimized');
  await page.getByRole('button', { name: 'Expand music panel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Vary music', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Minimize music panel', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Expand music panel', exact: true }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await expect(page.locator('.work-description h1')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'outputs/motiongarden-music-minimized-mobile.png' });
  await page.getByRole('button', { name: 'Expand music panel', exact: true }).click();
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'outputs/motiongarden-music-expanded-mobile.png' });
});
test('a direct music-viewer visit autoplays that piece rather than a random background piece', async ({
  page,
}) => {
  await page.goto('/music/tidal-harmonics');
  await expect(page.getByRole('heading', { name: 'Tidal harmonics', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toHaveAttribute(
    'title',
    /Tidal harmonics/,
  );
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
});
test('main music viewer sits above MOTION and has clear reaction and playback controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await expect(page.locator('.inline-music-preview canvas')).toBeVisible();
  const title = await page.locator('.now-playing-caption strong').innerText();
  await expect(page.locator('.inline-music-details>a')).toContainText(title);
  let panel = await page.locator('.inline-music-viewer').boundingBox(),
    motion = await page.locator('.oversized-type span').last().boundingBox();
  expect(panel!.y + panel!.height).toBeLessThan(motion!.y);
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toContainText(
    'Reacts to music',
  );
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Stop music', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mute current music', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unmute current music', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Unmute current music', exact: true }).click();
  await page.getByRole('button', { name: 'Vary music', exact: true }).click();
  await expect(page.locator('.inline-music-details>a')).toContainText(title);
  await page.screenshot({ path: 'outputs/motiongarden-inline-music.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('button', { name: 'Reacts to music', exact: true }).locator('span'),
  ).toBeVisible();
  panel = await page.locator('.inline-music-viewer').boundingBox();
  motion = await page.locator('.oversized-type span').last().boundingBox();
  expect(panel!.x + panel!.width).toBeLessThan(motion!.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'outputs/motiongarden-inline-music-mobile.png' });
  await page.getByRole('link', { name: 'Expand artwork', exact: true }).click();
  await expect(page.locator('.player')).toBeVisible();
  await page.locator('.sheet-handle').click();
  await expect(page.locator('.soundtrack-panel[data-variant=player]')).toBeVisible();
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await expect(page.locator('.player-status')).toHaveCount(0);
  await expect(page.locator('.bottom-sheet')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.screenshot({ path: 'outputs/motiongarden-expanded-music.png' });
  await page.getByRole('link', { name: 'Open music viewer', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
});
