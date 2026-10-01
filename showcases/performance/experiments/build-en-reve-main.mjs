// Refresh only the En Reve native fixture from an exact, tracked-clean main checkout.
import {readFile, writeFile, mkdir, cp, rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root, showcases, sha, json} from '../src/config.mjs';
const source = process.argv[2];
if (!source) throw Error('Pass an exact-main clean source checkout');
const command=(cmd,args,cwd=source)=>execFileSync(cmd,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','inherit'],maxBuffer:20*1024*1024});
const commit=command('git',['rev-parse','HEAD']).trim();
if(commit!==command('git',['rev-parse','main']).trim() || command('git',['status','--porcelain','--untracked-files=no']).trim()) throw Error('Source must be tracked-clean main');
const out=resolve(root,'reports/en-reve-main'), fixture=resolve(showcases,'en-reve');
await mkdir(out,{recursive:true});
await cp(resolve(root,'.cache/inventory.json'),resolve(out,'prior-inventory.json'),{errorOnExist:true,force:false});
for(const name of ['package.json','package-lock.json','snapshot.json','src','vendor']) await cp(resolve(fixture,name),resolve(out,'prior-fixture',name),{recursive:true});
await cp(resolve(root,'../../plans/native-showcase-performance-results.md'),resolve(out,'prior-results.md'));
const pkg=JSON.parse(await readFile(resolve(fixture,'package.json'))), packages=[];
for(const name of ['tokens','styles','primitives','elements']) {
 console.log('BUILD',name); console.log(command('npm',['run','build','-w','@en-reve/'+name]));
 const packed=JSON.parse(command('npm',['pack','--ignore-scripts','--json','--pack-destination',resolve(fixture,'vendor')],resolve(source,'packages',name)))[0];
 const bytes=await readFile(resolve(fixture,'vendor',packed.filename)), hash=sha(bytes), filename=packed.filename.replace('.tgz','-main-'+hash.slice(0,12)+'.tgz');
 await rename(resolve(fixture,'vendor',packed.filename),resolve(fixture,'vendor',filename));
 // Restore the previous stable tarball, which remains an immutable historical dependency.
 await cp(resolve(out,'prior-fixture/vendor',packed.filename),resolve(fixture,'vendor',packed.filename));
 pkg.dependencies['@en-reve/'+name]='file:vendor/'+filename;packages.push({name,filename,sha256:hash});
}
const {emitThemeCSS,resolveTheme}=await import(pathToFileURL(resolve(source,'packages/tokens/dist/index.js')));
await writeFile(resolve(fixture,'src/theme.css'),emitThemeCSS(resolveTheme({mode:'light'}),{scope:'root',colorScheme:true}));
await writeFile(resolve(fixture,'package.json'),json(pkg));
console.log(command('npm',['install','--workspaces=false','--no-audit','--no-fund'],fixture));
console.log(command('npm',['run','build'],fixture));
const sourceHashes={};for(const name of command('git',['ls-files','packages','tooling']).trim().split('\n')) sourceHashes[name]=sha(await readFile(resolve(source,name)));
const snapshot={capturedAt:new Date().toISOString(),sourceCommit:commit,authority:'Exact tracked-clean local main source, fresh package builds and content-addressed tarballs.',rendering:'Client-rendered global eager individual registrations; no SSR or scoped/lazy consumer policy introduced.',packages,sourceHashes,sourceCheckout:source,defaultThemeCSS:sha(await readFile(resolve(fixture,'src/theme.css'))),fixturePolicy:'Retain the qualified standalone showcase application and individual component registrations to measure the updated library on the same workload. Refresh default light theme from these same main tokens. Historical package tarballs preserved.'};
await writeFile(resolve(fixture,'snapshot.json'),json(snapshot));await writeFile(resolve(out,'build-provenance.json'),json(snapshot));console.log('BUILT MAIN',commit);
