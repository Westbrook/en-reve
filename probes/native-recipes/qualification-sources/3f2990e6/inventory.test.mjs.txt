import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const inventory=JSON.parse(await read('probes/reusable-layers/inventory.json'));
test('inventory names every wildcard primitive and explicit style export without hiding gaps',async()=>{
 const entries=[];
 for(const family of ['state','templates','interactions'])for(const file of await readdir(new URL('packages/primitives/src/'+family+'/',root)))if(file.endsWith('.ts'))entries.push('@en-reve/primitives/'+family+'/'+file.replace(/\.ts$/,'.js'));
 for(const key of Object.keys(JSON.parse(await read('packages/styles/package.json')).exports))if(key!=='./package.json')entries.push('@en-reve/styles'+(key==='.'?'':'/'+key.slice(2)));
 assert.deepEqual(inventory.entries.map(row=>row.entry).sort(),entries.sort());
 assert.equal(new Set(entries).size,entries.length);
 assert(inventory.entries.every(row=>['pending','qualified-scenarios'].includes(row.qualification)));
 for(const row of inventory.entries.filter(row=>row.qualification==='qualified-scenarios'))assert(row.composition&&row.contract&&row.receipt);
 for(const row of inventory.entries.filter(row=>row.delivery==='css'&&row.qualification==='qualified-scenarios'))assert.equal(row.receipt,'probes/native-recipes/verification-20261002.json');
});
test('compositions use only public imports and inventory links each exercised entry',async()=>{
 for(const [id,path] of [['core','packages/primitives/tests/browser/fixture.ts'],['recipes','probes/reusable-layers/recipes.ts'],['content','packages/primitives/tests/content/fixture-template.ts'],['navigation','packages/primitives/tests/navigation/fixture-template.ts'],['navigation','packages/primitives/tests/navigation/fixture.ts']]){
  const source=await read(path),imports=[...source.matchAll(/from ['"](@en-reve\/[^'"]+)['"]/g)].map(match=>match[1]);
  assert(imports.length>0);assert(!source.includes('/dist/')&&!source.includes('/src/'));
  for(const entry of imports){const row=inventory.entries.find(row=>row.entry===entry);assert(row,entry);assert(row.composition===id || entry==='@en-reve/primitives/interactions/signal-controller.js',entry);}
 }
});
