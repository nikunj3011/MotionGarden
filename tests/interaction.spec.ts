import { test, expect } from '@playwright/test';
test('interaction defaults on and persists off across views', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /Touch \+ tilt/ });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/art/flow-field');
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'Enable tilt' })).toBeDisabled();
  await toggle.click();
  await page.getByRole('button', { name: 'Enable tilt' }).click();
  await expect(page.locator('.interaction-controls [role=status]')).toContainText(
    /Waiting|unavailable|declined|could not/,
  );
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});
test('synthetic tilt calibrates without changing the artwork seed', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', {
      configurable: true,
      value: async () => 'granted',
    }),
  );
  await page.goto('/art/flow-field');
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Enable tilt' }).click();
  await expect(page.locator('.interaction-controls [role=status]')).toContainText('Waiting');
  await page.evaluate(() =>
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 30, gamma: 0 })),
  );
  await expect(page.locator('.interaction-controls [role=status]')).toContainText('Tilt ready');
  await page.evaluate(() =>
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 15 })),
  );
  await expect(page.locator('.controls>small')).toContainText('Seed 42');
});

test('mobile main-page drag shapes the current instead of switching artworks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
  const frame = page.frames().find((f) => f.url().includes('/renderer/'))!;
  await frame.evaluate(() => {
    (window as any).__interaction = [];
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'SET_INTERACTION') (window as any).__interaction.push(e.data);
    });
  });
  const box = (await page.locator('.world-stage').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.45, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Quiet currents' })).toBeVisible();
  await expect
    .poll(() =>
      frame.evaluate(() =>
        (window as any).__interaction.some((v: any) => v.enabled && v.pointer.strength === 1),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => frame.evaluate(() => (window as any).__interaction.at(-1)?.pointer.strength))
    .toBe(0);
  await page.screenshot({ path: 'outputs/motiongarden-touch-mobile.png' });
});
