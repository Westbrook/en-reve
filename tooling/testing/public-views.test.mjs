import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { comprehensiveGraph } from './comprehensive.mjs';
import { publicViewPlan } from './public-views.mjs';
import { publicViewOutput } from './public-view-output.mjs';
const root=process.env.EN_GRAPH_FIXTURE_ROOT??new URL('../../',import.meta.url).pathname;

test('standalone API cannot silently repair stale metadata and forwards a filter only to its original last command',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot:root});
 const {plan,scope}=publicViewPlan(graph,'root#test:api',{root,forwarded:['--project=firefox','--grep=transaction']});
 assert.equal(plan[0].id,'check-api');assert(!plan.some(task=>task.kind==='producer'));
 assert.equal(plan.at(-1).config,'probes/api-transactions/playwright.config.ts');
 assert.deepEqual(plan.at(-1).command.slice(-2),['--project=firefox','--grep=transaction']);
 assert(plan.slice(0,-1).every(task=>!task.command.includes('--project=firefox')));
 assert.equal(scope,'caller-selected-public-command');
});
test('package and reader views preserve existing-build boundaries, selected sources and package cwd',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot:root});
 const primitive=publicViewPlan(graph,'packages/primitives#test',{root});
 assert.deepEqual(primitive.plan.slice(0,2).map(task=>task.id),['build:primitives','primitives-types']);
 assert(primitive.plan.at(-1).assertionSources.every(source=>/^packages\/primitives\/tests\/[^/]+\.test\.mjs$/.test(source)));
 assert.equal(primitive.plan.at(-1).cwd,'packages/primitives');
 const reader=publicViewPlan(graph,'showcases/performance-results#test',{root});
 assert(reader.view.existingBuild);assert(!reader.plan.some(task=>task.kind==='producer'||task.kind==='reader-browser'));
 assert.equal(reader.plan.at(-1).cwd,'showcases/performance-results');
 assert.equal(reader.plan.at(-1).config,'showcases/performance-results/playwright.config.js');
 const scoped=publicViewPlan(graph,'root#test:scoped-registries',{root});
 assert(scoped.plan.some(task=>task.id==='scoped-consumer-types'));
 assert(!scoped.plan.some(task=>task.id==='consumer-types'));
 const ssr=publicViewPlan(graph,'packages/ssr#test:browser',{root});
 assert.deepEqual(ssr.plan.map(task=>task.id),['prepare:ssr-minification','browser:packages/ssr/playwright.config.ts']);
 for(const option of ['--list','--help','-h','--version','-V']){
  const information=publicViewPlan(graph,'packages/ssr#test:browser',{root,forwarded:[option]});
  assert.deepEqual(information.plan.map(task=>task.id),['browser:packages/ssr/playwright.config.ts']);
  assert.equal(information.plan[0].command.at(-1),option);
 }
});
test('legacy theme and release output requests retain named child paths without overwriting an implicit historic default',()=>{
 const theme=publicViewOutput(root,'root#test:theme',{EN_THEME_TEST_OUTPUT_DIR:'/tmp/explicit-theme-run'});
 assert.equal(theme.output,'/tmp/explicit-theme-run');assert.equal(theme.legacyVariable,'EN_THEME_TEST_OUTPUT_DIR');
 const mapping=JSON.parse(theme.environment.EN_TEST_PIPELINE_CONFIG_OUTPUTS);
 assert(Object.values(mapping).includes('/tmp/explicit-theme-run/docs'));
 const one=publicViewOutput(root,'root#test:api',{}),two=publicViewOutput(root,'root#test:api',{});
 assert.notEqual(one.output,two.output);assert(!one.explicit);
});

test('standalone theme keeps full component presentation owners from the canonical graph',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot:root});
 const {plan}=publicViewPlan(graph,'root#test:theme',{root});
 for(const config of [...['slider','rating','accordion','patterns'].map(name=>`packages/elements/src/${name}/tests/playwright.config.ts`),'apps/docs/tests/theme-composition.config.ts']){
 const owners=plan.filter(task=>task.config===config);
 assert.equal(owners.length,1);
 assert.deepEqual(owners[0].command.slice(-2),['--config',resolve(root,config)]);
 }
});

test('platform probe view includes pinned Reference Target checks without changing legacy filter forwarding',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot:root});
 const {plan}=publicViewPlan(graph,'root#test:probes',{root,forwarded:['--grep=FACE']});
 assert(plan.some(task=>task.assertionSources?.includes('probes/reference-target/vendor.test.mjs')));
 assert(plan.some(task=>task.config==='probes/reference-target/playwright.config.ts'));
 assert.equal(plan.at(-1).config,'probes/playwright.config.ts');
 assert(plan.slice(0,-1).every(task=>!task.command.includes('--grep=FACE')));
});
