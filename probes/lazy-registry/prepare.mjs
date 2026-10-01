import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,mkdtemp,readdir,symlink,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,process.env.EN_LAZY_OUT ?? 'artifacts/scoped-registry-phase-3/packed');
const stage=await mkdtemp(resolve(tmpdir(),'en-lazy-packed-'));
const packages=[];
const preparedArchives=await preparedPackages(['elements','primitives','styles','tokens','ssr'],stage);
for(const archive of preparedArchives) {const name=archive.name.slice('@en-reve/'.length);
 const destination=resolve(stage,'node_modules/@en-reve',name);await mkdir(destination,{recursive:true});
 execFileSync('tar',['-xzf',resolve(stage,archive.filename),'-C',destination,'--strip-components=1']);
 packages.push({name,integrity:archive.integrity,shasum:archive.shasum,setup:archive.setup});
}
for(const name of await readdir(resolve(root,'node_modules')))if(name!=='@en-reve'&&!name.startsWith('.'))await symlink(resolve(root,'node_modules',name),resolve(stage,'node_modules',name));
await writeFile(resolve(stage,'package.json'),JSON.stringify({type:'module'}));
for(const name of ['essential','eager','lazy','runtime','ssr','library','lazy-boot','eager-boot'])await cp(resolve(root,`probes/lazy-registry/${name}.ts`),resolve(stage,`${name}.ts`));
await cp(resolve(root,'apps/docs/src/workflows'),resolve(stage,'workflows'),{recursive:true});
await cp(resolve(root,'apps/docs/src/change-consumption.ts'),resolve(stage,'change-consumption.ts'));
await cp(resolve(root,'probes/lazy-registry/consumer.types.ts'),resolve(stage,'consumer.types.ts'));
execFileSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','consumer.types.ts'],{cwd:stage,stdio:'inherit'});
await mkdir(out,{recursive:true});
const browser=await build({entryPoints:{lazy:resolve(stage,'lazy-boot.ts'),eager:resolve(stage,'eager-boot.ts')},outdir:out,bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true,chunkNames:'chunks/[name]-[hash]'});
await writeFile(resolve(out,'metafile.json'),JSON.stringify(browser.metafile,null,2)+'\n');
await build({entryPoints:[resolve(stage,'ssr.ts')],outfile:resolve(stage,'ssr.mjs'),bundle:true,packages:'external',format:'esm',platform:'node',target:'es2022'});
const {markup}=await import(pathToFileURL(resolve(stage,'ssr.mjs')));
for(const mode of ['eager','lazy'])for(const ssr of [false,true]) {
 const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Settings ${mode} ${ssr?'SSR':'CSR'} loading fixture</title><style>body{font-family:system-ui;margin:2rem}en-command-palette:not(:defined){display:none}</style></head><body>${ssr?`<main id="ssr-root">${`<template shadowrootmode="open" shadowrootcustomelementregistry>${markup.replaceAll('shadowrootmode="open"', 'shadowrootmode="open" shadowrootcustomelementregistry')}</template>`}</main>`:''}<script type="module" src="./${mode}.js"></script></body></html>`;
 await writeFile(resolve(out,`${mode}${ssr?'-ssr':''}.html`),html);
}
const library = await build({entryPoints:[resolve(stage,'library.ts')],outdir:resolve(out,'library'),bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true,chunkNames:'chunks/[name]-[hash]'});
await writeFile(resolve(out,'library.html'),'<html lang="en"><title>Lazy library</title><script type="module" src="./library/library.js"></script></html>');
await writeFile(resolve(out,'library-metafile.json'),JSON.stringify(library.metafile,null,2)+'\n');
const outputs=browser.metafile.outputs;
function closure(file, seen=new Set()) {if(seen.has(file))return seen;seen.add(file);for(const entry of outputs[file].imports)if(entry.kind!=='dynamic-import'||/\/(lazy|eager)\.js$/.test(file))closure(entry.path,seen);return seen;}
const entries=Object.keys(outputs).filter(file=>/\/(lazy|eager)\.js$/.test(file));
const startup=Object.fromEntries(entries.map(file=>{const files=[...closure(file)];return [file.endsWith('/lazy.js')?'lazy':'eager',{files:files.map(f=>relative(out,resolve(f))),bytes:files.reduce((sum,f)=>sum+outputs[f].bytes,0),inputs:[...new Set(files.flatMap(f=>Object.keys(outputs[f].inputs)))]}];}));
if(startup.lazy.inputs.some(input=>/\/command-palette[/.]/.test(input)))throw Error('Optional palette reached lazy startup');
if(!startup.eager.inputs.some(input=>/\/command-palette[/.]/.test(input)))throw Error('Eager control does not include palette');
if(Object.keys(browser.metafile.inputs).some(input=>/elements\/dist\/(define\/|catalog\.js|index\.js)/.test(input)))throw Error('Forbidden eager registration entry');
const hashes={};for(const file of Object.keys(outputs))hashes[relative(out,resolve(file))]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile(resolve(out,'receipt.json'),JSON.stringify({packages,startup,hashes,note:'Packed library artifacts; identical real settings workflow and essential definition closure; optional command family differs only in eager versus literal dynamic import.'},null,2)+'\n');
console.log(JSON.stringify({out,startupBytes:Object.fromEntries(Object.entries(startup).map(([k,v])=>[k,v.bytes]))}));
