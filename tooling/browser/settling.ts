import {expect,type Page,type Locator} from '@playwright/test';
export async function frames(page:Page,count=2){await page.evaluate(async count=>{for(let i=0;i<count;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));},count);}
/** Wait for stable measured geometry before trusted pointer input; no arbitrary timer. */
export async function placed(locator:Locator){
 await expect(locator).toBeVisible();
 await expect.poll(()=>locator.evaluate(async element=>{
  const read=()=>{const r=element.getBoundingClientRect();return[r.x,r.y,r.width,r.height];};const a=read();
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  const b=read();return b[2]>0&&b[3]>0&&a.every((n,i)=>Math.abs(n-b[i]!)<0.5);
 })).toBe(true);
}
