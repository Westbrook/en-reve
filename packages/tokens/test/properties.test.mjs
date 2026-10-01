import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveTheme, emitPropertyRegistrations, createPropertyRegistrationPlan, customizationContracts, managedEditors } from '../dist/index.js';

const theme = resolveTheme();
const error = code => value => value.code === code;
test('compatible registrations preserve every public contract without an initial value', () => {
  const contracts = customizationContracts(theme);
  const plan = createPropertyRegistrationPlan(theme);
  assert.equal(plan.registrations.length,contracts.length);
  assert.deepEqual(plan.registrations.map(p=>p.name),contracts.map(c=>c.cssName).sort());
  assert.ok(plan.registrations.every(p=>p.syntax === '*' && p.inherits && p.initialValue === undefined));
  const css = emitPropertyRegistrations(theme);
  assert.equal((css.match(/@property /g) ?? []).length,contracts.length);
  assert.doesNotMatch(css,/initial-value:/);
  assert.ok(Object.isFrozen(plan.registrations));
});
test('typed mode is explicit, deterministic across themes, and preserves optional fallback hooks', () => {
  const plan = createPropertyRegistrationPlan(theme,{mode:'typed'});
  const another = createPropertyRegistrationPlan(resolveTheme({mode:'dark',density:'compact',pins:{'color.action':{colorSpace:'srgb',components:[1,0,0]},'duration.fast':{value:500,unit:'ms'}}}),{mode:'typed'});
  assert.deepEqual(plan,another);
  assert.ok(plan.registrations.some(p=>p.syntax === '<color>' && p.policy === 'typed'));
  for (const name of ['--en-button-radius','--en-validation-summary-radius','--en-font-ui-size']) {
    const property = plan.registrations.find(p=>p.name===name);
    assert.equal(property.syntax,'*');assert.equal(property.initialValue,undefined);
  }
});
test('name selection, application contracts and exclusions are explicit and stable', () => {
  const plan = createPropertyRegistrationPlan(theme,{names:['--en-button-radius','--en-color-text'],definitions:{'--en-button-radius':false,'--app-progress':{syntax:'<number>',inherits:false,initialValue:'0'}}});
  assert.deepEqual(plan.registrations.map(p=>p.name),['--app-progress','--en-color-text']);
  assert.deepEqual(plan.exclusions,[{name:'--en-button-radius',reason:'Explicitly excluded from registration.'}]);
  assert.equal(plan.registrations[0].policy,'explicit');
  const strict=emitPropertyRegistrations(theme,{names:[],definitions:{'--app-safe':{syntax:'*',inherits:true,name:'--bad}body{',initialValue:undefined}}});
  assert.match(strict,/@property --app-safe/);assert.doesNotMatch(strict,/--bad/);
  assert.throws(()=>createPropertyRegistrationPlan(theme,{names:['--misspelled']}),error('unknown-customization-property'));
});
test('invalid, dependent and declaration-injecting registrations fail before CSS emission', () => {
  const bad = [
    {syntax:'<length>',inherits:true},
    {syntax:'<length>',inherits:true,initialValue:'1rem'},
    {syntax:'<number>',inherits:true,initialValue:'var(--value)'},
    {syntax:'<number>',inherits:true,initialValue:'1; } body { display:none'},
    {syntax:'<number>',inherits:'false',initialValue:'0'},
    {syntax:'<number>',inherits:true,initialValue:'1e999'},
    {syntax:'<length>',inherits:true,initialValue:'red'},
    {syntax:'<color>',inherits:true,initialValue:'rgb(0 0)'},
    {syntax:'<color>',inherits:true,initialValue:'rgb(0 0 0 /)'},
    {syntax:'<color>',inherits:true,initialValue:'light-dark(white, black)'},
    {syntax:'*',inherits:true,initialValue:'inherit'},
    {syntax:'<not-supported>',inherits:true,initialValue:'0'},
  ];
  for(const definition of bad) assert.throws(()=>emitPropertyRegistrations(theme,{names:[],definitions:{'--app-value':definition}}),error('invalid-property-registration'));
  assert.throws(()=>emitPropertyRegistrations(theme,{names:[],definitions:{'--x}body{':{syntax:'*',inherits:true}}}),error('invalid-property-registration'));
});
test('supported explicit types cover numeric, color and independent geometry controls', () => {
  const cases=[['<number>','0.3'],['<integer>','4'],['<percentage>','50%'],['<length>','10px'],['<length-percentage>','25%'],['<angle>','180deg'],['<time>','120ms'],['<color>','#abc'],['<color>','rgb(20 30 40 / .4)'],['<color>','color(display-p3 1 .2 .1 / .5)'],['<color>','hsl(20deg 50% 30%)']];
  for(const [syntax,initialValue] of cases) assert.match(emitPropertyRegistrations(theme,{names:[],definitions:{'--app-value':{syntax,inherits:true,initialValue}}}),/initial-value:/);
});
test('generated artifacts and managed editor links use the same customization contracts', async () => {
  const inventory=JSON.parse(await readFile(new URL('../dist/customization.json',import.meta.url),'utf8'));
  const css=await readFile(new URL('../dist/default.css',import.meta.url),'utf8');
  assert.deepEqual(inventory.contracts,customizationContracts(theme));
  assert.ok(css.includes('@property --en-validation-summary-radius'));
  const editors=managedEditors(theme);
  for(const contract of inventory.contracts.filter(c=>c.managed.supported)) assert.equal(editors[contract.tokenId].cssName,contract.cssName);
});
