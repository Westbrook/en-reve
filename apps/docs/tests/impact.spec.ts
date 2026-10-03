import {test,expect,type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {selectImpact} from '../../../tooling/evidence/impact.mjs';

async function paint(page:Page){
  return page.locator('[data-specimen]').evaluateAll(roots=>{
    const properties=['color','background-color','border-top-color','border-top-width','border-radius','box-shadow','font-family','font-size','font-weight','line-height','padding','gap','min-width','min-height','width','height','display','visibility','opacity'];
    const output:Record<string,string>={};
    for(const root of roots){
      const rows:unknown[]=[];
      const visit=(element:Element)=>{
        const style=getComputedStyle(element);rows.push([element.localName,properties.map(name=>style.getPropertyValue(name))]);
        for(const child of element.children)visit(child);
        if(element.shadowRoot)for(const child of element.shadowRoot.children)visit(child);
      };
      const content=root.querySelector('.specimen-content');if(content)visit(content);
      output[root.getAttribute('data-specimen')!]=JSON.stringify(rows);
    }
    return output;
  });
}

test('generated impact selection contains broad uncached rendered-style changes',async({page,request},info)=>{
  test.setTimeout(120000);
  const response=await request.get('/impact.json');expect(response.ok()).toBe(true);const manifest=await response.json();
  expect(manifest.gaps).toEqual([]);
  await page.goto('/');await expect(page.locator('en-sticker-app')).toHaveJSProperty('hasUpdated',true);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    for(let pass=0;pass<3;pass++){
      const elements:Element[]=[];const visit=(root:Document|ShadowRoot)=>{for(const element of root.querySelectorAll('*')){elements.push(element);if(element.shadowRoot)visit(element.shadowRoot);}};visit(document);
      await Promise.all(elements.map(e=>(e as Element&{updateComplete?:Promise<unknown>}).updateComplete));
    }
  });
  const baseline=await paint(page);expect(Object.keys(baseline).sort()).toEqual(manifest.scenarios.filter((s:{id:string})=>!s.id.startsWith('workflow:')).map((s:{id:string})=>s.id).sort());
  const evidence=[];
  for(const [token,property,value] of [['component.button.radius','--en-button-radius','0px'],['radius.control','--en-radius-control','2rem'],['color.action','--en-color-action','rgb(180 35 90)']]){
    const selection=selectImpact(manifest,['token:'+token]);expect(selection.mode).toBe('focused');
    await page.locator('en-sticker-app').evaluate((host,{property,value})=>(host as HTMLElement).style.setProperty(property,value),{property,value});
    const changed=await paint(page);const changedCases=Object.keys(changed).filter(id=>changed[id]!==baseline[id]);
    expect(changedCases.length, `The ${token} override must change rendered styles`).toBeGreaterThan(0);
    expect(changedCases.filter(id=>!selection.caseIds.includes(id))).toEqual([]);
    evidence.push({token,property,value,selected:selection.caseIds,observedChanged:changedCases,broadCases:Object.keys(baseline),scope:'Computed style observations in rendered initial states; not pixel comparison, hidden-state completeness or manual acceptance.'});
    await page.locator('en-sticker-app').evaluate((host,property)=>(host as HTMLElement).style.removeProperty(property),property);
    expect(await paint(page)).toEqual(baseline);
  }
  await writeFile(info.outputPath('impact-rendered-qualification.json'),JSON.stringify({impactDigest:manifest.digest,engine:info.project.name,evidence},null,2));
});
