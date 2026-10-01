import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/probes/api-transactions/fixture.html');
  await page.waitForFunction(() => (window as any).ready);
});

for (const operation of ['replaceSelection', 'undo', 'redo']) {
  for (const mutation of ['disabled', 'readOnly', 'disconnect']) {
    test(`token ${operation} rejects listener-time ${mutation} without changing history`, async ({ page }) => {
      const result = await page.evaluate(async ({ operation, mutation }) => {
        const editor: any = document.createElement('en-token-editor');
        document.body.append(editor); await editor.updateComplete;
        editor.value = 'A';
        if (operation !== 'replaceSelection') editor.replaceSelection([{kind:'text',text:'B'}], {anchor:0,focus:1});
        if (operation === 'redo') editor.undo();
        const before = editor.value, revision = editor.revision;
        let events = 0;
        editor.addEventListener('en-change', () => {
          events++;
          if (mutation === 'disconnect') editor.remove(); else editor[mutation] = true;
        }, {once:true});
        const perform = () => operation === 'replaceSelection'
          ? editor.replaceSelection([{kind:'text',text:'C'}], {anchor:0,focus:1}) : editor[operation]();
        const accepted = perform();
        const after = editor.value, afterRevision = editor.revision;
        editor.disabled = false; editor.readOnly = false;
        if (!editor.isConnected) document.body.append(editor);
        await editor.updateComplete;
        const retry = perform();
        return {before, after, revision, afterRevision, accepted, events, retry, final:editor.value};
      }, {operation,mutation});
      expect(result.accepted).toBe(false);
      expect(result.after).toBe(result.before);
      expect(result.afterRevision).toBe(result.revision);
      expect(result.events).toBe(1);
      expect(result.retry).toBe(true);
      expect(result.final).toBe(operation === 'undo' ? 'A' : operation === 'redo' ? 'B' : 'C');
    });
  }
}

for (const outcome of ['veto', 'author-write', 'nested-accepted', 'nested-canceled']) {
  test(`token eligibility preserves ${outcome} authority`, async ({page}) => {
    const result = await page.evaluate(async outcome => {
      const editor: any = document.createElement('en-token-editor');
      document.body.append(editor); await editor.updateComplete; editor.value='A';
      editor.addEventListener('en-change', (event: Event) => {
        if (outcome === 'author-write') editor.value = 'Author';
        if (outcome === 'nested-canceled') editor.addEventListener('en-change', (event:Event) => event.preventDefault(), {once:true});
        if (outcome.startsWith('nested')) editor.replaceSelection([{kind:'text',text:'Nested'}], {anchor:0,focus:1});
        if (outcome !== 'nested-canceled') editor.disabled = true;
        if (outcome === 'veto') event.preventDefault();
      }, {once:true});
      const accepted = editor.replaceSelection([{kind:'text',text:'B'}], {anchor:0,focus:1});
      return {accepted,value:editor.value};
    }, outcome);
    expect(result).toEqual({accepted:outcome==='nested-canceled',value:outcome==='author-write'?'Author':outcome==='nested-accepted'?'Nested':outcome==='nested-canceled'?'B':'A'});
  });
}

for (const tag of ['en-text-field','en-checkbox','en-slider']) {
  for (const mutation of ['disabled','fieldset-disabled','disconnect','author-write']) {
    test(`${tag} public interaction rechecks ${mutation}`, async ({page}) => {
      await page.evaluate(async ({tag,mutation}) => {
        const element:any=document.createElement(tag); element.id='subject'; element.label='Subject';element.name='subject';
        const form=document.createElement('form'), fieldset=document.createElement('fieldset');fieldset.append(element);form.append(fieldset);document.body.append(form);
        const outside=document.createElement('button');outside.id='outside';outside.textContent='Outside';document.body.append(outside);
        await element.updateComplete;
        (window as any).subject=element;(window as any).proposals=[];
        element.addEventListener('en-change',(event:any)=>{
          (window as any).proposals.push({previous:event.detail.previous,proposed:event.detail.proposed});
          if(mutation==='disconnect')element.remove();else if(mutation==='fieldset-disabled')fieldset.disabled=true;else element.disabled=true;
          if(mutation==='author-write'){if(tag==='en-checkbox')element.checked=true;else element.value=tag==='en-slider'?25:'Author';}
        },{once:true});
      },{tag,mutation});
      const host=page.locator('#subject');
      if(tag==='en-checkbox')await host.getByRole('checkbox').click();
      else if(tag==='en-slider')await host.getByRole('slider').press('ArrowRight');
      else {await host.getByRole('textbox').fill('Proposed');await page.locator('#outside').click();}
      const result=await page.evaluate(()=>{const e=(window as any).subject;return {value:e.localName==='en-checkbox'?e.checked:e.value,proposals:(window as any).proposals};});
      expect(result.proposals).toHaveLength(1);
      expect(result.value).toBe(mutation==='author-write'?(tag==='en-checkbox'?true:tag==='en-slider'?25:'Author'):(tag==='en-checkbox'?false:tag==='en-slider'?0:''));
    });
  }
}

test('text-field rejects becoming read-only during a native change',async({page})=>{
  await page.evaluate(async()=>{const e:any=document.createElement('en-text-field');e.id='subject';document.body.append(e);await e.updateComplete;e.addEventListener('en-change',()=>e.readOnly=true);const button=document.createElement('button');button.id='outside';button.textContent='Outside';document.body.append(button);});
  await page.locator('#subject').getByRole('textbox').fill('Proposed');await page.locator('#outside').click();
  await expect(page.locator('#subject')).toHaveJSProperty('value','');
});
