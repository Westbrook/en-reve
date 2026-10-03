import {mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {hashValue,stableStringify} from '@en-reve/tokens';
import {reviewIdentity,digestBytes} from '../evidence/identity.ts';
import {verifyVisualEvidence,encodeVisualBundle,readVisualBundle,MAX_VISUAL_BUNDLE_BYTES} from './reader.mjs';

const requireValue=(value,message)=>{if(!value)throw new Error(message);};
const same=(a,b)=>stableStringify(a)===stableStringify(b);
const seal=body=>({...body,integrity:hashValue(body)});
const caseKey=fixture=>fixture.id+':'+fixture.state;
const partName=index=>'part-'+String(index+1).padStart(4,'0')+'.json';
function rowPaths(row){return [...Object.values(row.captures??{}).map(c=>c.artifact.path),...(row.comparison?[row.comparison.artifact.path]:[]),...(row.captureFailure?[row.captureFailure.artifact.path]:[])];}
function partitionReport(parent,cases,ordinal){
 const keys=new Set(cases.map(caseKey));
 const scope={...parent.scope,cases,selected:parent.scope.selected.filter(key=>keys.has(key))};
 const results=parent.results.filter(row=>keys.has(caseKey(row.fixture)));
 // Preserve producer-level failure, even if a particular subset has matching pixels.
 const status=parent.status==='failed'?'failed':results.every(row=>row.status==='passed')?'passed':results.every(row=>['passed','different'].includes(row.status))?'different':'incomplete';
 const allReferenced=new Set(parent.results.flatMap(rowPaths));
 const paths=new Set(results.flatMap(rowPaths));
 // Original exports and identity inventories are retained byte-for-byte in every part.
 // Other unreferenced artifacts must not disappear; the first part retains them.
 const artifacts=parent.artifacts.filter(a=>a.mediaType==='application/json'||paths.has(a.path)||(ordinal===0&&!allReferenced.has(a.path)));
 const {integrity,reviewIdentity:oldReview,...body}=parent;
 return seal({...body,run:parent.run+'/part-'+String(ordinal+1).padStart(4,'0'),scope,results,artifacts,status,
  reviewIdentity:reviewIdentity({candidate:parent.candidate.envelopeIntegrity,baseline:parent.baseline.envelopeIntegrity,scope,evidence:[...new Set(results.flatMap(row=>row.comparison?[row.comparison.identity.digest]:[]))].sort()})});
}
function bundleSize(report,files){
 // Exact UTF-8 JSON size, without repeatedly allocating all base64 image strings.
 const base=Buffer.byteLength(JSON.stringify({schema:'en-reve/visual-review-bundle',schemaVersion:1,report,files:[]}));
 return base+report.artifacts.reduce((size,a,index)=>size+(index?1:0)+Buffer.byteLength(JSON.stringify({path:a.path,base64:''}))+4*Math.ceil(files.get(a.path).length/3),0);
}
function partFiles(report,files){return new Map(report.artifacts.map(a=>[a.path,files.get(a.path)]));}

/** Partition an immutable acquisition by authored case, retaining every environment row. */
export async function* partitionVisualEvidence(parent,files,build,{maxBytes=MAX_VISUAL_BUNDLE_BYTES}={}){
 requireValue(Number.isSafeInteger(maxBytes)&&maxBytes>0&&maxBytes<=MAX_VISUAL_BUNDLE_BYTES,'Part size must be between 1 byte and 128 MiB.');
 const verified=await verifyVisualEvidence(parent,files,build);
 requireValue(verified.missing.length===0,'Cannot package missing artifacts. Retain or restore the original acquisition files.');
 for(const bytes of files.values())requireValue(4*Math.ceil(bytes.length/3)<=48_000_000,'An individual artifact exceeds the reader limit; partitioning cannot reduce that artifact.');
 let cases=[],ordinal=0;
 for(const fixture of parent.scope.cases){
  const proposed=partitionReport(parent,[...cases,fixture],ordinal);
  if(bundleSize(proposed,files)>maxBytes&&cases.length){
   const report=partitionReport(parent,cases,ordinal++);yield {path:partName(ordinal-1),report,files:partFiles(report,files)};cases=[];
  }
  cases.push(fixture);
  requireValue(bundleSize(partitionReport(parent,cases,ordinal),files)<=maxBytes,'Case '+caseKey(fixture)+' and required shared artifacts exceed the part limit; no evidence was dropped.');
 }
 if(cases.length){const report=partitionReport(parent,cases,ordinal);yield {path:partName(ordinal),report,files:partFiles(report,files)};}
}

/** Write index last. Failure removes only the fresh directory created by this call. */
export async function packageVisualEvidenceParts(directory,build,output,options={}){
 const parentBytes=await readFile(resolve(directory,'evidence.json'));
 const parent=JSON.parse(parentBytes),files=new Map();
 for(const artifact of parent.artifacts){
  requireValue(/^artifacts\/[a-f0-9]{64}\.(png|json)$/.test(artifact.path),'Invalid artifact path.');
  files.set(artifact.path,new Uint8Array(await readFile(resolve(directory,artifact.path))));
 }
 await mkdir(output); // Existing outputs, including incomplete previous attempts, are never overwritten.
 try{
  const parts=[];
  for await(const part of partitionVisualEvidence(parent,files,build,options)){
   const text=encodeVisualBundle(part.report,part.files);
   const loaded=await readVisualBundle(text,build);
   requireValue(!loaded.missing.length,'A partition is missing an artifact.');
   await writeFile(resolve(output,part.path),text,{flag:'wx'});
   parts.push({path:part.path,bytes:Buffer.byteLength(text),digest:digestBytes(text),integrity:part.report.integrity,cases:part.report.scope.cases.map(caseKey),rows:part.report.results.map(row=>row.key)});
  }
  requireValue((await readFile(resolve(directory,'evidence.json'))).equals(parentBytes),'The acquisition manifest changed during packaging.');
  await writeFile(resolve(output,'parent-evidence.json'),parentBytes,{flag:'wx'});
  const index=seal({schema:'en-reve/visual-review-parts',schemaVersion:1,buildFingerprint:parent.buildFingerprint,
   parent:{path:'parent-evidence.json',digest:digestBytes(parentBytes),integrity:parent.integrity},
   maxBytes:options.maxBytes??MAX_VISUAL_BUNDLE_BYTES,parts,manualAcceptance:'not-run'});
  await writeFile(resolve(output,'index.json'),JSON.stringify(index,null,2)+'\n',{flag:'wx'});
  return index;
 }catch(error){await rm(output,{recursive:true,force:true});throw error;}
}

/** Verify complete coverage against the original parent, not just individually valid subsets. */
export async function verifyVisualEvidenceParts(directory,build){
 const index=JSON.parse(await readFile(resolve(directory,'index.json'),'utf8'));
 const {integrity,...body}=index;
 requireValue(index.schema==='en-reve/visual-review-parts'&&index.schemaVersion===1&&hashValue(body)===integrity,'Invalid partition index integrity.');
 requireValue(index.buildFingerprint===build.fingerprint&&index.manualAcceptance==='not-run','Partition index belongs to another build or claims approval.');
 requireValue(Number.isSafeInteger(index.maxBytes)&&index.maxBytes>0&&index.maxBytes<=MAX_VISUAL_BUNDLE_BYTES,'Invalid partition size limit.');
 requireValue(index.parent?.path==='parent-evidence.json'&&Array.isArray(index.parts)&&index.parts.length>0&&index.parts.length<=5000,'Invalid partition inventory.');
 const parentBytes=await readFile(resolve(directory,index.parent.path)),parent=JSON.parse(parentBytes);
 requireValue(digestBytes(parentBytes)===index.parent.digest&&parent.integrity===index.parent.integrity,'Original parent manifest changed.');
 const files=new Map(),seenCases=[],seenRows=new Set();
 for(const [ordinal,entry] of index.parts.entries()){
  requireValue(entry.path===partName(ordinal),'Invalid partition path or order.');
  const bytes=await readFile(resolve(directory,entry.path));
  requireValue(bytes.length===entry.bytes&&bytes.length<=index.maxBytes&&digestBytes(bytes)===entry.digest,'Partition bytes changed or exceed the limit.');
  const loaded=await readVisualBundle(bytes.toString('utf8'),build);
  requireValue(!loaded.missing.length&&loaded.report.integrity===entry.integrity,'Incomplete or changed partition.');
  const keys=loaded.report.scope.cases.map(caseKey);
  requireValue(same(keys,entry.cases)&&same(loaded.report.results.map(row=>row.key),entry.rows),'Partition index does not match its cases or rows.');
  const expected=parent.scope.cases.slice(seenCases.length,seenCases.length+keys.length);
  requireValue(same(keys,expected.map(caseKey))&&same(loaded.report,partitionReport(parent,expected,ordinal)),'Partition changes original evidence or case order.');
  seenCases.push(...keys);
  for(const row of loaded.report.results){requireValue(!seenRows.has(row.key),'Duplicate result across partitions.');seenRows.add(row.key);}
  for(const [path,data] of loaded.files)files.set(path,data);
 }
 requireValue(same(seenCases,parent.scope.cases.map(caseKey))&&seenRows.size===parent.results.length&&parent.results.every(row=>seenRows.has(row.key)),'Partition set omits original cases or result rows.');
 requireValue(same([...files.keys()].sort(),parent.artifacts.map(a=>a.path).sort()),'Partition set omits original artifacts.');
 const verified=await verifyVisualEvidence(parent,files,build);
 requireValue(!verified.missing.length,'Original acquisition artifacts are missing.');
 const names=await readdir(directory);
 requireValue(same(names.sort(),['index.json','parent-evidence.json',...index.parts.map(p=>p.path)].sort()),'Partition directory contains unindexed files.');
 return {index,parent,rows:seenRows.size,artifacts:files.size};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [mode,directory,buildFile,output]=process.argv.slice(2);
 requireValue(['create','verify'].includes(mode)&&directory&&buildFile&&(mode==='verify'?!output:output),'Usage: node tooling/visual-review/package-parts.mjs create <capture-directory> <review-build.json> <new-parts-directory> | verify <parts-directory> <review-build.json>');
 const build=JSON.parse(await readFile(buildFile,'utf8'));
 if(mode==='create'){const index=await packageVisualEvidenceParts(directory,build,output);console.log('Wrote '+index.parts.length+' review parts to '+resolve(output));}
 else {const result=await verifyVisualEvidenceParts(directory,build);console.log('Verified '+result.index.parts.length+' parts, '+result.rows+' original rows and '+result.artifacts+' artifacts. Human acceptance remains separate.');}
}
