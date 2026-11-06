import {test,expect} from '@playwright/test';
test('title frames the larger artwork and colors and themes persist',async({page})=>{
 await page.setViewportSize({width:1440,height:1100});await page.goto('/');await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
 const title=await page.locator('.oversized-type span').first().boundingBox();const canvas=await page.locator('.live-artwork').boundingBox();const bottom=await page.locator('.oversized-type span').last().boundingBox();
 expect(title!.y).toBeGreaterThan(canvas!.y);expect(title!.x).toBeLessThan(canvas!.x+canvas!.width/2);expect(bottom!.x).toBeGreaterThan(canvas!.x+canvas!.width/2);expect(bottom!.y+bottom!.height).toBeLessThanOrEqual(canvas!.y+canvas!.height+1);expect(canvas!.width).toBeGreaterThan(1000);
 await page.getByRole('button',{name:'Colors',exact:true}).click();await expect(page.getByLabel('Artwork colors')).toBeVisible();await page.getByLabel('Color 1',{exact:true}).fill('#ff0000');await page.getByRole('button',{name:'Add color'}).click();await expect(page.locator('input[type=color]')).toHaveCount(4);await page.getByLabel('Color 4',{exact:true}).fill('#00ffff');await page.getByRole('button',{name:'Remove color 2'}).click();await expect(page.locator('input[type=color]')).toHaveCount(3);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Use dark theme'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Use white theme'}).click();await page.getByRole('button',{name:'Colors',exact:true}).click();await expect(page.getByLabel('Color 1',{exact:true})).toHaveValue('#ff0000');await expect(page.getByLabel('Color 3',{exact:true})).toHaveValue('#00ffff');await page.getByRole('button',{name:'Reset colors'}).click();await expect(page.getByLabel('Color 1',{exact:true})).toHaveValue('#edc24b');await page.keyboard.press('Escape');await expect(page.locator('html')).toHaveAttribute('data-theme','white');
});

test('all selected colors reach the rendered Three.js artwork',async({page})=>{
 await page.goto('/art/orbit-sculpture');await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Colors',exact:true}).click();
 for(const [i,color] of ['#ff0000','#00ff00','#0000ff'].entries())await page.getByLabel(`Color ${i+1}`,{exact:true}).fill(color);
 const channels=await page.frameLocator('iframe').locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{const gl=canvas.getContext('webgl2')!;const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const counts=[0,0,0];for(let i=0;i<pixels.length;i+=4){for(let channel=0;channel<3;channel++){if(pixels[i+channel]>80&&pixels[i+channel]>pixels[i+(channel+1)%3]*1.5&&pixels[i+channel]>pixels[i+(channel+2)%3]*1.5)counts[channel]++}}return counts});
 for(const count of channels)expect(count).toBeGreaterThan(20);
});

test('mobile Colors panel fits and captures both themes',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();await page.getByRole('button',{name:'Colors',exact:true}).click();await expect(page.getByRole('button',{name:'Add color'})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:1100});await page.waitForTimeout(1500);await page.screenshot({path:'outputs/motiongarden-white.png',fullPage:true});await page.getByRole('button',{name:'Use dark theme'}).click();await page.getByRole('button',{name:'Colors',exact:true}).click();await page.screenshot({path:'outputs/motiongarden-dark-colors.png',fullPage:true});
});




