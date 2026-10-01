import assert from 'node:assert/strict';
import test from 'node:test';
import { dateRange, validateRange } from '../../../dist/internal/date-range.js';
const options={calendar:'gregory',locale:'en',min:'',max:'',step:1,stepBase:'1970-01-01'};
test('range pairs normalize earlier endpoints, preserve partial and same-day values, and freeze snapshots',()=>{
 assert.deepEqual(dateRange({start:'2026-09-20',end:'2026-09-18'}),{start:'2026-09-18',end:'2026-09-20'});
 assert.ok(Object.isFrozen(dateRange({start:'2026-09-18',end:''})));
 assert.deepEqual(dateRange({start:'',end:'2026-09-18'}),{start:'',end:'2026-09-18'});
 assert.equal(dateRange({start:'2026-02-30',end:''}),undefined);
 assert.equal(validateRange({start:'2026-09-18',end:'2026-09-18'},options),'');
});
test('whole interval validation catches interiors, bounds, step and calendar boundaries',()=>{
 const range={start:'2026-09-20',end:'2026-09-24'};
 assert.match(validateRange(range,{...options,unavailableDate:value=>value==='2026-09-22'}),/2026-09-22/);
 assert.match(validateRange(range,{...options,min:'2026-09-21'}),/within/);
 assert.match(validateRange(range,{...options,step:2}),/step/);
 assert.match(validateRange({start:'1940-12-31',end:'1941-01-02'},{...options,calendar:'buddhist'}),/1941/);
 for(const calendar of ['gregory','buddhist'])assert.equal(validateRange({start:'2024-02-28',end:'2024-03-01'},{...options,calendar}),'');
 assert.match(validateRange({start:'2026-09-20',end:''},options),/both/);
});
test('predicate work is bounded without limiting plain ISO ranges',()=>{
 const range={start:'0001-01-01',end:'9999-12-31'};let calls=0;
 assert.equal(validateRange(range,options),'');
 assert.match(validateRange(range,{...options,unavailableDate:()=>{calls++;return false;}}),/36,600/);
 assert.equal(calls,0);
});
