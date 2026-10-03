import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateImpact,runtimeImports,selectImpact} from './impact.mjs';
import {digestJson} from './identity.ts';

const manifest=await generateImpact();
test('real source graph covers the whole component catalogue and authored specimens',()=>{
  assert.equal(manifest.gaps.length,0,manifest.gaps.join('\n'));
  assert.ok(manifest.components.length>=90);assert.ok(manifest.scenarios.length>=60);
  const nodes=new Set(manifest.graph.nodes.map(node=>node.id));
  for(const node of manifest.graph.nodes)for(const dependency of node.dependencies)assert.ok(nodes.has(dependency),`${node.id}: ${dependency}`);
  assert.ok(manifest.inputs['packages/elements/src/button/element.ts']);
  assert.ok(manifest.inputs['packages/styles/src/css/typography.css']);
  assert.ok(manifest.inputs['specimen:buttons']);
});
test('token aliases, fallback properties, imported styles and generated children propagate',()=>{
  const radius=selectImpact(manifest,['token:radius.control']);
  assert.equal(radius.mode,'focused');assert.ok(radius.affected.includes('token:component.button.radius'));
  assert.ok(radius.components.includes('en-button'));assert.ok(radius.caseIds.includes('buttons'));
  assert.ok(radius.caseIds.includes('workflow:settings'));
  const style=selectImpact(manifest,['source:packages/styles/src/buttons.ts']);
  assert.ok(style.components.includes('en-button'));assert.ok(style.components.includes('en-date-picker'));
  assert.ok(style.caseIds.includes('calendar'));
});
test('unknown changed input or unresolved graph edges always expand to full selection',()=>{
  const unknown=selectImpact(manifest,['token:not-known']);assert.equal(unknown.mode,'expanded');assert.equal(unknown.components.length,manifest.components.length);assert.equal(unknown.caseIds.length,manifest.scenarios.length);
  const {digest,...changed}=structuredClone(manifest);changed.graph.nodes[0].complete=false;
  const incomplete=selectImpact({...changed,digest:digestJson(changed)},['token:radius.control']);assert.equal(incomplete.mode,'expanded');assert.equal(incomplete.caseIds.length,manifest.scenarios.length);
});
test('modified manifest cannot reuse an identity',()=>{
  const altered=structuredClone(manifest);altered.graph.nodes.pop();assert.throws(()=>selectImpact(altered,['token:radius.control']),/integrity mismatch/);
});
test('runtime import extraction includes lazy modules and rejects unknown dynamic resolution',()=>{
  assert.deepEqual(runtimeImports('fixture.ts',`import type {X} from './types.js';import {type Y} from './types2.js';import './effect.js';export {x} from './base.js';const mod=import('./lazy.js');const other=import(name);type T=import('./type-query.js').T;`).imports,['./base.js','./effect.js','./lazy.js']);
  assert.equal(runtimeImports('fixture.ts','import(name)').gaps.length,1);
});

test('a shared docs asset invalidates every authored review scenario',()=>{
  const asset=manifest.graph.nodes.find(node=>node.id.startsWith('asset:apps/docs/public/fonts/'));assert.ok(asset);
  const selection=selectImpact(manifest,[asset.id]);assert.equal(selection.mode,'focused');assert.equal(selection.caseIds.length,manifest.scenarios.length);
});
