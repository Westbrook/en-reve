import test from 'node:test';
import assert from 'node:assert/strict';
import {activationFor} from './command-activation.mjs';
const experiment=name=>activationFor('showcases/performance/experiments/'+name+'.mjs');
test('fresh native diagnostics are not mistaken for hardcoded run recipes',()=>{
 for(const name of ['run-dom-review','run-dom-ownership'])assert.equal(experiment(name).tier,'native-diagnostics');
 assert.equal(experiment('run-en-reve-main').tier,'historical-recipe');
});
test('fixed evidence and report cohorts retain explicit historical inputs',()=>{
 for(const name of ['verify-web-awesome-freeze','verify-en-reve-main-evidence','report-dom-review','qualify-calendar-variants','calibrate-startup-discovery'])assert.equal(experiment(name).tier,'historical-reproduction');
});
test('current instrument controls remain an unfulfilled calibration obligation',()=>{
 for(const name of ['calibrate-cdp-scope','calibrate-startup','calibrate-web-awesome-dialog'])assert.equal(experiment(name).tier,'instrument-calibration');
 assert.equal(experiment('unknown-new-program').tier,'specialized-native');
});

test('accepted delivery protocols remain explicit while unknown study programs stay unresolved',()=>{
 const study=activationFor('probes/lazy-delivery-performance/campaign.mjs');
 assert.equal(study.tier,'lazy-delivery-study');assert.equal(study.currentLibrary,false);assert(study.requiredInputs.length);assert.equal(study.protocol,'probes/lazy-delivery-performance/README.md');
 assert.equal(activationFor('probes/lazy-delivery-families/prepare-performance.mjs').tier,'historical-reproduction');
 assert.equal(activationFor('probes/lazy-delivery-performance/unknown-campaign.mjs').tier,'current-library-correctness');
 assert.equal(activationFor('probes/lazy-delivery-performance/report.test.py').tier,'current-library-correctness');
});

test('accepted portable campaigns keep explicit protocols without activating unknown programs',()=>{
 for(const path of ['showcases/performance/campaign.mjs','showcases/performance/campaigns/report.mjs','showcases/performance/experiments/integrate-current-campaign.mjs','showcases/performance/experiments/integrate-calendar-campaign.mjs']){
  const activation=activationFor(path);assert.equal(activation.tier,'performance-campaign');assert.equal(activation.currentLibrary,false);assert.equal(activation.protocol,'showcases/performance/CAMPAIGNS.md');assert(activation.requiredInputs.length);
 }
 assert.equal(activationFor('showcases/performance/campaigns/unknown-campaign.mjs').tier,'native-lab');
});
