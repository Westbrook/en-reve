import {execute} from '../campaigns/execute.mjs';
import {calendarContext} from '../campaigns/config.mjs';
const campaignContext=calendarContext();
const campaignOutput=campaignContext?.directory;
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root,showcases,json,sha} from '../src/config.mjs';
import {assetManifest} from '../src/prepare.mjs';
import {isolation} from '../../tools/isolation-plugin.mjs';
const inventory=JSON.parse(await readFile(resolve(root,'.cache/inventory.json')));
let reference=inventory.systems.find(s=>s.id==='en-reve'),project=resolve(showcases,'en-reve'),referenceDirectory=resolve(root,'.cache/snapshots/en-reve');
const out=campaignOutput || resolve(root,'reports/calendar-variants');await mkdir(out,{recursive:true});
const referenceCampaign=campaignContext?.config.referenceCampaign;
if(referenceCampaign){
 const source=resolve(root,'reports/campaigns',referenceCampaign),state=JSON.parse(await readFile(resolve(source,'state.json'))),configuration=JSON.parse(await readFile(resolve(source,'campaign.json')));
 assert.equal(state.status,'complete','Reference source campaign must be complete');assert.equal(configuration.config.kind,'current');
 const builds=JSON.parse(await readFile(resolve(source,'builds.json')));assert.equal(builds.variants.length,1);reference=builds.variants[0];referenceDirectory=resolve(root,'.cache/variants',reference.id);
 const inputs=JSON.parse(await readFile(resolve(source,'consumer-inputs.json')));
 for(const [path,digest] of Object.entries(inputs)){assert(!path.startsWith('/')&&!path.split('/').includes('..'));assert.equal(sha(await readFile(resolve(source,path))),digest,'Archived consumer input changed: '+path);}
 project=resolve(out,'source/en-reve');await cp(resolve(source,'consumer'),project,{recursive:true});
 for(const name of ['shared','tools'])await cp(resolve(source,name),resolve(out,'source',name),{recursive:true});
 assert.equal(sha(await readFile(resolve(project,'package-lock.json'))),reference.lockfileSha256);
 await execute('npm',['ci','--workspaces=false','--no-audit','--no-fund'],{cwd:project});
}
const {build}=await import(pathToFileURL(resolve(project,'node_modules/vite/dist/node/index.js')));
const specs=[['calendar-eager','Eager reference'],['calendar-deferred','Deferred construction'],['calendar-split','Deferred code + construction']];
const original=await readFile(resolve(project,'src/main.js'),'utf8');
const inputs={};for(const path of ['src/main.js','src/template.ts','src/app.ts','src/theme.css','package-lock.json']) inputs[path]=sha(await readFile(resolve(project,path)));
assert.equal((original.match(/import "@en-reve\/elements\/define\/date-picker.js";/g)||[]).length,1,'Calendar entry transform requires exactly one eager date import');
const template=await readFile(resolve(project,'src/template.ts'),'utf8');assert.equal(template.split('<en-date-picker\n').length-1,1,'Calendar transform requires exactly one matching date picker');
if(campaignContext&&!referenceCampaign){for(const [path,digest] of Object.entries(reference.sourceHashes || {})){if(path.startsWith('en-reve/src/')||path.startsWith('en-reve/vendor/')||path.startsWith('shared/')||['en-reve/package-lock.json','en-reve/index.html','en-reve/vite.config.js'].includes(path))assert.equal(sha(await readFile(resolve(showcases,path))),digest,'Source changed since snapshot: '+path);}}
const results=[];
for(const [policy,label] of specs){
 const id=campaignContext?.variants.find(v=>v.policy===policy).id || policy;
 const dir=resolve(root,'.cache/variants',id);
 try{await access(dir);throw Error(`Refusing existing variant ${id}`)}catch(e){if(e.code!=='ENOENT')throw e;}
 if(policy==='calendar-eager'){
  for(const a of reference.assets)assert.equal(sha(await readFile(resolve(referenceDirectory,a.path))),a.sha256);
  await cp(referenceDirectory,dir,{recursive:true});
 }else{
  await build({root:project,configFile:false,logLevel:'warn',plugins:[isolation(project),{name:'calendar-policy',transform(code,path){
   if(path===resolve(project,'src/template.ts'))return code.replace('<en-date-picker\n','<en-date-picker calendar-loading="deferred"\n');
   if(path===resolve(project,'src/main.js')&&policy==='calendar-split')return original.replace('import "@en-reve/elements/define/date-picker.js";',`import {createElementScope} from '@en-reve/elements/element-scope.js';\nimport {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';\ncreateElementScope({document, registry: 'global'}).register([datePickerShellDefinition]);`);
  }}],build:{outDir:dir,emptyOutDir:false,sourcemap:true}});
 }
 const assets=await assetManifest(dir);results.push({id,policy,label,description:label+'; unchanged 16-card application and global registry; '+(referenceCampaign?'packages from '+referenceCampaign:'frozen reference packages'),assets,fingerprint:sha(json(assets.map(a=>[a.path,a.sha256]))),sourceInputs:inputs,cohort:'calendar-consumer-policy',referenceFingerprint:reference.fingerprint});
 console.log(id,assets.filter(a=>a.path.endsWith('.js')).map(a=>[a.path,a.raw,a.brotli]));
}
const registry=resolve(root,'reports/en-reve-experiments.json');const old=await readFile(registry,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return [];throw e;});assert(!old.some(x=>results.some(v=>v.id===x.id)));
await writeFile(registry,json([...old,...results]));await writeFile(resolve(out,'builds.json'),json({createdAt:new Date().toISOString(),referenceCampaign,packageBaseline:campaignContext ? reference.fingerprint : '6d09b31cf43523ac8c75352208ab9697b62e2673',reference,variants:results}),{flag:'wx'});
