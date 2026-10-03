import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hashValue} from '@en-reve/tokens';
import {renderingIdentity,reviewIdentity,digestBytes} from '../evidence/identity.ts';
import {createPlan} from './plan.mjs';
import {fixture} from './test-fixture.mjs';
import {encodeVisualBundle,readVisualBundle,MAX_VISUAL_BUNDLE_BYTES} from './reader.mjs';
import {partitionVisualEvidence,packageVisualEvidenceParts,verifyVisualEvidenceParts} from './package-parts.mjs';
const seal=value=>{const {integrity,...body}=value;return {...body,integrity:hashValue(body)};};
async function collect(iterator){const parts=[];for await(const part of iterator)parts.push(part);return parts;}
function matrix(){
 const x=fixture(),r=x.report;
 r.scope.cases.push({...r.scope.cases[0],state:'failed'},{...r.scope.cases[0],state:'unsupported',unsupported:'Native platform control.'});
 r.scope.selected.push('buttons:failed','buttons:unsupported');
 r.scope.engines.push('webkit');r.environments.webkit={engine:'webkit',version:'synthetic'};
 r.scope.viewports.push({id:'mobile',width:390,height:844});
 const plan=createPlan(x.build,{appearances:['light']},{appearances:['light']},{cases:r.scope.cases,selected:r.scope.selected,engines:r.scope.engines,viewports:r.scope.viewports});
 const original=r.results[0];
 r.results=plan.rows.map(row=>{
  const {selected,...base}=row;
  if(row.fixture.state==='default'){
   const captures=structuredClone(original.captures);
   for(const capture of Object.values(captures))capture.identity=renderingIdentity({...capture.identity.inputs,viewport:row.viewport,environment:r.environments[row.engine]});
   return {...base,status:'passed',captures,comparison:original.comparison};
  }
  return {...base,status:row.fixture.state==='failed'?'failed':row.status,reason:row.fixture.state==='failed'?'Synthetic capture failure.':row.reason};
 });
 // Keep an unreferenced image and an identity receipt: packaging cannot silently discard either.
 for(const [bytes,mediaType] of [[Buffer.concat([x.files.get(x.image.path),Buffer.from('extra')]),'image/png'],[Buffer.from('{"inventory":"synthetic"}'),'application/json']]){
  const digest=digestBytes(bytes),path='artifacts/'+digest.slice(7)+(mediaType==='image/png'?'.png':'.json');r.artifacts.push({digest,path,mediaType,label:'Additional provenance'});x.files.set(path,bytes);
 }
 r.reviewIdentity=reviewIdentity({candidate:r.candidate.envelopeIntegrity,baseline:r.baseline.envelopeIntegrity,scope:r.scope,evidence:[original.comparison.identity.digest]});
 x.report=seal(r);return x;
}
async function splitLimit(x){const [whole]=await collect(partitionVisualEvidence(x.report,x.files,x.build));return Buffer.byteLength(encodeVisualBundle(whole.report,whole.files))-1;}
async function source(t,x){
 const root=await mkdtemp(join(tmpdir(),'en-visual-parts-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const directory=join(root,'capture'),output=join(root,'parts');await mkdir(join(directory,'artifacts'),{recursive:true});
 await writeFile(join(directory,'evidence.json'),JSON.stringify(x.report,null,2)+'\n');
 for(const [path,bytes] of x.files)await writeFile(join(directory,path),bytes);
 return {root,directory,output};
}
async function rewriteIndex(output,mutate){const path=join(output,'index.json'),index=JSON.parse(await readFile(path));mutate(index);await writeFile(path,JSON.stringify(seal(index)));}

test('partitions preserve all rows, environments, failures and bytes with explicit subset identities',async()=>{
 const x=matrix(),before=JSON.stringify(x.report),maxBytes=await splitLimit(x);
 const parts=await collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes}));assert(parts.length>1);
 const seen=new Map(),artifacts=new Map();
 for(const part of parts){
  const text=encodeVisualBundle(part.report,part.files);assert(Buffer.byteLength(text)<=maxBytes);
  const loaded=await readVisualBundle(text,x.build);assert.equal(loaded.missing.length,0);
  assert.notEqual(part.report.reviewIdentity.digest,x.report.reviewIdentity.digest);
  for(const key of part.report.scope.cases.map(c=>c.id+':'+c.state))assert.equal(part.report.results.filter(r=>r.fixture.id+':'+r.fixture.state===key).length,4);
  for(const row of part.report.results){assert(!seen.has(row.key));seen.set(row.key,row);}
  for(const [path,bytes] of part.files){assert.deepEqual(bytes,x.files.get(path));artifacts.set(path,bytes);}
 }
 assert.equal(seen.size,16);for(const row of x.report.results)assert.deepEqual(seen.get(row.key),row);
 assert.deepEqual(new Set(artifacts.keys()),new Set(x.files.keys()));assert.equal(JSON.stringify(x.report),before);
 assert.deepEqual(new Set([...seen.values()].map(r=>r.status)),new Set(['passed','not-run','failed','unsupported']));
 const repeat=await collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes}));assert.deepEqual(parts.map(p=>p.report),repeat.map(p=>p.report));
});

