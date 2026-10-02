import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkboxConsumer} from './consumer-source.mjs';
import {digestJson} from '../evidence/identity.ts';

async function bundle() {
  const read = async name => JSON.parse(await readFile(new URL(`../../packages/elements/${name}.json`, import.meta.url), 'utf8'));
  return {manifest:await read('custom-elements'), graph:await read('public-api'), types:await read('public-types')};
}
test('discovery retrieves a public checkbox contract and generates only its described entries', async () => {
  const input=await bundle(), result=checkboxConsumer(input);
  assert(result.discovered.some(item=>item.tagName==='en-checkbox'));
  assert.equal(result.retrieved.classImport,'@en-reve/elements/checkbox.js');
  assert.equal(result.retrieved.definitionImport,'@en-reve/elements/define/checkbox.js');
  assert.equal(result.retrieved.checkedAttribute.fieldName,'defaultChecked');
  assert.match(result.source,/type Change = import\('@en-reve\/primitives\/interactions\/events.js'\).ChangeEvent<boolean>/);
  assert.doesNotMatch(result.source,/\/src\/|catalog|index\.js/);
});
for (const [name, mutate, message] of [
  ['unknown schema', b=>{b.manifest.schemaVersion='99';}, /Unsupported CEM/],
  ['stale CEM', b=>{b.manifest.modules.pop();}, /Graph\/CEM identity/],
  ['stale types', b=>{b.types.packageName='wrong';}, /Graph\/type identity/],
  ['missing discovery result', b=>{for(const m of b.manifest.modules) m.declarations=m.declarations?.filter(d=>d.tagName!=='en-checkbox');b.graph.manifestDigest=digestJson(b.manifest);}, /not discoverable/],
  ['wrong writable type', b=>{b.graph.components.find(c=>c.tagName==='en-checkbox').members.find(m=>m.name==='checked').type.text='string';}, /graph writable checked/],
  ['wrong reset mapping', b=>{const d=b.manifest.modules.flatMap(m=>m.declarations??[]).find(d=>d.tagName==='en-checkbox');d.attributes.find(a=>a.name==='checked').fieldName='checked';b.graph.components.find(c=>c.tagName==='en-checkbox').attributes=d.attributes;b.graph.manifestDigest=digestJson(b.manifest);}, /reset default/],
  ['missing description slot', b=>{b.graph.components.find(c=>c.tagName==='en-checkbox').slots=[];}, /Expected values/],
  ['wrong event timing', b=>{b.graph.components.find(c=>c.tagName==='en-checkbox').events[0].behavior.phase='notification';}, /Expected values/],
  ['uncancelable event', b=>{b.graph.components.find(c=>c.tagName==='en-checkbox').events[0].behavior.cancelable=false;}, /cancelable/],
  ['private import', b=>{b.graph.components.find(c=>c.tagName==='en-checkbox').classImport='@en-reve/elements/internal/checkbox.js';}, /did not match/],
]) test(`consumer generation rejects ${name}`,async()=>{const input=await bundle();mutate(input);assert.throws(()=>checkboxConsumer(input),message);});
