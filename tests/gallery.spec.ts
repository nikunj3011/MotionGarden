import { test, expect } from '@playwright/test';

test('rotates one live preview, filters, saves, and opens the player', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Next artwork' }).click();
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('.departing')).toHaveCount(0);
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await page.getByRole('region', { name: 'Rotating artwork gallery' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await page.getByRole('button', { name: 'Save Quiet currents' }).click();
  await expect(page.getByRole('button', { name: 'Save Quiet currents' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Sculptural', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next artwork' })).toBeDisabled();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await page.getByRole('link', { name: 'Enter this world' }).click();
  await expect(page.locator('.player')).toBeVisible();
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('slider').first().fill('2');
  await page.getByRole('button', { name: 'Save this moment' }).click();
  await expect(page.getByText('Preset saved on this device.')).toBeVisible();
});

test('Works index searches names and metadata and preserves favorites', async ({ page }) => {
  await page.goto('/works');
  await expect(page.locator('.index-row')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Search artworks' }).fill('three');
  await expect(page.locator('.index-row')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
  await page.getByRole('button', { name: 'Save Orbital bloom' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.locator('.index-row')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search artworks' }).fill('no match');
  await expect(page.getByText('No works found. Try another search or filter.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search artworks' }).fill('');
  await page.getByRole('combobox', { name: 'Sort artworks' }).selectOption('category');
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
});

test('wheel navigation and mobile swipe work without overflow', async ({ page }) => {
  await page.goto('/');
  const stage = page.getByRole('region', { name: 'Rotating artwork gallery' });
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  await stage.hover();
  await page.mouse.wheel(0, 180);
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await page.getByRole('button', { name: /Touch \+ tilt/ }).click();
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  const box = await stage.boundingBox();
  if (!box) throw Error('Missing stage');
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Orbital bloom' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Enter this world' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Enter this world' })).toBeInViewport();
  await page.getByRole('link', { name: /Works/ }).first().click();
  await expect(page.locator('.index-row')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('captures the React exhibition and Works index', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'outputs/motiongarden-explore.png', fullPage: true });
  await page.goto('/works');
  await expect(page.locator('.index-row')).toHaveCount(2);
  await page.screenshot({ path: 'outputs/motiongarden-works.png', fullPage: true });
});
