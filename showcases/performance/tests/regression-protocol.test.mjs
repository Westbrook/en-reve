import test from 'node:test';
import assert from 'node:assert/strict';
import { compatibleTimingRuns, timingLifecycleProtocol, timingProtocolMatches } from '../src/regression.mjs';

function run(protocol) {
 return { manifest: { harnessSha256:'same-source', host:{cpu:'same-cpu',platform:'same-platform',release:'same-release'},profiles:{desktop:{width:1440}},options:{suite:'load',...(protocol===undefined?{}:{lifecycle:protocol})} },
  samples:[{status:'ok',instrument:true,...(protocol===undefined?{}:{lifecycleProtocol:protocol})}] };
}
test('implicit historical fixed wait and explicit fixed wait are the same protocol', () => {
 assert.equal(timingLifecycleProtocol({}), 'fixed-wait-v1');
 assert(compatibleTimingRuns(run(),run('fixed-wait-v1')));
 assert(compatibleTimingRuns(run('fixed-wait-v1'),run()));
 assert(compatibleTimingRuns(run('ack-v1'),run('ack-v1')));
});
test('identical harness bytes cannot make fixed wait and acknowledgement comparable', () => {
 for(const original of [undefined,'fixed-wait-v1']) {
  assert.equal(compatibleTimingRuns(run(original),run('ack-v1')),false);
  assert.equal(compatibleTimingRuns(run('ack-v1'),run(original)),false);
 }
});
test('one mixed or missing acknowledgement sample prevents timing comparison', () => {
 const mixed=run('ack-v1');mixed.samples.push({status:'ok',instrument:true,lifecycleProtocol:'fixed-wait-v1'});
 assert.equal(timingProtocolMatches(mixed),false);
 assert.equal(compatibleTimingRuns(mixed,run('ack-v1')),false);
 const missing=run('ack-v1');delete missing.samples[0].lifecycleProtocol;
 assert.equal(timingProtocolMatches(missing),false);
 const disguised=run();disguised.samples[0].lifecycleProtocol='ack-v1';
 assert.equal(timingProtocolMatches(disguised),false);
});
test('unknown lifecycle protocols fail closed even when both manifests agree', () => {
 assert.equal(timingLifecycleProtocol({lifecycle:'unknown'}),null);
 assert.equal(compatibleTimingRuns(run('unknown'),run('unknown')),false);
 const unknown=run();unknown.samples[0].lifecycleProtocol='unknown';assert.equal(timingProtocolMatches(unknown),false);
});
test('existing harness, host, profile and suite separation remains required', () => {
 const mutations=[value=>value.manifest.harnessSha256='other',value=>value.manifest.host.cpu='other',value=>value.manifest.host.platform='other',value=>value.manifest.host.release='other',value=>value.manifest.profiles.desktop.width=390,value=>value.manifest.options.suite='interactions'];
 for(const mutate of mutations){const changed=run();mutate(changed);assert.equal(compatibleTimingRuns(changed,run()),false);}
});
test('failed samples remain failures for the original completeness check, not accepted timing observations', () => {
 const failed=run('ack-v1');failed.samples.push({status:'failed',instrument:true,errors:[{message:'Delivery failed before finalization'}]});
 assert.equal(timingProtocolMatches(failed),true);
 assert.equal(failed.samples.at(-1).status,'failed');
});
