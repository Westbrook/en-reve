import test from 'node:test';
import assert from 'node:assert/strict';
import { proveConfigurationAlias, testListLines } from './equivalence.mjs';
const alias='probes/scoped-registry/context-regressions.config.ts',producer='probes/context-protocol/playwright.config.ts';
function selection(configFile) {
 return {resolvedFacetsComplete:true,configFile:'/repo/'+configFile,workers:1,fullyParallel:false,webServer:{command:'node probes/context-protocol/server.mjs',cwd:'/repo',url:'http://127.0.0.1:4200',reuseExistingServer:false},
  projects:[{name:'chromium',use:{browserName:'chromium',viewport:{width:1280,height:720},reducedMotion:'reduce'},retries:0,repeatEach:1,dependencies:[]}],
  sourceHashes:{'/repo/probes/context-protocol/context.spec.ts':'same-source'},
  selected:[{id:configFile+'-case',titlePath:['','chromium','context.spec.ts','retains context ownership'],file:'/repo/probes/context-protocol/context.spec.ts',line:12,timeout:30000,expectedStatus:'passed',annotations:[]}]};
}
const identity={candidateDigest:'candidate',fixtureDigest:'fixture',browserDigest:'browser',environmentDigest:'environment'};
const binding={alias:identity,producer:identity};
test('reviewed alias references exact source cases from the same invocation',()=>{
 const proof=proveConfigurationAlias(alias,producer,selection(alias),selection(producer),binding);
 assert.equal(proof.coverage.length,1);assert.equal(proof.coverage[0].producerCase,producer+'-case');
});
test('viewport, media, delivery, source, tool and environment differences retain separate obligations',()=>{
 const mutations=[
  x=>x.projects[0].use.viewport.height++, x=>x.projects[0].use.hasTouch=true,
  x=>x.projects[0].use.reducedMotion='no-preference',x=>x.projects[0].use.forcedColors='active',
  x=>x.projects[0].use.baseURL='http://packed-fixture',x=>x.selected[0].expectedStatus='skipped',
  x=>x.sourceHashes['/repo/probes/context-protocol/context.spec.ts']='changed',x=>x.selected[0].timeout++,
 ];
 for(const mutate of mutations){const changed=selection(alias);mutate(changed);assert.throws(()=>proveConfigurationAlias(alias,producer,changed,selection(producer),binding),/distinct required facet/);}
 for(const key of Object.keys(identity))assert.throws(()=>proveConfigurationAlias(alias,producer,selection(alias),selection(producer),{alias:{...identity,[key]:'different'},producer:identity}),/mismatch/);
 assert.throws(()=>proveConfigurationAlias(alias,producer,selection(alias),selection(producer),{}),/Missing actual/);
 assert.throws(()=>proveConfigurationAlias('unreviewed.config.ts',producer,selection(alias),selection(producer),binding),/not reviewed/);
});

test('composition shares matching cases while preserving a distinct remaining case',()=>{
 const composition='apps/docs/tests/theme-composition.config.ts',main='apps/docs/tests/playwright.config.ts';
 const a=selection(composition),b=selection(main);a.selected.push({...a.selected[0],id:'extra-case',titlePath:['','chromium','context.spec.ts','different additional journey']});
 const proof=proveConfigurationAlias(composition,main,a,b,binding);
 assert.equal(proof.coverage.length,1);assert.deepEqual(proof.remaining,['extra-case']);
});


test('case retry and global assertion policies prevent unsafe aliases',()=>{
 const a=selection(alias);a.selected[0].retries=2;
 assert.throws(()=>proveConfigurationAlias(alias,producer,a,selection(producer),binding),/distinct required facet/);
 const b=selection(alias);b.expect={timeout:20};
 assert.throws(()=>proveConfigurationAlias(alias,producer,b,selection(producer),binding),/failure policy mismatch/);
 const c=selection(alias);c.sourceHashes={};
 assert.throws(()=>proveConfigurationAlias(alias,producer,c,selection(producer),binding),/Missing selected/);
});
test('exact test-list serialization rejects unknown cases and ambiguous titles',()=>{
 const discovery=selection(alias);discovery.rootDir='/repo';
 assert.equal(testListLines(discovery,[discovery.selected[0].id]),'[chromium] › probes/context-protocol/context.spec.ts › retains context ownership\n');
 assert.throws(()=>testListLines(discovery,['missing']),/Unknown/);
 assert.throws(()=>testListLines(discovery,[discovery.selected[0].id,discovery.selected[0].id]),/duplicate/);
 discovery.selected[0].titlePath.push('unsafe › title');
 assert.throws(()=>testListLines(discovery,[discovery.selected[0].id]),/delimiter/);
});

test('missing resolved internal assertion policy disables aliasing',()=>{
 const a=selection(alias);a.resolvedFacetsComplete=false;assert.throws(()=>proveConfigurationAlias(alias,producer,a,selection(producer),binding),/incomplete/);
 const b=selection(alias);b.failurePolicy={updateSnapshots:'all'};assert.throws(()=>proveConfigurationAlias(alias,producer,b,selection(producer),binding),/failure policy mismatch/);
});
