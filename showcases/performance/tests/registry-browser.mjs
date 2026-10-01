// Negative qualification controls. Run after building a registry fixture.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {exclusiveBrowserWork} from '../src/lock.mjs';
import {startRegistryFixture} from '../src/registry-fixture.mjs';
import {runRegistryScenario} from '../scenarios/registry-workflows.mjs';

const directory=process.argv[2];
if(!directory)throw new Error('Pass the path to an archived registry run fixture directory.');
await exclusiveBrowserWork(async()=>{
  const server=await startRegistryFixture(resolve(directory));
  const browser=await chromium.launch();
  const checks=[];
  async function pageFor(delivery='csr',count=3) {
    const page=await browser.newPage();
    await page.goto(`${server.url}/?workflow=sso&mode=scoped&delivery=${delivery}&count=${count}`);
    await page.waitForFunction(()=>Boolean(window.registryBench));
    return page;
  }
  try {
    {
      const page=await pageFor();
      await page.evaluate(()=>customElements.define('en-button',class extends HTMLElement {}));
      await assert.rejects(()=>page.evaluate(()=>window.registryBench.load()),/registered global elements before activation/);
      checks.push('Accidental eager global registration is rejected');await page.close();
    }
    {
      const page=await pageFor();
      await page.evaluate(async()=>{
        const runtime=await window.registryBench.load(),activate=runtime.activate;
        runtime.activate=async id=>{
          await activate(id);
          if(id===0){
            const first=document.querySelector('[data-island="0"]').shadowRoot;
            first.customElementRegistry.initialize(document.querySelector('[data-island="1"]').shadowRoot);
            await Promise.resolve();
          }
        };
      });
      await assert.rejects(()=>runRegistryScenario(page,{workflow:'sso'},{scenario:'containment'}),/Activation escaped selected island/);
      checks.push('Upgrades escaping into a dormant island fail containment');await page.close();
    }
    {
      const page=await pageFor('ssr',1);
      await page.evaluate(async()=>{
        const runtime=await window.registryBench.load(),activate=runtime.activate;
        runtime.activate=async id=>{
          await activate(id);
          const root=document.querySelector('[data-island="0"]').shadowRoot.querySelector('en-text-field').shadowRoot;
          root.append(root.querySelector('input').cloneNode(true));
        };
      });
      await assert.rejects(()=>runRegistryScenario(page,{workflow:'sso'},{scenario:'ssr'}),/Hydration moved focus or changed native control count/);
      checks.push('Duplicate native controls fail SSR despite original-node preservation');await page.close();
    }
    console.log(JSON.stringify({passed:checks.length,checks},null,2));
  }finally{await browser.close();await server.close();}
});
