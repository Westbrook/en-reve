import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { comprehensiveGraph } from './comprehensive.mjs';
import { selectTasks } from './pathways.mjs';
import { selectAffected } from '../evidence/graph.ts';
import { maintainedFiles, workloadManifest } from './workload.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const workspaceRoot=process.env.EN_GRAPH_FIXTURE_ROOT??new URL('../../',import.meta.url).pathname;

async function pipedPlan(file,args){
 const child=spawn(process.execPath,[new URL(file,import.meta.url).pathname,'--plan',...args],{stdio:['ignore','pipe','pipe']});
 const chunks=[];let stderr='';
 child.stderr.on('data',chunk=>stderr+=chunk);
 child.stdout.on('data',chunk=>chunks.push(chunk));
 child.stdout.pause();
 const resume=setTimeout(()=>child.stdout.resume(),100);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
 clearTimeout(resume);
 assert.equal(code,0,stderr);
 return Buffer.concat(chunks).toString();
}

test('the comprehensive plan remains complete through a backpressured stdout pipe',async()=>{
 const output=await pipedPlan('./run-comprehensive.mjs',['--pathways=correctness']);
 assert(output.length>65536,'Exercise a plan larger than the stdout pipe buffer');
 const plan=JSON.parse(output);
 assert(plan.tasks.length>0);
 assert.deepEqual(plan.selected,selectTasks(plan,['correctness']).map(task=>task.id));
});

test('public, specialized and legacy plans remain parseable through stdout pipes',async()=>{
 const forwarded='retained-filter-'.repeat(6000);
 const publicPlan=JSON.parse(await pipedPlan('./run-public-view.mjs',['--view=root#test:extended:button','--','--grep',forwarded]));
 assert(JSON.stringify(publicPlan).includes(forwarded),'Retain the complete caller selection');
 const specialized=JSON.parse(await pipedPlan('./run-specialized.mjs',['--pathway=date']));
 assert.equal(specialized.pathway,'date');
 assert(specialized.plan.length>0);assert.equal(specialized.libraryComplete,false);
 const legacy=JSON.parse(await pipedPlan('./run.mjs',['--pathways=api,release,theme']));
 assert.deepEqual(legacy.selected,selectTasks(legacy,['api','release','theme']).map(task=>task.id));
});

test('broad current graph inventories every maintained config and preserves standalone API stale-metadata detection',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot});
 const api=selectTasks(graph,['api']);
 assert(!api.some(task=>task.kind==='producer'),'Standalone API must not regenerate the metadata it checks');
 assert(api.some(task=>task.id==='check-api'));
 const release=selectTasks(graph,['release']);assert(release.some(task=>task.id==='metadata:types'));assert(release.some(task=>task.id==='build:docs'));
 const union=selectTasks(graph,['correctness']);assert.equal(union.length,new Set(union.map(task=>task.id)).size);
 const dependencyGraph={schemaVersion:1,nodes:graph.tasks.map(task=>({id:task.id,kind:'scenario',dependencies:task.dependencies,complete:false}))};
 const validation=selectAffected(dependencyGraph,['unknown-changed-file']);
 assert.equal(validation.mode,'expanded');assert.equal(validation.affected.length,graph.tasks.length+1);
 assert(!validation.gaps.some(gap=>gap.startsWith('Unknown dependency ')),validation.gaps.join('\n'));
 assert.equal(union.filter(task=>task.id==='node:tooling/theme-candidates/catalogue.test.mjs').length,0);
 assert.equal(union.filter(task=>/node:tooling\/theme-candidates\/catalogue-group-\d.test.mjs/.test(task.id)).length,3);
 const reader=selectTasks(graph,['reader']);assert.equal(reader.filter(task=>task.kind==='reader-browser').length,4);
 const crumbs=selectTasks(graph,['breadcrumbs']);const types=crumbs.find(task=>task.id==='breadcrumbs-types');assert(types.command.includes('--noUnusedLocals'));assert(types.command.includes('--noUnusedParameters'));
 const registry=selectTasks(graph,['registry']);assert.equal(registry.filter(task=>task.id==='prepare:packages').length,1);assert(registry.findIndex(task=>task.id==='prepare:packages')<registry.findIndex(task=>task.id==='prepare:scoped-registry'));
 assert(graph.pathways['extended-node'].includes('node:apps/docs/tests/specimen-source-assembly.test.mjs'),'Keep newly declared generator regressions selected');
 const ssr=selectTasks(graph,['ssr-browser']);assert.equal(ssr.filter(task=>task.id==='prepare:ssr-minification').length,1);assert(ssr.findIndex(task=>task.id==='prepare:ssr-minification')<ssr.findIndex(task=>task.id==='browser:packages/ssr/playwright.config.ts'));
 assert.equal(ssr.find(task=>task.id==='prepare:ssr-minification').command.at(-1),'--source-only','The server owns the one fresh fixture build; the graph binds generated source only.');
 assert.equal(graph.completedResultReuse,false,'Unknown edges must not enable completed-result reuse');
});


