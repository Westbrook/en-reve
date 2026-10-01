import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readEventContracts} from './event-contracts.ts';
const source='src/main.ts',rootRow={source,className:'Leaf'};
const event={...rootRow,name:'en-action',type:'CustomEvent<{action:"go";data:number}>',detail:'{ action: "go"; data: number; }',composition:{version:1}};
async function fixture(code:string,run:(root:string)=>unknown) {
 const root=await mkdtemp(join(tmpdir(),'cem-effective-events-'));
 try{await mkdir(join(root,'src'));await writeFile(join(root,source),code);await run(root);}finally{await rm(root,{recursive:true,force:true});}
}
const code=(value:string)=>`declare function dispatchAction(target:EventTarget,detail:unknown):void;
/** @tag x-leaf */export class Leaf extends EventTarget{send(){dispatchAction(this,{action:'go',data:${value}});}}`;

test('effective reader supplies inherited contracts to direct public-root dispatch validation',async()=>fixture(code('42'),async root=>{
 await assert.rejects(()=>readEventContracts(root,[source]),/Unclassified emitted event/);
 const contracts=await readEventContracts(root,[source],false,{roots:[rootRow],contracts:[event]});
 assert.deepEqual(contracts,[event]);
}));

test('effective reader rejects a mismatched inherited dispatch payload with the existing strict check',async()=>fixture(code("'wrong'"),async root=>{
 await assert.rejects(()=>readEventContracts(root,[source],false,{roots:[rootRow],contracts:[event]}),/Emitted payload disagrees/);
}));

test('effective reader rejects a payload-detail receipt that disagrees with the final checked event type',async()=>fixture(code('42'),async root=>{
 await assert.rejects(()=>readEventContracts(root,[source],false,{roots:[rootRow],contracts:[{...event,detail:'string'}]}),/detail disagrees/);
}));

test('effective reader replaces root templates including zero surviving events while ordinary owners remain unchanged',async()=>fixture(
 `/** @fires {CustomEvent<string>} own */export class Leaf{}
/** @fires {CustomEvent<number>} ordinary */export class Other{}`,async root=>{
 const original=await readEventContracts(root,[source]);assert.equal(original.length,2);
 assert.deepEqual(await readEventContracts(root,[source],false,{roots:[],contracts:[]}),original);
 const effective=await readEventContracts(root,[source],false,{roots:[rootRow],contracts:[]});assert.deepEqual(effective,original.filter((row:any)=>row.className==='Other'));
}));

test('effective reader rejects duplicate unselected missing and internally classified roots or events',async()=>fixture(
 '/** @internalEvent en-action */export class Leaf{}',async root=>{
 const packets=[{roots:[rootRow,rootRow],contracts:[]},{roots:[{source:'src/other.ts',className:'Leaf'}],contracts:[]},
  {roots:[{source,className:'Missing'}],contracts:[]},{roots:[rootRow],contracts:[event,event]},{roots:[],contracts:[event]},
  {roots:[rootRow],contracts:[event]}];
 for(const packet of packets)await assert.rejects(()=>readEventContracts(root,[source],false,packet),/duplicated|unselected|unique declared root|exact selected class|internally classified/);
}));


test('effective reader includes a registered untagged zero-event root and rejects unclassified direct dispatch',async()=>fixture(
 code('42').replace('/** @tag x-leaf */',''),async root=>{
  // Ordinary legacy scanning has no class tag; the fresh final CEM registration
  // makes this composed root public even without a source @tag annotation.
  assert.deepEqual(await readEventContracts(root,[source]),[]);
  await assert.rejects(()=>readEventContracts(root,[source],false,{roots:[{...rootRow,public:true}],contracts:[]}),/Unclassified emitted event/);
}));
