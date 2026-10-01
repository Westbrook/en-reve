import {expect} from '@playwright/test';

export const registryScenarioVersion = '2';
export async function workflowAction(page, workflow, id=0) {
  const island=page.locator(`[data-island="${id}"]`);
  // Capture trusted input inside the page; host polling remains a measured upper bound.
  await page.evaluate(() => {
    window.__registryAction={};
    const listener=event=>{if(event.isTrusted){window.__registryAction.input=performance.now();performance.mark('registry:workflow-input');document.removeEventListener('input',listener,true);}};
    document.addEventListener('input',listener,true);
  });
  if(workflow==='settings') {
    const field=island.getByRole('spinbutton',{name:'Layer opacity Exact value',exact:true});
    await field.fill('73');await field.press('Tab');
    await expect(island.locator('[data-settings-current]')).toContainText('73');
    await island.getByRole('button',{name:'Restore saved opacity',exact:true}).click();
    await expect(field).not.toHaveValue('73');
  } else if(workflow==='sso') {
    await island.getByRole('textbox',{name:'Workspace',exact:true}).fill('Registry studio');
    await island.getByRole('textbox',{name:'Work email',exact:true}).fill('registry@example.com');
    await island.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(island.getByRole('radiogroup',{name:'Sign-in provider',exact:true})).toBeVisible();
  } else {
    const field=island.getByRole('textbox',{name:'Message',exact:true});
    await field.fill('Keep this profiling draft');
    await expect(field).toHaveValue('Keep this profiling draft');
    await island.getByRole('button',{name:'Send message',exact:true}).click();
    await expect(island.locator('.chat-turn').filter({hasText:'Keep this profiling draft'})).toBeVisible();
  }
  return page.evaluate(async()=>{
    const completed=performance.now();performance.mark('registry:workflow-action-completed');
    await new Promise(resolve=>requestAnimationFrame(resolve));
    return {...window.__registryAction,semanticCompletedUpperBound:completed,frameOpportunity:performance.now()};
  });
}

