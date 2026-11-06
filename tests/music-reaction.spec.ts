import { test, expect } from '@playwright/test';
test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } });
test('default-on audio reaction follows live music, toggles independently and persists across views', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__reaction = [];
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SET_AUDIO') {
        const list = (window as any).__reaction;
        list.push(event.data.bands);
        if (list.length > 100) list.shift();
      }
    });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  const latest = () =>
    page
      .frameLocator('iframe')
      .locator('body')
      .evaluate(() => (window as any).__reaction.at(-1) || { bass: 0, mid: 0, treble: 0 });
  await expect
    .poll(async () => {
      const bands = await latest();
      return bands.bass + bands.mid + bands.treble;
    })
    .toBeGreaterThan(0.01);
  await page.getByRole('button', { name: 'Reacts to music', exact: true }).click();
  await expect.poll(latest).toEqual({ bass: 0, mid: 0, treble: 0 });
  await expect(page.getByRole('button', { name: 'Mute sound', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('link', { name: 'Expand artwork', exact: true }).click();
  await expect(page.locator('.player')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reacts to music', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const before = await page
    .getByRole('slider')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
  await page.getByRole('button', { name: 'Reacts to music', exact: true }).click();
  await expect
    .poll(async () => {
      const bands = await latest();
      return bands.bass + bands.mid + bands.treble;
    })
    .toBeGreaterThan(0.01);
  expect(
    await page
      .getByRole('slider')
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
  ).toEqual(before);
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
  await expect.poll(latest).toEqual({ bass: 0, mid: 0, treble: 0 });
  await page.getByRole('button', { name: 'Unmute sound', exact: true }).click();
  await expect
    .poll(async () => {
      const bands = await latest();
      return bands.bass + bands.mid + bands.treble;
    })
    .toBeGreaterThan(0.01);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(latest).toEqual({ bass: 0, mid: 0, treble: 0 });
});
