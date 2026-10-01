// Retain the acquisition, exact harnesses, source packages and analysis used by the main refresh.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {root,sha,json} from '../src/config.mjs';
const out=resolve(root,'reports/en-reve-main'),destination=resolve(out,'evidence');
const execution=JSON.parse(await readFile(resolve(out,'execution.json')));
if(!execution.finishedAt || execution.campaigns.some(c=>!c.complete))throw Error('Acquisition incomplete');
await mkdir(destination,{recursive:true});
const receipt={archivedAt:new Date().toISOString(),format:'Individually gzipped evidence with raw and compressed SHA256; failed observations retained.',campaigns:[],files:[]};
async function file(path,name,list=receipt.files){const bytes=await readFile(path),encoded=gzipSync(bytes,{level:9});if(sha(gunzipSync(encoded))!==sha(bytes))throw Error('Invalid archive');const target=resolve(destination,name+'.gz');await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,encoded);list.push({source:relative(root,path),path:relative(destination,target),rawBytes:bytes.length,archiveBytes:encoded.length,sourceSha256:sha(bytes),archiveSha256:sha(encoded)});}
async function tree(path,name,list=receipt.files){for(const e of await readdir(path,{withFileTypes:true})){if(e.isDirectory())await tree(resolve(path,e.name),name+'/'+e.name,list);else if(e.isFile())await file(resolve(path,e.name),name+'/'+e.name,list);}}
for(const name of (await readdir(resolve(root,'runs'))).filter(n=>n.startsWith('en-reve-main-'))){const row={id:name,files:[]};await tree(resolve(root,'runs',name),name,row.files);receipt.campaigns.push(row);}
const inventory=JSON.parse(await readFile(resolve(out,'inventory.json')));
for(const id of ['en-reve','fluent-web-components','web-awesome']) await tree(resolve(root,'.cache/snapshots',id),'measured-artifacts/'+id);
for(const [name,hash] of Object.entries(inventory.systems.find(s=>s.id==='en-reve').sourceHashes)){const path=resolve(root,'..',name);if(sha(await readFile(path))!==hash)throw Error('Qualified source changed: '+name);await file(path,'qualified-source/'+name);}
await tree(resolve(out,'prior-fixture'),'prior-fixture');
for(const name of await readdir(out)) if(name!=='archive.log' && /\.(json|md|log|patch)$/.test(name)) await file(resolve(out,name),'analysis/'+name);
for(const name of await readdir(resolve(root,'experiments')))if(name.includes('en-reve-main')||['web-awesome-metric-groups.mjs','pass2-metrics.mjs','dom-census.mjs','dom-ownership.mjs','run-dom-review.mjs','run-dom-ownership.mjs'].includes(name))await file(resolve(root,'experiments',name),'analysis-source/'+name);
for(const name of ['native-showcase-performance-results.md','native-showcase-en-reve-main-results.md','native-showcase-dom-review.md','native-showcase-web-awesome-results.md','native-showcase-spectrum-gen2-results.md'])await file(resolve(root,'../../plans',name),'report/'+name);
await file(resolve(root,'../verification-en-reve-main.json'),'qualification/verification-en-reve-main.json');
await tree(resolve(root,'../artifacts/en-reve-main'),'qualification/standalone');
await file(resolve(root,'reports/functional-en-reve.json'),'qualification/functional-en-reve.json');
try { await tree(resolve(out,'reader'),'reader'); } catch(error) { if(error.code!=='ENOENT')throw error; receipt.readerVerification='Pending reader verification; raw acquisition retained.'; }
await file(resolve(root,'../performance-results/scripts/verify-en-reve-main.mjs'),'reader/verify-en-reve-main.mjs');
await writeFile(resolve(destination,'receipt.json'),json(receipt));console.log('Archived',receipt.campaigns.length,'runs and',receipt.files.length,'source/artifact files');
