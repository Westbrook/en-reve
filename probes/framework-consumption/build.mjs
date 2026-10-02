import {mkdir, writeFile, readFile, copyFile, realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {join, resolve, relative, sep, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './node_modules/esbuild/lib/main.js';
import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {cohorts} from './cohorts.mjs';
const root = import.meta.dirname;
const repository = resolve(root, '../..');
const output = resolve(process.env.EN_FRAMEWORK_OUT ?? join(root, 'build'));
await mkdir(dirname(output), {recursive:true});
await mkdir(output, {recursive:false}); // Never overwrite a retained consumer/lock/result.
const site = join(output, 'site'), archives = join(output, 'packages');
await mkdir(site); await mkdir(archives);
const packages = await preparedPackages(['elements','primitives','styles','tokens','ssr'], archives);
const rootPackage = JSON.parse(await readFile(join(repository,'package.json'),'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command,args,cwd) => execFileSync(command,args,{cwd,stdio:'inherit'});
const versions = {}, consumers = {};
let islandHtml;
for (const {id:name,family} of cohorts) {
 const environment = join(output,name); await mkdir(environment);
 const sourceManifest = name === 'html' ? {dependencies:{}} : JSON.parse(await readFile(join(root,'environments',name,'package.json'),'utf8'));
 if (name !== 'html') await copyFile(join(root,'environments',name,'package-lock.json'),join(environment,'package-lock.json'));
 const dependencies = {...sourceManifest.dependencies, lit:'3.3.3', '@lit-labs/ssr-client':'1.1.8',
  ...Object.fromEntries(packages.map(p=>[p.name,'file:../packages/'+p.filename]))};
 await writeFile(join(environment,'package.json'),JSON.stringify({name:'packed-consumer-'+name,private:true,type:'module',dependencies,devDependencies:{typescript:rootPackage.devDependencies.typescript}},null,2)+'\n');
 // Seed each framework's own lock, resolve the added local archives offline, then
 // perform a clean install of that exact resulting lock. Preserve it per run.
 run('npm',['install','--package-lock-only','--offline','--ignore-scripts','--no-audit','--no-fund','--workspaces=false'],environment);
 run('npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund','--workspaces=false'],environment);
 for (const p of packages) {
  const installed = await realpath(join(environment,'node_modules',p.name));
  if (!installed.startsWith(environment+sep)) throw Error('Workspace package escaped independent installation: '+p.name);
 }
 for (const file of ['fixture.mjs','island-client.mjs','public.types.ts']) await copyFile(join(root,file),join(environment,file));
 run(process.execPath,[join(environment,'node_modules/typescript/bin/tsc'),'--ignoreConfig','--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','public.types.ts'],environment);
 if (!islandHtml) {
  // Render only through the packed HTML consumer's explicit public server setup.
  const server = join(environment,'render-island.mjs');
  await writeFile(server, `import '@en-reve/ssr/install.js';
await import('@en-reve/elements/define/checkbox.js');
await import('@en-reve/elements/define/select.js');
const {renderToString} = await import('@en-reve/ssr');
const {fixtureTemplate} = await import('./fixture.mjs');
export const html = await renderToString(fixtureTemplate());
`);
  islandHtml = (await import(pathToFileURL(server))).html;
 }
 const adapter = await import(`./adapters/${family}.mjs`);
 const {html,clientSource} = await adapter.render({environment,islandHtml});
 const client = await build({stdin:{contents:clientSource,resolveDir:environment,sourcefile:'consumer.mjs'},bundle:true,format:'esm',target:'es2022',outfile:join(site,`${name}.js`),define:{'process.env.NODE_ENV':'"production"'},metafile:true,logLevel:'silent'});
 const island = await build({entryPoints:[join(environment,'island-client.mjs')],bundle:true,format:'esm',target:'es2022',outfile:join(site,`${name}-island.js`),metafile:true,logLevel:'silent'});
 const inputs = [...Object.keys(client.metafile.inputs),...Object.keys(island.metafile.inputs)].map(p=>resolve(p));
 if (inputs.some(p=>!p.startsWith(environment+sep))) throw Error('Consumer bundle resolved outside its own installation: '+inputs.find(p=>!p.startsWith(environment+sep)));
 if (!inputs.some(p=>p.includes('/node_modules/@en-reve/elements/'))) throw Error('Packed elements missing from consumer');
 const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} consumption</title><link rel="icon" href="data:,"><style>body{font:16px system-ui;margin:2rem;max-width:50rem}button{font:inherit;margin:.25rem;padding:.5rem}en-select,en-tree,en-text-field{display:block;margin:1rem 0}section{margin-block:1rem}output{display:block;margin-block:.5rem}</style></head><body><main id="framework-root">${html}</main><script type="module">window.hydrateFixture = async () => {const {startIsland} = await import('./${name}-island.js');await startIsland();const {start} = await import('./${name}.js');await start();await new Promise(requestAnimationFrame);document.documentElement.dataset.ready='true';}; if(!new URL(location.href).searchParams.has('defer')) await window.hydrateFixture();</script></body></html>`;
 await writeFile(join(site,`${name}.html`),page);
 versions[name] = name === 'html' ? {lit:'3.3.3'} : sourceManifest.dependencies;
 const lock = await readFile(join(environment,'package-lock.json'));
 consumers[name] = {versions:versions[name],lock:relative(output,join(environment,'package-lock.json')),lockSHA256:hash(lock),types:'passed',install:'fresh npm ci --offline from per-consumer resolved lock; no workspace links',inputs:inputs.map(p=>relative(environment,p)),assets:Object.fromEntries(await Promise.all([`${name}.html`,`${name}.js`,`${name}-island.js`].map(async f=>[f,hash(await readFile(join(site,f)))])))};
 console.log('Packed consumer ready: '+name);
}
await writeFile(join(site,'versions.json'),JSON.stringify(versions,null,2)+'\n');
await writeFile(join(output,'preparation.json'),JSON.stringify({schemaVersion:1,packages,consumers,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),note:'Each consumer owns freshly installed tarballs, resolved lock, public type compilation and complete bundled inputs. This is preparation, not browser qualification.'},null,2)+'\n');
console.log('Built independent packed framework consumers: '+site);
