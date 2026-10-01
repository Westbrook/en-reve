import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,posix} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {parse} from 'acorn';
function imports(source){const result=[];const visit=n=>{if(!n||typeof n!=='object')return;if(['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration','ImportExpression'].includes(n.type)){if(typeof n.source?.value==='string')result.push(n.source.value);else if(n.source?.type==='TemplateLiteral'&&n.source.expressions.length===0)result.push(n.source.quasis[0].value.cooked);else if(n.type==='ImportExpression')throw Error('Unresolved dynamic import in parity graph');}for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}};visit(parse(source,{ecmaVersion:'latest',sourceType:'module'}));return result;}
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'artifacts/scoped-registry-phase-4-closeout');
const stage=(await readFile(resolve(out,'isolation-path.txt'),'utf8')).trim();
const reference=resolve(root,'artifacts/scoped-registry-phase-4-followup/route');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function files(dir){const all=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())all.push(...await files(p));else if(e.isFile())all.push(p);}return all;}
const runtime=[];
for(const pkg of ['elements','primitives','styles','tokens','ssr'])for(const p of await files(resolve(stage,'packages',pkg,'dist'))){
 if(!p.endsWith('.js'))continue;const rel=p.slice(stage.length+1),b=await readFile(p);
 if(rel==='packages/elements/dist/activation.js'){
  // Newly exported module is intentionally absent from the settings-only measured build.
  const source=await readFile(resolve(stage,'packages/elements/src/activation.ts'));
  const verified=JSON.parse(await readFile(resolve(root,'artifacts/scoped-registry-phase-4/source-snapshot.json'))).files.find(f=>f.path==='packages/elements/src/activation.ts');assert.equal(sha(source),verified.sha256);
  runtime.push({path:rel,sha256:sha(b),basis:'new module built from the exact previously verified activation source'});
 }else{assert.equal(sha(b),sha(await readFile(resolve(reference,'source',rel))),rel);runtime.push({path:rel,sha256:sha(b),basis:'byte-identical measured library module'});}
}
// Follow every static/dynamic local JS dependency of settings, rather than
// equating unrelated docs outputs or metadata to the measured route.
const htmlPath='workflows/settings.html',refSite=resolve(reference,'site'),site=resolve(stage,'dist');
const html=await readFile(resolve(refSite,htmlPath),'utf8');
const initial=[...html.matchAll(/(?:src|href)="([^"#?]+\.js)"/g)].map(m=>m[1].replace(/^\//,''));
assert(initial.length);
const pending=[...initial],seen=new Set(),assets=[];
while(pending.length){let file=pending.pop();if(seen.has(file))continue;seen.add(file);const before=await readFile(resolve(refSite,file)),after=await readFile(resolve(site,file));assert.equal(sha(after),sha(before),file);assets.push({path:file,sha256:sha(after)});
 for(const specifier of imports(before.toString())){assert(specifier.startsWith('.')||specifier.startsWith('/'),specifier);const next=specifier.startsWith('/')?specifier.slice(1):posix.normalize(posix.join(posix.dirname(file),specifier));pending.push(next);}
}
const candidateHTML=await readFile(resolve(site,htmlPath),'utf8');
const normalize=s=>s.replace(/<meta name="en-review-build" content="sha256:[a-f0-9]+">/,'').replace(/lit\$[0-9]+\$/g,'lit$BUILD$');
assert.equal(normalize(candidateHTML),normalize(html),'SSR settings markup differs beyond the whole-site review fingerprint and per-build Lit marker nonce');
const entry='apps/docs/src/workflow-pages/settings-entry.ts';assert.equal(sha(await readFile(resolve(stage,entry))),sha(await readFile(resolve(reference,'source',entry))));
const report={status:'passed',at:new Date().toISOString(),routeSourceByteIdentical:true,runtime,settingsAssets:assets.sort((a,b)=>a.path.localeCompare(b.path)),settingsHTML:{byteIdentical:candidateHTML===html,identicalExceptReviewFingerprintAndLitNonce:true,sha256:sha(candidateHTML),referenceSha256:sha(html)},note:'Runtime, full static/dynamic settings JS graph and SSR markup match the measured route candidate. Whole-site generated metadata now includes activation; its review fingerprint and randomized Lit nonce are not performance claims. No additional timing campaign required.'};
await writeFile(resolve(out,'build-parity.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'passed',runtimeModules:runtime.length,settingsAssets:assets.length,html:report.settingsHTML}));
