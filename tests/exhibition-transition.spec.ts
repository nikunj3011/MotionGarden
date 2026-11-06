import {test,expect} from '@playwright/test';
test('dark page and transparent renderer use the same browser color scheme',async({page})=>{
 await page.goto('/');await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
 await page.getByRole('button',{name:'Use dark theme'}).click();
 await expect(page.frameLocator('iframe').locator('html')).toHaveCSS('color-scheme','dark');
 await expect(page.frameLocator('iframe').locator('body')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 const intro=await page.locator('.exhibition-topline').boundingBox();const title=await page.locator('.oversized-type span').first().boundingBox();const bottom=await page.locator('.oversized-type span').last().boundingBox();
 expect(title!.y).toBeGreaterThan(intro!.y+intro!.height);expect(title!.x).toBeLessThan(100);expect(bottom!.y).toBeGreaterThan(title!.y+title!.height);
 await page.waitForTimeout(500);await page.screenshot({path:'outputs/motiongarden-dark-fixed.png'});
 await page.getByRole('button',{name:'Use white theme'}).click();await expect(page.frameLocator('iframe').locator('html')).toHaveCSS('color-scheme','light');
});
test('uses only actual artwork frames and waits for the next renderer before revealing',async({page})=>{
 await page.goto('/');await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
 await expect(page.locator('.page-artwork img')).toHaveCount(0);
 // Deliberately slow the next package: keep the captured current canvas until READY.
 await page.route('**/artworks/orbit-sculpture/v1/sketch.js',async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.continue()});
 await page.getByRole('button',{name:'Next artwork'}).click();await expect(page.locator('.explore-page')).toHaveClass(/transition-loading/);
 const snapshot=page.locator('.transition-snapshot');expect(await snapshot.evaluate((canvas:HTMLCanvasElement)=>canvas.width)).toBeGreaterThan(300);
 await expect(page.locator('iframe')).toHaveCount(1);await expect(page.locator('.live-artwork')).toHaveCSS('visibility','hidden');
 await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/,{timeout:15000});await expect(page.getByRole('heading',{name:'Orbital bloom'})).toBeVisible();await expect(page.locator('.page-artwork img')).toHaveCount(0);
 await page.screenshot({path:'outputs/motiongarden-futuristic.png'});
});
for(const id of ['flow-field','orbit-sculpture'])test(`${id} is transparent only in the main page`,async({page})=>{
 await page.goto('/');if(id==='orbit-sculpture')await page.getByRole('button',{name:'Sculptural',exact:true}).click();await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);
 const alpha=()=>page.frameLocator('iframe').locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{const ctx=canvas.getContext('2d');if(ctx)return ctx.getImageData(0,0,1,1).data[3];const gl=canvas.getContext('webgl2')!;const rgba=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return rgba[3]});
 await expect.poll(alpha).toBeLessThan(20);await expect(page.locator('.page-artwork')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await page.getByRole('link',{name:'Expand artwork',exact:true}).click();await expect(page.locator('.player')).toBeVisible();await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();await expect.poll(alpha).toBe(255);
});

