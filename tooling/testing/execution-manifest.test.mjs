import test from 'node:test';import assert from 'node:assert/strict';import {executionManifest} from './execution-manifest.mjs';
test('inventory binds integration-only checks and imported measurement controls without executing recipes',async()=>{const manifest=await executionManifest();assert.equal(manifest.obligations.length,manifest.graph.tasks.length);for(const path of ['probes/registry-diagnostics/qualify.mjs','probes/registry-diagnostics/check.mjs','tooling/testing/measure-regression.py']){const item=manifest.custom.find(item=>item.path===path);assert.equal(item.status,'bound-command-or-imported-obligation',path);assert(item.owners.length);}assert.equal(manifest.integrationView.completedResultReuse,false);assert.match(manifest.triggers.policy,/never activated/);});

test('delivery acquisition is documented without becoming ordinary execution',async()=>{
 const manifest=await executionManifest();
 const campaign=manifest.custom.find(item=>item.path==='probes/lazy-delivery-performance/campaign.mjs');
 assert.equal(campaign.status,'documented-specialized-protocol');assert.equal(campaign.owners.length,0);assert(campaign.activation.requiredInputs.length);
 assert(!manifest.graph.tasks.some(task=>task.command?.includes(campaign.path)));
 const control=manifest.custom.find(item=>item.path==='probes/lazy-delivery-performance/report.test.py');assert.equal(control.status,'bound-command-or-imported-obligation');assert(control.owners.includes('python:'+control.path));
});

test('portable campaign commands are inventoried without acquiring or rewriting evidence',async()=>{
 const manifest=await executionManifest();
 for(const path of ['showcases/performance/campaign.mjs','showcases/performance/campaigns/report.mjs','showcases/performance/experiments/integrate-current-campaign.mjs','showcases/performance/experiments/integrate-calendar-campaign.mjs']){
  const item=manifest.custom.find(item=>item.path===path);assert.equal(item.status,'documented-specialized-protocol');assert.equal(item.owners.length,0);assert(!manifest.graph.tasks.some(task=>task.command?.includes(path)));
 }
});