export async function runRegistryScenario(page, config, {scenario,checkpoints=[0,10,50,100],memory}) {
  const api=()=>page.evaluate(()=>window.registryBench.runtime.snapshot());
  if(scenario==='activation') {
    // Trusted click starts module loading; do not pre-load this scenario.
    await page.getByRole('button',{name:'Activate first workflow',exact:true}).click();
    await page.waitForFunction(()=>window.registryBench.runtime?.unsupported || document.querySelector('#status').textContent==='Workflow ready.' || document.querySelector('#status').textContent.startsWith('Activation failed:'));
    const state=await page.evaluate(()=>({unsupported:window.registryBench.runtime?.unsupported,status:document.querySelector('#status').textContent,capability:window.registryBench.runtime?.capability}));
    if(state.unsupported)return {status:'unsupported',capability:state.capability};
    if(state.status!=='Workflow ready.')throw new Error(state.status);
    return {status:'ok',after:await api(),action:await workflowAction(page,config.workflow),contract:'Trusted activation includes initial dynamic imports, preparation, definition and render readiness.'};
  }
  const loaded=await page.evaluate(async()=>{const r=await window.registryBench.load();return {unsupported:r.unsupported,capability:r.capability};});
  if(loaded.unsupported)return {status:'unsupported',capability:loaded.capability};
  const before=await api();
  if(scenario==='containment') {
    if(before.rows.some(row=>row.upgraded))throw new Error('Dormant workflows upgraded before activation');
    const result=await page.evaluate(()=>window.registryBench.activate(0));
    const after=await api();
    if(!after.rows[0].upgraded || after.rows.slice(1).some(row=>row.upgraded))throw new Error('Activation escaped selected island');
    const action=await workflowAction(page,config.workflow);
    const afterAction=await api();
    if(afterAction.rows.slice(1).some(row=>row.upgraded))throw new Error('Interaction upgraded an inactive island');
    await page.evaluate(()=>window.registryBench.runtime.activate(1));
    const second=await api();
    if(!second.rows[1].upgraded || second.rows.slice(2).some(row=>row.upgraded))throw new Error('Second island activation was not contained');
    return {status:'ok',before,after,afterAction,second,activation:result,action,contract:before.scoped?'Connected null-associated workflows activate independently.':'Inactive workflows are not instantiated; global define has no per-node isolation.'};
  }
  if(scenario==='lifecycle') {
    await page.evaluate(()=>window.registryBench.runtime.disposeAll());
    const samples=[];
    let cycle=0;
    for(const checkpoint of checkpoints) {
      while(cycle<checkpoint) {
        const id=await page.evaluate(async()=>{const r=window.registryBench.runtime;const id=r.mount();await r.activate(id);return id;});
        await workflowAction(page,config.workflow,id);
        await page.evaluate(id=>{const r=window.registryBench.runtime;r.dispose(id);r.resetMeasurements();},id);
        cycle++;
      }
      // One task turn allows canceled fixture deliveries/disconnect reactions to settle.
      await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
      const state=await api();
      if(state.rows.length || state.counters.updatesAfterDispose)throw new Error('Workflow disposal left live instances or stale updates');
      samples.push({cycle,state,memory:await memory()});
    }
    return {status:'ok',samples,interpretation:'Post-disposal retention checkpoints, not proof of a leak. Module definitions and shared registries intentionally stay loaded.'};
  }
  if(scenario==='ssr') {
    const nodes=await page.evaluate(()=>{
      const host=document.querySelector('[data-island="0"]');
      const root=host.shadowRoot;
      const collect=parent=>[...parent.querySelectorAll('*')].flatMap(element=>[element,...(element.shadowRoot?collect(element.shadowRoot):[])]);
      window.__registrySSRNodes=collect(root);
      const ancestor=(node,selector)=>{let current=node;while(current){if(current.matches?.(selector))return true;current=current.parentElement??current.getRootNode().host;}return false;};
      window.__registrySSRControls=window.__registrySSRNodes.filter(n=>n.matches('input,textarea,button,select')).map(node=>({node,fallback:ancestor(node,'[data-en-slot-fallback]'),hiddenVirtual:ancestor(node,'[data-en-virtual-key]') && ancestor(node,'details:not([open])')}));
      return {nodes:window.__registrySSRNodes.length,inputs:window.__registrySSRNodes.filter(n=>n.matches('input,textarea')).length,text:root.textContent.length};
    });
    if(!nodes.inputs || !nodes.text)throw new Error('SSR did not provide initial native controls/content');
    // Focus a native control while hosts are still undefined; do not click the
    // activation button (which would legitimately move focus).
    await page.locator('[data-island="0"]').locator('input,textarea').first().focus();
    await page.evaluate(()=>{
      let active=document.activeElement;while(active?.shadowRoot?.activeElement)active=active.shadowRoot.activeElement;
      window.__registrySSRFocus=active;
    });
    await page.evaluate(()=>window.registryBench.activate(0));
    const identity=await page.evaluate(()=>{
      const original=window.__registrySSRNodes;
      let focused=document.activeElement;while(focused?.shadowRoot?.activeElement)focused=focused.shadowRoot.activeElement;
      const collect=parent=>[...parent.querySelectorAll('*')].flatMap(element=>[element,...(element.shadowRoot?collect(element.shadowRoot):[])]);
      const after=collect(document.querySelector('[data-island="0"]').shadowRoot);
      const controls=window.__registrySSRControls;
      const result={addedControls:after.filter(n=>n.matches('input,textarea,button,select') && !original.includes(n)).length,removedAuthoredControls:controls.filter(c=>!c.fallback && !c.hiddenVirtual && !c.node.isConnected).length,removedHiddenVirtualControls:controls.filter(c=>c.hiddenVirtual && !c.node.isConnected).length,removedSlotFallbackControls:controls.filter(c=>c.fallback && !c.node.isConnected).length,focusPreserved:focused===window.__registrySSRFocus,nativeControlCountBefore:original.filter(n=>n.matches('input,textarea,button,select')).length,nativeControlCountAfter:after.filter(n=>n.matches('input,textarea,button,select')).length,preserved:original.every(node=>node.isConnected),nativeControlsPreserved:original.filter(n=>n.matches('input,textarea')).every(n=>n.isConnected)};
      delete window.__registrySSRNodes;delete window.__registrySSRControls;delete window.__registrySSRFocus;return result;
    });
    if(!identity.focusPreserved || identity.addedControls || identity.removedAuthoredControls)throw new Error('Hydration moved focus or changed native control count: '+JSON.stringify(identity));
    if(!identity.nativeControlsPreserved)throw new Error('Hydration replaced server-rendered native controls');
    const action=await workflowAction(page,config.workflow);
    return {status:'ok',nodes,identity,action,after:await api()};
  }
  const start=await page.evaluate(()=>performance.now());
  for(let id=0;id<config.count;id++)await page.evaluate(id=>window.registryBench.runtime.activate(id),id);
  const end=await page.evaluate(()=>performance.now());
  const after=await api();
  if(after.rows.some(row=>!row.active || !row.upgraded))throw new Error('Scaling cohort not completely activated');
  return {status:'ok',before,after,cohortReadinessUpperBoundMs:end-start,action:await workflowAction(page,config.workflow)};
}
