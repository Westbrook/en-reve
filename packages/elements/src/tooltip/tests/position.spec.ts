import { expect, test, type Page } from '@playwright/test';

const fixture = '/packages/elements/src/tooltip/tests/fixture.html';
async function setup(page: Page, fallback = false) {
  if (fallback) await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = ((...args: string[]) => args.some(arg => arg.includes('anchor(')) ? false : args.length === 1 ? supports(args[0]) : supports(args[0], args[1])) as typeof CSS.supports;
  });
  await page.goto(fixture);
  await page.evaluate(async () => {
    await customElements.whenDefined('en-tooltip');
    document.body.innerHTML = `<style>body{margin:0;min-height:1600px}button{width:100px;height:44px}#trigger{position:absolute;left:450px;top:300px}en-tooltip{--en-space-2:8px;--en-duration-enter:0ms;--en-duration-exit:0ms}</style><button id="trigger">Help</button><en-tooltip id="tip" for="trigger" hide-delay="100000"><span slot="content">A useful piece of help.</span></en-tooltip>`;
    const tip = document.querySelector<any>('#tip'); await tip.updateComplete; tip.open = true; await tip.updateComplete;
  });
}
async function geometry(page: Page) {
  return page.evaluate(() => {
    const tip = document.querySelector<any>('#tip');
    const surface = tip.shadowRoot.querySelector('[part="surface"]') as HTMLElement;
    const trigger = document.querySelector('#trigger')!;
    const rect = (el: Element) => {const r = el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    return {surface:rect(surface),trigger:rect(trigger),native:!!tip.getAttribute('data-en-tooltip-position')};
  });
}
async function set(page: Page, inline: string, block: string, dir = 'ltr', writingMode = 'horizontal-tb') {
  await page.evaluate(async ({inline,block,dir,writingMode}) => {
    const trigger = document.querySelector<HTMLElement>('#trigger')!;
    trigger.dir = dir; trigger.style.writingMode = writingMode;
    const tip = document.querySelector<any>('#tip'); tip.inline=inline;tip.block=block;tip.requestUpdate();await tip.updateComplete;
  }, {inline,block,dir,writingMode});
}

for (const fallback of [false,true]) {
  test.describe(fallback ? 'measured' : 'native anchors', () => {
    test.beforeEach(async ({page}) => {await setup(page,fallback);});
    test('all logical regions, RTL and vertical writing', async ({page}) => {
      for (const writingMode of ['horizontal-tb','vertical-rl','vertical-lr']) for (const dir of ['ltr','rtl']) {
        for (const inline of ['start','center','end']) for (const block of ['start','center','end']) {
          await set(page,inline,block,dir,writingMode);
          const {surface:s,trigger:t,native} = await geometry(page);
          expect(native).toBe(!fallback);
          let i=inline==='start'?-1:inline==='end'?1:0;
          let b=block==='start'?-1:block==='end'?1:0;
          if(!i&&!b)b=1;if(dir==='rtl')i*=-1;
          const x=writingMode==='horizontal-tb'?i:b*(writingMode==='vertical-rl'?-1:1);
          const y=writingMode==='horizontal-tb'?b:i;
          const expectedX=x<0?t.left-s.width-8:x>0?t.right+8:t.left+(t.width-s.width)/2;
          const expectedY=y<0?t.top-s.height-8:y>0?t.bottom+8:t.top+(t.height-s.height)/2;
          expect(Math.abs(s.left-expectedX)).toBeLessThan(1);
          expect(Math.abs(s.top-expectedY)).toBeLessThan(1);
        }
      }
    });
    test('flips at edges, clamps centered help, follows scrolling and resizing', async ({page}) => {
      await set(page,'end','center');
      await page.evaluate(()=>{document.querySelector<HTMLElement>('#trigger')!.style.left='980px';window.dispatchEvent(new Event('resize'));});
      await expect.poll(async()=>{const {surface:s,trigger:t}=await geometry(page);return Math.abs(s.right-(t.left-8))<1;}).toBe(true);
      await page.setViewportSize({width:400,height:400});
      await page.evaluate(()=>{const el=document.querySelector<HTMLElement>('#trigger')!;el.style.left='5px';el.style.top='340px';});
      await set(page,'center','end');
      let g=await geometry(page);expect(g.surface.left).toBe(8);expect(Math.abs(g.surface.bottom-(g.trigger.top-8))).toBeLessThan(1);
      await page.evaluate(()=>{document.querySelector<HTMLElement>('#trigger')!.style.top='600px';window.scrollTo(0,450);});
      await expect.poll(async()=>{const {surface:s,trigger:t}=await geometry(page);return Math.abs(s.top-(t.bottom+8))<1;}).toBe(true);
      await page.locator('#tip [slot="content"]').evaluate(el=>{el.textContent='Much longer content that wraps across several lines in this narrow viewport and remains inside its edges.';});
      await expect.poll(async()=>{const {surface:s}=await geometry(page);return s.left>=8&&s.right<=392&&s.bottom<=392;}).toBe(true);
    });
    test('opens after scroll, follows nested scrolling and scaled component triggers', async ({page}) => {
      await page.evaluate(async () => {
        const tip=document.querySelector<any>('#tip');tip.open=false;await tip.updateComplete;
        const old=document.querySelector('#trigger')!;old.remove();
        const frame=document.createElement('div');frame.id='scroll-frame';frame.style.cssText='position:absolute;left:200px;top:600px;width:500px;height:300px;overflow:auto;';
        frame.innerHTML='<div style="height:900px;padding-top:180px"><en-button id="trigger" style="position:static;display:inline-block;margin-left:180px;zoom:1.25">Scaled help</en-button></div>';
        document.body.append(frame);window.scrollTo(0,500);await customElements.whenDefined('en-button');
        await document.querySelector<any>('#trigger').updateComplete;tip.open=true;await tip.updateComplete;
      });
      await expect.poll(async()=>{const {surface:s,trigger:t}=await geometry(page);return Math.abs(s.top-t.bottom-8)<1;}).toBe(true);
      await page.evaluate(()=>document.querySelector('#scroll-frame')!.scrollTop=100);
      await expect.poll(async()=>{const {surface:s,trigger:t}=await geometry(page);return Math.abs(s.top-t.bottom-8)<1;}).toBe(true);
      const g=await geometry(page);expect(g.native).toBe(!fallback);
      expect(Math.abs(g.surface.left+g.surface.width/2-g.trigger.left-g.trigger.width/2)).toBeLessThan(1);
    });
    test('unresolvable anchor scope uses measured geometry and preserves author changes', async ({page}) => {
      await page.evaluate(async () => {
        const tip=document.querySelector<any>('#tip');tip.open=false;await tip.updateComplete;
        const wrapper=document.createElement('div');wrapper.style.setProperty('anchor-scope','all');
        const trigger=document.querySelector<HTMLElement>('#trigger')!;trigger.before(wrapper);wrapper.append(trigger);
        trigger.style.setProperty('anchor-name','--authored');tip.open=true;await tip.updateComplete;
      });
      const g=await geometry(page);
      expect(Math.abs(g.surface.top-g.trigger.bottom-8)).toBeLessThan(1);
      expect(g.native).toBe(false);
      await page.evaluate(async()=>{const trigger=document.querySelector<HTMLElement>('#trigger')!;trigger.style.setProperty('anchor-name','--application-new');const tip=document.querySelector<any>('#tip');tip.open=false;await tip.updateComplete;});
      expect(await page.locator('#trigger').evaluate(el=>(el as HTMLElement).style.getPropertyValue('anchor-name'))).toBe('--application-new');
    });
    test('live defaults/invalid values, cancellation and focus remain unchanged', async ({page}) => {
      await set(page,'invalid','invalid');
      const g=await geometry(page);expect(Math.abs(g.surface.left-(g.trigger.left+(g.trigger.width-g.surface.width)/2))).toBeLessThan(1);
      expect(Math.abs(g.surface.top-(g.trigger.bottom+8))).toBeLessThan(1);
      await page.locator('#trigger').focus();
      await page.evaluate(()=>document.querySelector('#tip')!.addEventListener('en-change',e=>e.preventDefault(),{once:true}));
      await page.keyboard.press('Escape');await expect(page.locator('#tip')).toHaveJSProperty('open',true);
      await page.keyboard.press('Escape');await expect(page.locator('#tip')).toHaveJSProperty('open',false);
      await expect(page.locator('#trigger')).toBeFocused();
      await expect(page.locator('#trigger')).toHaveAttribute('aria-describedby',/\S+/);
      expect(await page.locator('style[data-en-tooltip-anchor]').count()).toBe(0);
      expect(await page.locator('#trigger').evaluate(el=>(el as HTMLElement).style.getPropertyValue('anchor-name'))).toBe('');
    });
    test('same-root shadow triggers, rebinding, shared names and teardown', async ({page}) => {
      const result = await page.evaluate(async () => {
        const original=document.querySelector<any>('#tip');original.open=false;await original.updateComplete;
        const host=document.createElement('div');document.body.append(host);const root=host.attachShadow({mode:'open'});
        root.innerHTML=`<style>button{position:absolute;left:450px;top:300px;width:100px;height:44px}</style><button id="trigger" style="anchor-name:--author">Shadow</button><button id="replacement" style="left:650px">Other</button><en-tooltip id="a" for="trigger" block="start" hide-delay="100000"><span slot="content">Above</span></en-tooltip><en-tooltip id="b" for="trigger" hide-delay="100000"><span slot="content">Below</span></en-tooltip>`;
        const a=root.querySelector<any>('#a'),b=root.querySelector<any>('#b'),trigger=root.querySelector<HTMLElement>('#trigger')!;
        await Promise.all([a.updateComplete,b.updateComplete]);a.open=b.open=true;await Promise.all([a.updateComplete,b.updateComplete]);
        const rect=(el:any)=>el.shadowRoot.querySelector('[popover]').getBoundingClientRect();
        const valid=rect(a).bottom<trigger.getBoundingClientRect().top&&rect(b).top>trigger.getBoundingClientRect().bottom;
        const native=!!a.getAttribute('data-en-tooltip-position')&&!!b.getAttribute('data-en-tooltip-position');
        a.remove();const otherRetained=rect(b).top>trigger.getBoundingClientRect().bottom;
        b.for='replacement';await b.updateComplete;
        const moved=Math.abs(rect(b).left+rect(b).width/2-700)<1;
        const restored=trigger.style.getPropertyValue('anchor-name');
        b.remove();return {valid,native,otherRetained,moved,restored,rules:root.querySelectorAll('style[data-en-tooltip-anchor]').length};
      });
      expect(result).toEqual({valid:true,native:!fallback,otherRetained:true,moved:true,restored:'--author',rules:0});
    });
  });
}
