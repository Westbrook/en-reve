import {build} from 'esbuild';
import {mkdir, readFile, writeFile, cp} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {root, sha, json} from './config.mjs';
import {assetManifest} from './prepare.mjs';

export async function buildRegistryFixture(directory) {
  const repo = resolve(root, '../..'), fixture = resolve(root, 'fixtures/registry');
  await mkdir(directory, {recursive:true});
  const browser = await build({entryPoints:{bootstrap:resolve(fixture,'bootstrap.ts')}, outdir:resolve(directory,'client'), bundle:true, splitting:true, format:'esm', platform:'browser', target:'es2022', minify:true, sourcemap:true, metafile:true});
  const server = await build({entryPoints:[resolve(fixture,'ssr.ts')], outfile:resolve(directory,'server.mjs'), bundle:true, format:'esm', platform:'node', packages:'external', target:'node24', metafile:true});
  const inputs = [...new Set([...Object.keys(browser.metafile.inputs), ...Object.keys(server.metafile.inputs)])].sort();
  const sources = await Promise.all(inputs.map(async path => ({path, sha256:sha(await readFile(resolve(path)))})));
  const tokens = resolve(repo,'packages/tokens/dist/default.css');
  await cp(tokens,resolve(directory,'client/tokens.css'));
  const assets = await assetManifest(resolve(directory,'client'));
  const identity = {sources, assets, fingerprint:sha(json({sources,assets})), delivery:'Production esbuild bundles of current built library exports plus unchanged docs workflow factories. Eager catalog baseline; not packed-package publication qualification.'};
  await writeFile(resolve(directory,'identity.json'),json(identity));
  await writeFile(resolve(directory,'metafile.json'),json(browser.metafile));
  // Preserve source receipts and the sources themselves for later attribution.
  for (const item of sources) {
    const absolute = resolve(item.path), relative = absolute.startsWith(repo + '/') ? absolute.slice(repo.length+1) : null;
    if (relative) {const dest = resolve(directory,'sources',relative);await mkdir(dirname(dest),{recursive:true});await cp(absolute,dest);}
  }
  return identity;
}
export function validateFixtureConfig(config) {
  for (const [key, values] of Object.entries({workflow:['sso','settings','chat'],mode:['auto','global','scoped'],policy:['shared','group','instance','element'],delivery:['csr','ssr'],root:['light','shadow']})) if (!values.includes(config[key])) throw new Error(`Invalid ${key}`);
  if (!Number.isInteger(config.count) || config.count<1 || config.count>100) throw new Error('count must be 1–100');
  if (!Number.isInteger(config.groupSize) || config.groupSize<1 || config.groupSize>100) throw new Error('groupSize must be 1–100');
  if (config.root==='light' && (config.count!==1 || config.delivery==='ssr')) throw new Error('Light DOM fixture supports one CSR workflow; repeated IDs require independent shadow boundaries.');
  return config;
}
export async function startRegistryFixture(directory, {port=0}={}) {
  const {renderWorkflow} = await import(pathToFileURL(resolve(directory,'server.mjs')));
  const cache = new Map();
  const server=createServer(async (request,response)=>{
    try {
      const url=new URL(request.url,'http://127.0.0.1');
      response.setHeader('Cross-Origin-Opener-Policy','same-origin');response.setHeader('Cross-Origin-Embedder-Policy','require-corp');
      if (url.pathname==='/') {
        const config=validateFixtureConfig({workflow:url.searchParams.get('workflow')??'settings',mode:url.searchParams.get('mode')??'auto',policy:url.searchParams.get('policy')??'shared',count:Number(url.searchParams.get('count')??3),groupSize:Number(url.searchParams.get('groupSize')??2),delivery:url.searchParams.get('delivery')??'csr',root:url.searchParams.get('root')??'shadow'});
        const key=JSON.stringify(config);
        if (!cache.has(key)) cache.set(key,config.delivery==='ssr' ? await renderWorkflow(config.workflow,config.count,config.mode!=='global') : '');
        response.setHeader('Content-Type','text/html');response.setHeader('Cache-Control','no-store');
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Registry workflow benchmark</title><link rel="stylesheet" href="/tokens.css"><style>body{font-family:system-ui;margin:2rem}#workflows>section{display:block;margin-block:2rem;padding:1rem;border:1px solid #888}button{padding:.6rem}#status{min-height:1.5rem}</style><h1>Registry workflow benchmark</h1><button id="activate">Activate first workflow</button><p id="status" role="status">Ready to prepare.</p><main id="workflows">${cache.get(key)}</main><script id="config" type="application/json">${key}</script><script type="module" src="/bootstrap.js"></script></html>`);return;
      }
      if (url.pathname==='/away') {response.end('<!doctype html><title>Away</title>');return;}
      const file=resolve(directory,'client','.'+decodeURIComponent(url.pathname));
      if (!file.startsWith(resolve(directory,'client')+'/')) {response.writeHead(403);response.end();return;}
      const data=await readFile(file);response.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json');response.setHeader('Cache-Control','public,max-age=3600');response.end(data);
    } catch(error) {response.writeHead(error.code==='ENOENT'?404:400);response.end(String(error));}
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