test('maintained discovery retains new sources but ignores generated Vite dependency caches', async () => {
 const fixture = await mkdtemp(join(tmpdir(), 'en-maintained-files-'));
 try {
  for (const directory of ['packages', 'apps', 'tooling', 'probes', 'showcases']) await mkdir(join(fixture, directory));
  const authored = ['packages/new-consumer/package.json', 'packages/new-consumer/new.test.mjs', 'probes/.vite-fixture/consumer.test.mjs'];
  const generated = ['packages/new-consumer/.vite/deps/package.json', 'packages/new-consumer/.vite/deps/generated.test.mjs', 'apps/.vite-temp/generated.test.mjs'];
  for (const file of [...authored, ...generated]) {
   await mkdir(join(fixture, file, '..'), { recursive: true });
   await writeFile(join(fixture, file), '{}');
  }
  assert.deepEqual(await maintainedFiles(fixture), authored.sort());
  await writeFile(join(fixture, 'probes/added.test.mjs'), '{}');
  await rm(join(fixture, authored[0]));
  assert.deepEqual(await maintainedFiles(fixture), [...authored.slice(1), 'probes/added.test.mjs'].sort());
 } finally { await rm(fixture, { recursive: true, force: true }); }
});


test('Integration wrapper is explicitly inventoried while packed consumers retain their real preparation dependencies',async()=>{
 const graph=await comprehensiveGraph({workspaceRoot});
 assert(!graph.tasks.some(task=>task.id==='browser:tooling/integration-gates/playwright.config.ts'));
 const wrapper=graph.inactive.find(item=>item.file==='tooling/integration-gates/playwright.config.ts');
 assert.equal(wrapper.classification,'orchestration-wrapper');assert.equal(wrapper.provider,'tooling/integration-gates/run.mjs');assert.deepEqual(wrapper.requiredEnvironment,['EN_GATE_CONFIG','EN_GATE_STAGE_OUTPUT']);
 const union=selectTasks(graph,['correctness']);const prepare=union.find(task=>task.id==='prepare:consumer-contracts'),browser=union.find(task=>task.id==='browser:probes/consumer-contracts/playwright.config.ts');
 assert(prepare&&browser);assert.deepEqual(prepare.dependencies,['metadata','build:ssr']);assert(browser.dependencies.includes(prepare.id));assert.equal(prepare.environment.EN_CONSUMER_CONTRACTS_OUT,'$RUN/fixtures/consumer-contracts');assert.equal(browser.environment.EN_CONSUMER_CONTRACTS_OUT,prepare.environment.EN_CONSUMER_CONTRACTS_OUT);assert(union.indexOf(prepare)<union.indexOf(browser));
 const inventory=await workloadManifest(),entry=inventory.configs.find(item=>item.path==='tooling/integration-gates/playwright.config.ts');assert.equal(entry.role.kind,'orchestration-wrapper');assert.equal(entry.discovery,null);assert(inventory.configs.find(item=>item.path==='probes/consumer-contracts/playwright.config.ts').discovery.includes('--list'));
});
