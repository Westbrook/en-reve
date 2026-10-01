import test from 'node:test';
import assert from 'node:assert/strict';
await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
const {datePickerDefinition}=await import('../../../dist/definitions/date-picker.js');
const {datePickerShellDefinition}=await import('../../../dist/date-picker-shell.js');
const {loadDatePickerCalendar}=await import('../../../dist/internal/date-picker-feature.js');
const {collectDefinitions}=await import('@en-reve/primitives/interactions/registration.js');
test('shell preserves constructor identity and the canonical hard closure',async()=>{
 assert.equal(datePickerShellDefinition.elementClass,datePickerDefinition.elementClass);
 assert.deepEqual(collectDefinitions([datePickerShellDefinition]).map(x=>x.tagName).sort(),['en-button','en-date-picker','en-dialog','en-icon']);
 assert.deepEqual(collectDefinitions([datePickerDefinition]).map(x=>x.tagName).sort(),['en-button','en-calendar','en-date-picker','en-dialog','en-icon']);
 assert.equal((await loadDatePickerCalendar())[0],datePickerDefinition.dependencies[0]);
 assert.equal(customElements.get('en-date-picker'),undefined);
});
test('deferred range combinations fail in both assignment orders',()=>{
 const Picker=datePickerDefinition.elementClass;
 const one=new Picker();one.calendarLoading='deferred';assert.throws(()=>one.selection='range',RangeError);assert.equal(one.selection,'single');
 const two=new Picker();two.selection='range';assert.throws(()=>two.calendarLoading='deferred',RangeError);assert.equal(two.calendarLoading,'eager');
});
