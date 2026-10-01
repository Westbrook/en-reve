import { expect, test } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/packages/styles/tests/action-leaves/fixture.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
});

for (const preference of ['ordinary','forced-colors','reduced-motion'] as const) {
  test(`action leaves preserve aggregate paint, geometry and native states: ${preference}`, async ({page}) => {
    await page.emulateMedia({forcedColors:preference === 'forced-colors' ? 'active':'none', reducedMotion:preference === 'reduced-motion' ? 'reduce':'no-preference'});
    const mismatches = await page.evaluate(async () => {
      const cases = [
        ...['primary','secondary','ghost','danger'].flatMap(variant => ['small','medium','large'].map(size => ({variant,size}))),
        {iconOnly:true}, {iconOnly:true,loading:true}, {loading:true}, {disabled:true},
        {size:'inherit',parentSize:'large'},
        {part:true},
      ];
      const properties = ['color','background-color','border-color','border-width','border-radius','padding','min-width','min-height','font','gap','outline','outline-offset','box-shadow','transition-property','transition-duration','transition-timing-function'];
      const results: unknown[] = [];
      for (const [index,state] of cases.entries()) {
        const parent = document.createElement('div');
        parent.className = 'en-foundation';
        // Both samples occupy the same origin. Firefox DOMRect width arithmetic
        // can differ at different inline positions even for identical layout.
        parent.style.cssText = 'display:grid;justify-items:start;align-items:start';
        if ('parentSize' in state && typeof state.parentSize === 'string') parent.dataset.size = state.parentSize;
        const hosts = ['en-button','en-aggregate-button-probe'].map(tag => {
          const element = document.createElement(tag) as any;
          Object.assign(element,state);
          const label = document.createElement('span'); label.slot='label'; label.textContent='Compose message';
          const icon = document.createElement('span'); icon.slot='prefix'; icon.textContent='+'; icon.setAttribute('aria-hidden','true');
          element.append(label,icon);
          if ('part' in state) {
            element.style.cssText='--en-button-background:rgb(20 50 90);--en-button-inline-padding:1.25rem;--en-button-focus-width:3px;--en-button-focus-offset:1px';
          }
          element.style.gridArea = '1 / 1';
          parent.append(element);return element;
        });
        document.querySelector('#fixture')!.append(parent);
        await Promise.all(hosts.map(host=>host.updateComplete));
        if ('part' in state) for (const host of hosts) {
          const sheet = document.createElement('style');
          sheet.textContent='[part="control"] { --en-button-inline-padding:1.5rem; --en-border-width:2px; --en-font-input-line-height:1.7; }';
          host.shadowRoot.append(sheet);
        }
        const sample = (host: any) => {
          const button = host.shadowRoot.querySelector('button') as HTMLButtonElement;
          const style = getComputedStyle(button), box = button.getBoundingClientRect();
          return {paint:Object.fromEntries(properties.map(p=>[p,style.getPropertyValue(p)])),origin:[box.x,box.y],width:box.width,height:box.height,disabled:button.disabled,busy:button.getAttribute('aria-busy'),label:getComputedStyle(host.shadowRoot.querySelector('[part="label"]')).position,indicator:host.shadowRoot.querySelectorAll('[part="indicator"]').length};
        };
        const first=sample(hosts[0]), second=sample(hosts[1]);
        if (JSON.stringify(first)!==JSON.stringify(second)) results.push({index,state,leaf:first,aggregate:second});
        parent.remove();
      }
      for (const disabled of [false,true]) {
        const anchors = [];
        for (const tag of ['en-link','en-aggregate-link-probe']) {
          const host = document.createElement(tag) as any;
          host.href='#destination';host.textContent='Project details';
          document.querySelector('#fixture')!.append(host);await host.updateComplete;
          const anchor=host.shadowRoot.querySelector('a');
          if(disabled) anchor.setAttribute('aria-disabled','true');
          const style=getComputedStyle(anchor),box=anchor.getBoundingClientRect();
          anchors.push({paint:Object.fromEntries(properties.map(p=>[p,style.getPropertyValue(p)])),width:box.width,height:box.height});
          host.remove();
        }
        if(JSON.stringify(anchors[0])!==JSON.stringify(anchors[1])) results.push({link:true,disabled,leaf:anchors[0],aggregate:anchors[1]});
      }
      return results;
    });
    expect(mismatches).toEqual([]);
  });
}

test('button and link leaves keep native keyboard focus and consumer Parts', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.evaluate(async()=>{
    for(const tag of ['en-button','en-aggregate-button-probe','en-link','en-aggregate-link-probe']){
      const host=document.createElement(tag) as any;
      host.textContent='Open project';host.href='#destination';
      host.style.cssText='--en-button-focus-width:3px;--en-button-focus-offset:1px;--en-duration-focus-enter:0ms;--en-duration-focus-exit:0ms';
      document.querySelector('#fixture')!.append(host);await host.updateComplete;
    }
  });
  await page.keyboard.press('Tab');
  const focusPaint=async(selector:string)=>{
    const control=page.locator(selector);await control.focus();
    return control.evaluate(node=>{
      const style=getComputedStyle(node);
      return {focused:(node.getRootNode() as ShadowRoot).activeElement===node,outline:style.outline,offset:style.outlineOffset,shadow:style.boxShadow};
    });
  };
  expect(await focusPaint('en-button button')).toEqual(await focusPaint('en-aggregate-button-probe button'));
  expect(await focusPaint('en-link a')).toEqual(await focusPaint('en-aggregate-link-probe a'));
  await expect(page.locator('en-link a')).toHaveAttribute('href','#destination');
  await expect(page.locator('en-link a')).toHaveAccessibleName('Open project');
  await expect(page.locator('en-button button')).toHaveAccessibleName('Open project');
  expect(errors).toEqual([]);
});
