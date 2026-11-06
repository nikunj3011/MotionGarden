import {test,expect} from '@playwright/test';
test('exhibition fits the current window on desktop, portrait and landscape',async({page})=>{
 await page.goto('/');await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();
 for(const viewport of [{width:1440,height:900},{width:1280,height:640},{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  await expect.poll(()=>page.evaluate(()=>({horizontal:document.documentElement.scrollWidth<=innerWidth,vertical:document.documentElement.scrollHeight<=innerHeight+1}))).toEqual({horizontal:true,vertical:true});
  await expect(page.getByRole('link',{name:'Enter this world'})).toBeInViewport();await expect(page.getByRole('button',{name:'Next artwork'})).toBeInViewport();
  const box=await page.locator('.world-stage').boundingBox();expect(box!.height).toBeGreaterThan(100);
 }
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(1200);await page.screenshot({path:'outputs/motiongarden-window-fit.png'});
});
for(const id of ['flow-field','orbit-sculpture']){
 test(`${id} changes actual canvas background in main and expanded views`,async({page})=>{
  await page.goto('/');if(id==='orbit-sculpture')await page.getByRole('button',{name:'Sculptural',exact:true}).click();
  const brightness=()=>page.frameLocator('iframe').locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{let values:Uint8Array|Uint8ClampedArray;const context=canvas.getContext('2d');if(context){values=context.getImageData(0,0,1,1).data}else{const gl=canvas.getContext('webgl2')!;values=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,values)}return (values[0]+values[1]+values[2])/3});
  await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();await expect.poll(brightness).toBeLessThan(50);
  await page.getByRole('button',{name:'Use dark theme'}).click();await expect.poll(brightness).toBeLessThan(50);
  await page.getByRole('button',{name:'Colors',exact:true}).click();await expect(page.getByLabel('Color 1',{exact:true})).toHaveValue('#edc24b');await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Expand artwork',exact:true}).click();await expect(page.locator('.player')).toBeVisible();await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible();await expect.poll(brightness).toBeLessThan(50);
  await page.getByRole('button',{name:'Use white theme'}).click();await expect.poll(brightness).toBeGreaterThan(200);
  await page.getByRole('button',{name:'Colors',exact:true}).click();await expect(page.getByLabel('Color 1',{exact:true})).toHaveValue('#edc24b');
 });
}




