import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root,showcases,json,sha} from '../src/config.mjs';
import {assetManifest} from '../src/prepare.mjs';
import {isolation} from '../../tools/isolation-plugin.mjs';
const project=resolve(showcases,'en-reve');
const {build}=await import(pathToFileURL(resolve(project,'node_modules/vite/dist/node/index.js')));
const inventory=JSON.parse(await readFile(resolve(root,'.cache/inventory.json')));
const reference=inventory.systems.find(s=>s.id==='en-reve');
const out=resolve(root,'reports/calendar-variants');await mkdir(out,{recursive:true});
const specs=[['calendar-eager','Eager reference'],['calendar-deferred','Deferred construction'],['calendar-split','Deferred code + construction']];
const original=await readFile(resolve(project,'src/main.js'),'utf8');
const inputs={};for(const path of ['src/main.js','src/template.ts','src/app.ts','src/theme.css','package-lock.json']) inputs[path]=sha(await readFile(resolve(project,path)));
const results=[];
for(const [id,label] of specs){
 const dir=resolve(root,'.cache/variants',id);
 try{await access(dir);throw Error(`Refusing existing variant ${id}`)}catch(e){if(e.code!=='ENOENT')throw e;}
 if(id==='calendar-eager'){
  for(const a of reference.assets)assert.equal(sha(await readFile(resolve(root,'.cache/snapshots/en-reve',a.path))),a.sha256);
  await cp(resolve(root,'.cache/snapshots/en-reve'),dir,{recursive:true});
 }else{
  await build({root:project,configFile:false,logLevel:'warn',plugins:[isolation(project),{name:'calendar-policy',transform(code,path){
   if(path===resolve(project,'src/template.ts'))return code.replace('<en-date-picker\n','<en-date-picker calendar-loading="deferred"\n');
   if(path===resolve(project,'src/main.js')&&id==='calendar-split')return original.replace('import "@en-reve/elements/define/date-picker.js";',`import {createElementScope} from '@en-reve/elements/element-scope.js';\nimport {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';\ncreateElementScope({document, registry: 'global'}).register([datePickerShellDefinition]);`);
  }}],build:{outDir:dir,emptyOutDir:false,sourcemap:true}});
 }
 const assets=await assetManifest(dir);results.push({id,label,description:label+'; unchanged 16-card application, global registry and frozen main packages',assets,fingerprint:sha(json(assets.map(a=>[a.path,a.sha256]))),sourceInputs:inputs,cohort:'calendar-consumer-policy',referenceFingerprint:reference.fingerprint});
 console.log(id,assets.filter(a=>a.path.endsWith('.js')).map(a=>[a.path,a.raw,a.brotli]));
}
const registry=resolve(root,'reports/en-reve-experiments.json');const old=JSON.parse(await readFile(registry));assert(!old.some(x=>specs.some(([id])=>id===x.id)));
await writeFile(registry,json([...old,...results]));await writeFile(resolve(out,'builds.json'),json({createdAt:new Date().toISOString(),packageBaseline:'6d09b31cf43523ac8c75352208ab9697b62e2673',reference,variants:results}),{flag:'wx'});
