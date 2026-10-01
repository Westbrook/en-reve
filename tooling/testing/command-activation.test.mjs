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
