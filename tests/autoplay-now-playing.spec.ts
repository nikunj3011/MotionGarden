import {test,expect} from '@playwright/test';
test.use({launchOptions:{args:['--autoplay-policy=no-user-gesture-required']}});
test.describe('when the browser permits autoplay',()=>{
 test('autostarts on load/refresh and keeps the selected music playing when its viewer opens',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Mute sound',exact:true})).toBeVisible();
  await expect(page.locator('.now-playing')).toHaveClass(/is-playing/);await expect(page.locator('.now-playing-caption small')).toHaveText('NOW PLAYING');
  await page.reload();await expect(page.getByRole('button',{name:'Mute sound',exact:true})).toBeVisible();
  const caption=page.locator('.now-playing-caption strong'),previous=await caption.innerText();await page.getByRole('button',{name:'Shuffle music',exact:true}).click();await expect(caption).not.toHaveText(previous);const next=await caption.innerText();
  const motion=await page.locator('.oversized-type span').last().boundingBox();const visualizer=await page.locator('.soundtrack-spectrum').boundingBox();expect(visualizer!.y+visualizer!.height).toBeLessThan(motion!.y);expect(visualizer!.height).toBeLessThan(motion!.height*.5);
  await expect(page.locator('.explore-page')).toHaveClass(/transition-idle/);await expect(page.locator('.work-description h1')).toHaveCSS('opacity','1');await page.screenshot({path:'outputs/motiongarden-now-playing.png'});
  await page.getByRole('link',{name:`Open current music: ${next}`,exact:true}).click();await expect(page.getByRole('heading',{name:next,exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Mute sound',exact:true})).toBeVisible();
 });
});
test('blocked autoplay is honest and recovers on interaction; surprise artwork works in both views',async({page})=>{
 await page.addInitScript(()=>{const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(){super();void this.suspend()}async resume(){if(!navigator.userActivation.isActive)return new Promise<void>(()=>{});await super.resume()}}});
 await page.goto('/');await expect(page.getByRole('button',{name:'Enable generative sound',exact:true})).toBeVisible();await expect(page.locator('.now-playing-caption small')).toHaveText('READY TO LISTEN');await page.getByRole('button',{name:'Enable generative sound',exact:true}).click();await expect(page.locator('.now-playing')).toHaveClass(/is-playing/);
 await page.getByRole('button',{name:'Discover a work'}).click();await expect(page.getByRole('heading',{name:'Orbital bloom'})).toBeVisible();await page.getByRole('link',{name:'Expand artwork',exact:true}).click();await expect(page.locator('.player')).toBeVisible();await page.getByRole('button',{name:'Surprise me — another artwork',exact:true}).click();await expect(page).toHaveURL(/\/art\/flow-field$/);await expect(page.locator('.controls h1')).toHaveText('Quiet currents');
});




