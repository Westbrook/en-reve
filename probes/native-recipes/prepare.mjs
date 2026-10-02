import assert from 'node:assert/strict';
import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,readdir,symlink,cp,realpath} from 'node:fs/promises';
import {resolve,join,relative,sep,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.EN_NATIVE_RECIPES_OUT??'artifacts/native-recipes');
await mkdir(dirname(out),{recursive:true});await mkdir(out,{recursive:false});
const stage=join(out,'consumer'),site=join(out,'site'),archives=join(out,'packages'),assets=join(site,'assets');
for(const path of [join(stage,'node_modules'),assets,archives])await mkdir(path,{recursive:true});
const packages=await preparedPackages(['primitives','styles','tokens','elements'],archives);
for(const archive of packages){const destination=join(stage,'node_modules',archive.name);await mkdir(destination,{recursive:true});execFileSync('tar',['-xzf',join(archives,archive.filename),'-C',destination,'--strip-components=1']);}
for(const name of await readdir(join(root,'node_modules')))if(name!=='@en-reve'&&!name.startsWith('.'))await symlink(join(root,'node_modules',name),join(stage,'node_modules',name));
await writeFile(join(stage,'package.json'),'{"type":"module"}\n');
const sources=[];
for(const family of ['content','navigation']){
 await mkdir(join(stage,family));
 for(const file of ['fixture.ts','fixture-template.ts','document.mjs']){
  const path=`packages/primitives/tests/${family}/${file}`;sources.push(path);await cp(join(root,path),join(stage,family,file));
 }
}
await cp(join(import.meta.dirname,'render-pages.mjs'),join(stage,'render-pages.mjs'));sources.push('probes/native-recipes/render-pages.mjs');
await writeFile(join(stage,'tokens.ts'),"export {resolveTheme,emitThemeCSS} from '@en-reve/tokens';\n");
const declarations=execFileSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'--ignoreConfig','--strict','--noEmit','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','--listFiles','content/fixture.ts','navigation/fixture.ts','tokens.ts'],{cwd:stage,encoding:'utf8'});
await writeFile(join(out,'type-files.txt'),declarations);const ownTypes=declarations.trim().split('\n').filter(path=>path.includes('/@en-reve/'));assert(ownTypes.length>0);
for(const path of ownTypes)assert((await realpath(path)).startsWith(join(stage,'node_modules/@en-reve')+sep));
const result=await build({entryPoints:{content:join(stage,'content/fixture.ts'),navigation:join(stage,'navigation/fixture.ts'),tokens:join(stage,'tokens.ts')},outdir:assets,bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true});
const inputs=Object.keys(result.metafile.inputs);assert(!inputs.some(path=>/\/packages\/[^/]+\/src\//.test(path)||/elements\/dist\/(index|catalog|lazy)\.js/.test(path)));
for(const path of inputs.filter(path=>path.includes('/@en-reve/')))assert((await realpath(resolve(root,path))).startsWith(join(stage,'node_modules/@en-reve')+sep));
assert.deepEqual(inputs.filter(path=>path.includes('/elements/dist/define/')).map(path=>path.split('/').at(-1)),['skeleton.js']);
const outputs=result.metafile.outputs;
const closure=(file,seen=new Set())=>{if(seen.has(file))return seen;seen.add(file);for(const dep of outputs[file].imports)if(!dep.external)closure(dep.path,seen);return seen;};
const entryInputs=Object.fromEntries(['content','navigation','tokens'].map(name=>{const file=Object.keys(outputs).find(path=>outputs[path].entryPoint?.endsWith(name==='tokens'?'/tokens.ts':`/${name}/fixture.ts`));assert(file);return [name,[...new Set([...closure(file)].flatMap(path=>Object.keys(outputs[path].inputs)))]];}));
assert(!entryInputs.navigation.some(path=>path.includes('/@en-reve/elements/')));
assert(entryInputs.content.some(path=>path.endsWith('/elements/dist/define/skeleton.js')));
// TypeScript syntax removal only: server modules still resolve packed public dependencies.
await build({entryPoints:['content','navigation'].map(family=>join(stage,family,'fixture-template.ts')),outdir:stage,outbase:stage,format:'esm',platform:'node',target:'es2022',bundle:false});
const css={};for(const name of ['foundations','content','navigation'])css[name]=await readFile(join(stage,'node_modules/@en-reve/styles/dist',name+'.css'),'utf8');
await writeFile(join(assets,'content.css'),css.foundations+'\n'+css.content);await writeFile(join(assets,'navigation.css'),css.navigation);
execFileSync(process.execPath,[join(stage,'render-pages.mjs'),site],{cwd:stage,stdio:'inherit'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),assetHashes={};for(const file of await readdir(assets))assetHashes[file]=hash(await readFile(join(assets,file)));
await writeFile(join(out,'metafile.json'),JSON.stringify(result.metafile,null,2)+'\n');
await writeFile(join(out,'packed.json'),JSON.stringify({schemaVersion:1,packages:packages.map(({name,integrity,shasum,setup})=>({name,integrity,shasum,setup})),types:{status:'passed',packedDeclarations:ownTypes.map(path=>relative(stage,path))},inputs,entryInputs,assets:assetHashes,portableCSS:Object.fromEntries(Object.entries(css).map(([name,text])=>['@en-reve/styles/'+name+'.css',hash(text)])),pages:JSON.parse(await readFile(join(site,'pages.json'),'utf8')),sourceInputs:Object.fromEntries(await Promise.all(sources.map(async path=>[path,hash(await readFile(join(root,path)))]))),limits:['Maintained alternate content/navigation recipes; only skeleton is explicitly registered for authored placeholders.','No retail/physical browser, manual AT, physical IME or universal framework SSR claim.']},null,2)+'\n');
console.log(JSON.stringify({out,types:'passed',inputs:inputs.length}));
