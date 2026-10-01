import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, mkdtemp, readdir, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';
const root=resolve(new URL('../..',import.meta.url).pathname);
const stage=await mkdtemp(resolve(tmpdir(),'en-registry-packed-'));
const packages=[];
const preparedArchives=await preparedPackages(['elements','primitives','styles'],stage);
for(const archive of preparedArchives) {const name=archive.name.slice('@en-reve/'.length);
 const destination=resolve(stage,'node_modules/@en-reve',name);await mkdir(destination,{recursive:true});
 execFileSync('tar',['-xzf',resolve(stage,archive.filename),'-C',destination,'--strip-components=1']);
 packages.push({name,filename:archive.filename,integrity:archive.integrity,shasum:archive.shasum,setup:archive.setup});
}
// Resolve third-party types normally, while keeping all three library packages packed.
for(const entry of await readdir(resolve(root,'node_modules'))){
 if(entry==='@en-reve'||entry.startsWith('.'))continue;
 await symlink(resolve(root,'node_modules',entry),resolve(stage,'node_modules',entry));
}
await writeFile(resolve(stage,'package.json'),JSON.stringify({type:'module'}));
await writeFile(resolve(stage,'consumer.types.ts'),await readFile(resolve(root,'probes/scoped-registry/consumer.types.ts')));
execFileSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','consumer.types.ts'],{cwd:stage,stdio:'inherit'});
const out=resolve(root,process.env.EN_SCOPED_REGISTRY_OUT ?? 'artifacts/scoped-registry-phase-2/packed');await mkdir(out,{recursive:true});
const entry=resolve(stage,'fixture.ts');await writeFile(entry,await readFile(resolve(root,'probes/scoped-registry/ownership-fixture.ts')));
const result=await build({entryPoints:[entry],outfile:resolve(out,'fixture.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',nodePaths:[resolve(root,'node_modules')],metafile:true});
await writeFile(resolve(out,'receipt.json'),JSON.stringify({packages,types:'passed against packed declarations',fixtureSha256:createHash('sha256').update(await readFile(resolve(out,'fixture.js'))).digest('hex'),inputs:Object.keys(result.metafile.inputs),note:'All elements, primitives and styles resolve from npm pack archives, not workspace source.'},null,2)+'\n');
console.log('Packed consumer fixture ready: '+packages.map(p=>p.name).join(', '));
