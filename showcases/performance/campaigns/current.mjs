import { readFile, writeFile, mkdir, cp, copyFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import {files} from '../src/prepare.mjs';
import {sha} from '../src/config.mjs';
import { lab, calendarContext } from './config.mjs';
import { node } from './execute.mjs';
const ctx=calendarContext();
if(ctx?.config.kind!=='current')throw Error('Run current-source builds through a current campaign');
await node('experiments/build-current.mjs');
const registry=resolve(lab,'reports/en-reve-experiments.json');const entries=JSON.parse(await readFile(registry));
const source=entries.find(e=>e.id==='current-en-reve');if(!source)throw Error('Current consumer build did not register its output');
const id=ctx.id+'-current';if(entries.some(e=>e.id===id))throw Error('Existing current variant ID');
await mkdir(resolve(lab,'.cache/variants',id));await cp(resolve(lab,'.cache/variants/current-en-reve'),resolve(lab,'.cache/variants',id),{recursive:true});
const variant={...source,id,label:'Current source',policy:'current-source'};
await writeFile(registry,JSON.stringify([...entries,variant],null,2)+'\n');
await mkdir(resolve(ctx.directory,'packages'));
for(const pkg of source.packages)await copyFile(resolve(lab,'.cache/current-consumer/en-reve/vendor',pkg.filename),resolve(ctx.directory,'packages',pkg.filename));
await writeFile(resolve(ctx.directory,'builds.json'),JSON.stringify({createdAt:new Date().toISOString(),variants:[variant],note:'Current root packages built and packed separately; frozen reference preserved'},null,2)+'\n',{flag:'wx'});

// Retain the resolved consuming-project inputs alongside content-addressed packages.
const consumer=resolve(lab,'.cache/current-consumer/en-reve');
await mkdir(resolve(ctx.directory,'consumer'));
for(const name of ['src','vendor','index.html','vite.config.js','.npmrc','package.json','package-lock.json'])await cp(resolve(consumer,name),resolve(ctx.directory,'consumer',name),{recursive:true});
await cp(resolve(lab,'.cache/current-consumer/shared'),resolve(ctx.directory,'shared'),{recursive:true});
await cp(resolve(lab,'.cache/current-consumer/tools'),resolve(ctx.directory,'tools'),{recursive:true});

const inputHashes={};for(const folder of ['consumer','shared','tools'])for(const path of await files(resolve(ctx.directory,folder)))inputHashes[relative(ctx.directory,path)]=sha(await readFile(path));
await writeFile(resolve(ctx.directory,'consumer-inputs.json'),JSON.stringify(inputHashes,null,2)+'\n',{flag:'wx'});
