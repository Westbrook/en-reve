import {test,expect} from '@playwright/test';
for (const fallback of [false,true]) {
  test.describe(fallback?'fallback choices':'native-preferred choices',()=>{
    test.beforeEach(async({page,browser},info)=>{
      info.annotations.push({type:'browser-version',description:browser.version()});
      await page.goto('/probes/reference-target/choices-fixture.html'+(fallback?'?fallback':''));
      await expect(page.locator('body')).toHaveAttribute('data-ready','true');
    });
    test('external labels activate one native transaction, preserve cancellation, form values and reset',async({page})=>{
      for (const tag of ['checkbox','switch','radio']) {
        const host=page.locator('#'+tag),input=host.locator('input');
        await page.locator('#label-'+tag).click({position:{x:5,y:5}});
        await expect(input).toBeChecked();await expect(input).toBeFocused();
        expect(await page.evaluate(tag=>(window as any).changes.filter((event:any)=>event.id===tag),tag)).toEqual([expect.objectContaining({previous:false,proposed:true,reason:'toggle',form:expect.arrayContaining([[tag,'yes']])})]);
        await page.locator('#reset').click();await expect(input).not.toBeChecked();
        await host.evaluate(host=>host.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
        await page.locator('#label-'+tag).click({position:{x:5,y:5}});
        await expect(input).not.toBeChecked();
        expect(await page.locator('#choices').evaluate((form,tag)=>new FormData(form as HTMLFormElement).has(tag),tag)).toBe(false);
        await host.evaluate(host=>host.addEventListener('en-change',event=>{(host as any).checked=true;event.preventDefault();},{once:true}));
        await page.locator('#label-'+tag).click({position:{x:5,y:5}});await expect(input).toBeChecked();
        await page.locator('#reset').click();await expect(input).not.toBeChecked();
      }
    });
    test('grouped radio label routes only to its owner and respects group cancellation',async({page})=>{
      await page.locator('#label-second').click();
      await expect(page.locator('#second input')).toBeChecked();await expect(page.locator('#first input')).not.toBeChecked();
      expect(await page.evaluate(()=>(window as any).changes)).toEqual([expect.objectContaining({id:'group',previous:'first',proposed:'second',form:[['format','second']]})]);
      await page.locator('#reset').click();
      await page.locator('#group').evaluate(host=>host.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
      await page.locator('#label-second').click();
      await expect(page.locator('#first input')).toBeChecked();await expect(page.locator('#second input')).not.toBeChecked();
      await expect(page.locator('#second input')).toBeFocused();
    });
    test('disabled fields, canceled label dispatch and interactive descendants never toggle',async({page})=>{
      await page.locator('#label-link').click();await expect(page.locator('#checkbox input')).not.toBeChecked();
      for(const tag of ['checkbox','switch','radio']) {
        await page.locator('#label-'+tag).evaluate(label=>document.body.addEventListener('click',event=>{if(event.composedPath().includes(label))event.preventDefault();},{once:true}));
        await page.locator('#label-'+tag).click({position:{x:5,y:5}});await expect(page.locator('#'+tag+' input')).not.toBeChecked();
      }
      await page.locator('#fieldset').evaluate((fieldset:HTMLFieldSetElement)=>fieldset.disabled=true);
      for(const tag of ['checkbox','switch','radio','second']) {
        const input=page.locator('#'+tag+' input');await expect(input).toBeDisabled();
        await page.locator('#label-'+tag).click({position:{x:5,y:5}});await expect(input).not.toBeChecked();
      }
      expect(await page.evaluate(()=>(window as any).changes)).toEqual([]);
    });
    test('wrapping labels activate once and replacement/removal restores the compact internal name',async({page,browserName})=>{
      for(const tag of ['checkbox','switch','radio']) {
        const host=page.locator('#'+tag),input=host.locator('input');
        await page.locator('#label-'+tag).evaluate((label,tag)=>{label.textContent='Wrapper '+tag;label.removeAttribute('for');label.append(document.getElementById(tag)!);},tag);
        await expect.poll(()=>input.evaluate(node=>Array.from((node as HTMLInputElement).ariaLabelledByElements??[],label=>label.id||label.textContent?.trim()))).toEqual(['label-'+tag,'label-text']);
        if(browserName==='chromium') {
          const session=await page.context().newCDPSession(page);const {nodes}=await session.send('Accessibility.getFullAXTree');
          expect(nodes.filter(node=>!node.ignored&&node.role?.value===tag).map(node=>node.name?.value)).toContain(`Wrapper ${tag} Internal ${tag}`);
          await session.detach();
        }
        await page.locator('#label-'+tag).click({position:{x:3,y:3}});await expect(input).toBeChecked();
        // Allow all native and fallback tasks to settle, then prove no duplicate toggles.
        await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,30)));
        expect(await page.evaluate(tag=>(window as any).changes.filter((event:any)=>event.id===tag).length,tag)).toBe(1);
        await host.evaluate(host=>{const label=host.parentElement!;label.replaceWith(host);});
        await expect(input).toHaveAttribute('aria-labelledby','label-text');
        await expect(input).toHaveAccessibleName('Internal '+tag);
      }
    });
    test('native accessibility names include both external and compact internal choice text',async({page,browserName})=>{
      test.skip(browserName!=='chromium','CDP exposes the Chromium AX tree only.');
      const session=await page.context().newCDPSession(page);const {nodes}=await session.send('Accessibility.getFullAXTree');
      for(const tag of ['checkbox','switch','radio']) expect(nodes.filter(node=>!node.ignored&&node.role?.value===tag).map(node=>node.name?.value)).toContain(tag==='checkbox'?'External checkbox Help Internal checkbox':`External ${tag} Internal ${tag}`);
      await session.detach();
    });
  });
}
