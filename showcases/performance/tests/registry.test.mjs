import test from 'node:test';
import assert from 'node:assert/strict';
import {registryJobs, summarizeRegistry} from '../src/registry-runner.mjs';
import {validateFixtureConfig} from '../src/registry-fixture.mjs';

test('benchmark matrix has repeatable paired blocks without invented global topologies',()=>{
  const args={scenarios:'scaling',workflows:'settings,sso',modes:'global,scoped',policies:'shared,group,instance,element',counts:'1,4',samples:2,seed:7};
  const one=registryJobs(args),two=registryJobs(args);
  assert.deepEqual(one,two);
  assert.equal(one.jobs.length,40);
  assert.ok(one.jobs.filter(j=>j.mode==='global').every(j=>j.policy==='shared'));
  for(const block of [0,1])assert.equal(one.jobs.filter(j=>j.block===block).length,20);
  assert.equal(new Set(one.jobs.map(j=>j.id)).size,one.jobs.length);
});
test('invalid matrices fail before browser work or ambiguous fixture ownership',()=>{
  for(const args of [{counts:'0'},{checkpoints:'1,10'},{checkpoints:'0,10,10'},{scenarios:'typo'},{browsers:'chromium,chromium'},{samples:0},{'root-kind':'light',scenarios:'ssr',counts:'1'}]) assert.throws(()=>registryJobs(args));
  assert.throws(()=>validateFixtureConfig({workflow:'settings',mode:'global',policy:'shared',count:2,groupSize:2,root:'light',delivery:'csr'}));
});
test('unsupported and failed runs never become fast successful measurements',()=>{
  const base={scenario:'scaling',workflow:'settings',mode:'scoped',policy:'shared',browser:'chromium',profile:'desktop',cache:'cold',count:1,root:'shadow'};
  const measure=duration=>({measures:[{name:'registry:module-load',duration}]});
  const summary=summarizeRegistry([{...base,status:'unsupported',metrics:measure(0)},{...base,status:'failed',metrics:measure(1)},{...base,status:'ok',metrics:measure(50)}]);
  assert.equal(summary.passed,1);assert.equal(summary.failed,1);assert.equal(summary.unsupported,1);
  assert.equal(summary.cells[0].moduleLoadMs.median,50);
  assert.equal(summary.cells[0].activationMs.median,null);
});
