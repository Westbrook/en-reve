import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { digest, inventory, safePath } from './runtime.mjs';
import { parse } from 'parse5';

function deploymentFor(build, allowProjectPath) {
  if(build.deployment!==undefined&&(!build.deployment||typeof build.deployment!=='object'||Array.isArray(build.deployment)||typeof build.deployment.basePath!=='string'||!(build.deployment.baseURL===null||typeof build.deployment.baseURL==='string'))) throw new Error('Invalid documentation deployment metadata.');
  const {basePath,baseURL}=build.deployment??{basePath:'/',baseURL:null};
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error('Invalid documentation deployment path.');
  if (basePath === '/') {
    if (baseURL !== null) throw new Error('Root documentation must not declare a hosting base.');
    return {basePath, baseURL, origin:'https://en-reve-review.invalid'};
  }
  if (!allowProjectPath) throw new Error('Use an original root build for portable offline packaging; project-path capture requires explicit opt-in.');
  let url;
  try { url = new URL(baseURL); } catch { throw new Error('Invalid documentation deployment URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== basePath || url.href !== baseURL) throw new Error('Deployment URL does not match the declared project path.');
  return {basePath,baseURL,origin:url.origin};
}

function verifyDocument(text, path, build, deployment) {
  const tree=parse(text), bases=[], markers=[];
  const visit=(node,inHead=false)=>{
    const head=inHead||node.tagName==='head';
    if(node.tagName==='base') bases.push({head,attrs:node.attrs});
    if(node.tagName==='meta'&&node.attrs?.some(a=>a.name==='name'&&a.value==='en-review-build')) markers.push({head,content:node.attrs.find(a=>a.name==='content')?.value});
    for(const child of node.childNodes??[])visit(child,head);
    if(node.content)visit(node.content,false);
  };
  visit(tree);
  if(markers.length!==1||!markers[0].head||markers[0].content!==build.fingerprint) throw new Error('Missing or inconsistent review build marker: '+path);
  if(deployment.basePath==='/') {
    if(bases.length) throw new Error('Use the original bound root build, without a hosting base transformation: '+path);
  } else if(bases.length!==1||!bases[0].head||bases[0].attrs.length!==1||bases[0].attrs[0].name!=='href'||bases[0].attrs[0].value!==deployment.baseURL) throw new Error('Document base does not match its declared deployment: '+path);
}


/** Verify original documentation transport bytes, shared by theme and release packages. */
export async function inspectBuild(buildRoot, {allowProjectPath = false} = {}) {
  const assets = await inventory(buildRoot);
  const buildBytes = await readFile(resolve(buildRoot, 'review-build.json'));
  const build = JSON.parse(buildBytes);
  if (build.schemaVersion !== 1 || !/^sha256:[a-f0-9]{64}$/.test(build.fingerprint) || !Array.isArray(build.assets) || !Array.isArray(build.pages) || !Array.isArray(build.caseIds)) throw new Error('Invalid review build');
  const deployment=deploymentFor(build,allowProjectPath);
  for(const page of build.pages){
    if(typeof page.path!=='string'||!page.path.startsWith(deployment.basePath)||page.path.startsWith('//')) throw new Error('Review page escapes its deployment path.');
    const url=new URL(page.path,deployment.origin);
    if(url.origin!==deployment.origin||!url.pathname.startsWith(deployment.basePath)) throw new Error('Review page escapes its deployment path.');
  }
  const expected = new Map();
  for (const entry of build.assets) {
    safePath(entry.path);
    if (expected.has(entry.path) || entry.path === 'review-build.json') throw new Error('Duplicate or invalid build entry');
    expected.set(entry.path, entry.sha256);
  }
  for (const entry of assets.filter(entry => entry.path !== 'review-build.json')) {
    if (expected.get(entry.path) !== entry.sha256) throw new Error('Build integrity mismatch: ' + entry.path);
    expected.delete(entry.path);
  }
  if (expected.size) throw new Error('Build is missing assets');
  for (const entry of assets.filter(entry => entry.path.endsWith('.html'))) {
    const text = await readFile(resolve(buildRoot, entry.path), 'utf8');
    verifyDocument(text,entry.path,build,deployment);
  }
  return { buildRoot, build, buildBytes, assets, deployment };
}

export async function copyBuild(snapshot, output) {
  for (const entry of snapshot.assets) {
    const bytes = await readFile(resolve(snapshot.buildRoot, entry.path));
    if (digest(bytes) !== entry.sha256) throw new Error('Build changed during packaging');
    const target = resolve(output, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: 'wx' });
  }
}