test('written index verifies exact parent coverage and retains the original manifest bytes',async t=>{
 const x=matrix(),paths=await source(t,x),maxBytes=await splitLimit(x);
 const index=await packageVisualEvidenceParts(paths.directory,x.build,paths.output,{maxBytes});
 const verified=await verifyVisualEvidenceParts(paths.output,x.build);assert.equal(verified.rows,16);assert.equal(verified.artifacts,x.files.size);
 assert.deepEqual(await readFile(join(paths.output,'parent-evidence.json')),await readFile(join(paths.directory,'evidence.json')));
 assert.equal(index.manualAcceptance,'not-run');
 await assert.rejects(packageVisualEvidenceParts(paths.directory,x.build,paths.output),/EEXIST/);
 await verifyVisualEvidenceParts(paths.output,x.build);
});

test('an oversize case fails atomically; size limits and missing artifacts cannot be bypassed',async t=>{
 const x=matrix(),paths=await source(t,x);
 await assert.rejects(packageVisualEvidenceParts(paths.directory,x.build,paths.output,{maxBytes:100}),/exceed the part limit/);
 await assert.rejects(access(paths.output),/ENOENT/);
 for(const maxBytes of [0,-1,NaN,1.5,MAX_VISUAL_BUNDLE_BYTES+1])await assert.rejects(collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes})),/Part size/);
 x.files.delete(x.image.path);await assert.rejects(collect(partitionVisualEvidence(x.report,x.files,x.build)),/missing artifacts/);
});

test('producer-level failure stays visible even in parts whose pixels match',async()=>{
 const x=matrix();x.report=seal({...x.report,status:'failed'});
 const parts=await collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes:await splitLimit(x)}));
 assert(parts.every(p=>p.report.status==='failed'));assert(parts.every(p=>p.report.manualAcceptance==='not-run'));
});

test('sealed indexes cannot omit, duplicate, rename or misdescribe valid parts',async t=>{
 const mutations=[i=>i.parts.pop(),i=>i.parts.push(i.parts[0]),i=>i.parts.reverse(),i=>i.parts[0].path='../elsewhere.json',i=>i.parts[0].rows.pop(),i=>i.parts[0].cases.pop(),i=>i.maxBytes=1,i=>i.manualAcceptance='passed'];
 for(const mutate of mutations){
  const x=matrix(),paths=await source(t,x);await packageVisualEvidenceParts(paths.directory,x.build,paths.output,{maxBytes:await splitLimit(x)});
  await rewriteIndex(paths.output,mutate);await assert.rejects(verifyVisualEvidenceParts(paths.output,x.build));
 }
});

test('changed parent, changed bundle, extra files and wrong builds fail verification',async t=>{
 for(const kind of ['parent','bundle','extra','build']){
  const x=matrix(),paths=await source(t,x),index=await packageVisualEvidenceParts(paths.directory,x.build,paths.output);
  if(kind==='parent')await writeFile(join(paths.output,'parent-evidence.json'),'{}');
  if(kind==='bundle')await writeFile(join(paths.output,index.parts[0].path),'{}');
  if(kind==='extra')await writeFile(join(paths.output,'unindexed.json'),'{}');
  await assert.rejects(verifyVisualEvidenceParts(paths.output,kind==='build'?{...x.build,fingerprint:'other'}:x.build));
 }
});

test('self-resealed valid subsets cannot change a row or hide original unused artifacts',async t=>{
 for(const kind of ['reason','artifact']){
  const x=matrix(),paths=await source(t,x),index=await packageVisualEvidenceParts(paths.directory,x.build,paths.output);
  const path=join(paths.output,index.parts[0].path),bundle=JSON.parse(await readFile(path));
  if(kind==='reason')bundle.report.results.find(r=>r.status==='failed').reason='Replacement explanation';
  else {const a=bundle.report.artifacts.find(a=>a.label==='Additional provenance'&&a.mediaType==='image/png');bundle.report.artifacts=bundle.report.artifacts.filter(v=>v!==a);bundle.files=bundle.files.filter(v=>v.path!==a.path);}
  bundle.report=seal(bundle.report);const text=JSON.stringify(bundle);await readVisualBundle(text,x.build);await writeFile(path,text);
  await rewriteIndex(paths.output,i=>Object.assign(i.parts[0],{bytes:Buffer.byteLength(text),digest:digestBytes(text),integrity:bundle.report.integrity}));
  await assert.rejects(verifyVisualEvidenceParts(paths.output,x.build),/changes original evidence/);
 }
});

test('the byte cap is exact, including UTF-8 manifest text and base64 overhead',async()=>{
 const x=fixture();x.report=seal({...x.report,run:'Résumé 🎨'});
 const [whole]=await collect(partitionVisualEvidence(x.report,x.files,x.build));
 const exact=Buffer.byteLength(encodeVisualBundle(whole.report,whole.files));
 const equal=await collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes:exact}));assert.equal(equal.length,1);
 const smaller=await collect(partitionVisualEvidence(x.report,x.files,x.build,{maxBytes:exact-1}));assert.equal(smaller.length,2);
 assert(smaller.every(p=>Buffer.byteLength(encodeVisualBundle(p.report,p.files))<=exact-1));
});
