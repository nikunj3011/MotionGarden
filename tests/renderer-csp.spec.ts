import { test, expect } from '@playwright/test';

for (const id of ['flow-field', 'orbit-sculpture']) {
  test(`${id} renders without unsafe-eval or CSP violations`, async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__cspViolations = [];
      (window as any).__rendererMessages = [];
      Object.defineProperty(window, 'webkit', {
        value: {
          messageHandlers: {
            motiongarden: {
              postMessage: (message: unknown) => (window as any).__rendererMessages.push(message),
            },
          },
        },
      });
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as any).__cspViolations.push({
          directive: event.effectiveDirective,
          blocked: event.blockedURI,
        });
      });
    });
    await page.goto(`/renderer/v1/index.html?id=${id}`);
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain('unsafe-eval');
    await expect
      .poll(() => page.evaluate(() => (window as any).__rendererMessages), { timeout: 15000 })
      .toEqual(expect.arrayContaining([expect.objectContaining({ type: 'READY' })]));
    await expect(page.locator('canvas')).toBeVisible();
    // Allow p5Ready and animation frames to run, including the development reader's trigger.
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as any).__cspViolations)).toEqual([]);
  });
}
