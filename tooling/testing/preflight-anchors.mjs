import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import os from 'node:os';
import { profiles } from '../../showcases/performance/src/config.mjs';
import { labIdentity } from '../../showcases/performance/src/runner.mjs';
import { readRun } from '../../showcases/performance/src/report.mjs';
import { timingLifecycleProtocol, timingProtocolMatches } from '../../showcases/performance/src/regression.mjs';
const [lane,load,interactions]=process.argv.slice(2);
assert(['sentinel','full'].includes(lane),'Expected regression lane');
assert(load&&interactions,'Both reviewed anchor paths are required');
const harness=await labIdentity();
for(const [suite,file] of [['load',load],['interactions',interactions]]){
 const baseline=JSON.parse(await readFile(file,'utf8')),prior=await readRun(dirname(resolve(file)));
 assert.equal(baseline.schema,1,'Unsupported baseline schema');
 assert(baseline.name&&baseline.reason&&baseline.sizes,'Incomplete reviewed baseline envelope');
 assert.equal(prior.manifest.options.suite,suite,`${suite}: wrong anchor suite`);
 assert.equal(timingLifecycleProtocol(prior.manifest.options),'fixed-wait-v1',`${suite}: collector protocol differs from the unchanged native lane`);
 assert(timingProtocolMatches(prior),`${suite}: successful sample collector protocols disagree with the anchor manifest`);
 assert.equal(prior.manifest.harnessSha256,harness,`${suite}: harness changed; preserve the anchor and qualify overlap before deliberate baseline establishment`);
 assert.equal(baseline.harnessSha256,prior.manifest.harnessSha256,'Baseline envelope and manifest disagree');
 for(const [key,value] of Object.entries({cpu:os.cpus()[0]?.model,platform:os.platform(),release:os.release()}))assert.equal(prior.manifest.host[key],value,`${suite}: host ${key} differs`);
 assert.equal(JSON.stringify(prior.manifest.profiles),JSON.stringify(profiles),`${suite}: profile definitions differ`);
 for(const profile of lane==='sentinel'?['mobile']:['desktop','mobile'])for(const cache of suite==='interactions'||lane==='sentinel'?['cold']:['cold','warm']){
  const samples=prior.samples.filter(sample=>sample.system==='en-reve'&&sample.profile===profile&&sample.cache===cache);
  assert(samples.length>=30&&samples.every(sample=>sample.status==='ok'),`${suite}/${profile}/${cache}: incomplete or failed anchor cell`);
 }
}
console.log('Reviewed anchor inputs match the existing protocol/host/profile prerequisites; fresh browser compatibility and regression checks still run after acquisition.');
