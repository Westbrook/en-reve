import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { css, unsafeCSS, html, LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { render } from '@lit-labs/ssr';
import { chromium, firefox, webkit } from '@playwright/test';
import { loadEngine, canonicalCSS } from './compiler.mjs';
import { definitionInputs, makeComparison, consumerSource, compilePilot } from './fixture.mjs';
import { baselineStyles, roles } from './fixtures/baseline.ts';
import { resolveTheme, createThemePair, emitThemePairCSS } from '../../packages/tokens/dist/index.js';
import manifest from './manifest.json' with {type:'json'};

const root = fileURLToPath(new URL('../../',import.meta.url));
const productionAuthoring = process.argv.includes('--production-authoring');
const output = resolve(root,process.env.EN_AUTHORING_OUTPUT ?? (productionAuthoring?'node_modules/.cache/theme-07-css-authoring':'node_modules/.cache/theme-07-pilot'));
await mkdir(output,{recursive:true});
const started = performance.now();
const engine = productionAuthoring ? null : await loadEngine();
const inputs = productionAuthoring ? [{filename:'packages/styles/src/css/recipes.css',css:await readFile(resolve(root,'packages/styles/src/css/recipes.css'),'utf8')}] : await definitionInputs();
const productionBefore = productionAuthoring ? JSON.parse(await readFile(resolve(root,'tooling/css-authoring/fixtures/consumer-baseline.json'),'utf8')).css : null;
const comparison = productionAuthoring ? {
  before:canonicalCSS(productionBefore.typography+'\n'+productionBefore.surfaces),
  after:canonicalCSS(await readFile(resolve(root,'packages/styles/dist/typography.css'),'utf8')+'\n'+await readFile(resolve(root,'packages/styles/dist/surfaces.css'),'utf8')),
} : makeComparison(inputs,engine);
assert.equal(comparison.after,comparison.before);
const startupMs = performance.now()-started;
const { before, after } = comparison;
await writeFile(resolve(output,'before.css'),before);
await writeFile(resolve(output,'after.css'),after);
await writeFile(resolve(output,'styles.mjs'),productionAuthoring ? `import {css} from 'lit';
import {typographyStyles} from '../../../packages/styles/dist/typography.js';
import {surfaceStyles,layoutStyles} from '../../../packages/styles/dist/surfaces.js';
export const styles=css\`\${typographyStyles}\${surfaceStyles}\${layoutStyles}\`;` : `import {unsafeCSS} from 'lit';\nexport const styles=unsafeCSS(${JSON.stringify(after)});\n`);
const {styles} = await import(new URL(`file://${resolve(output,'styles.mjs')}?${Date.now()}`));
assert.equal(canonicalCSS(styles.cssText),after);

// Distinct recipe stress fixtures, not completed THEME-08 application themes.
const fixtures = [
  {name:'Editorial',density:'spacious',family:['Georgia','serif'],radius:24,body:18,inset:6},
  {name:'Instrument',density:'compact',family:['monospace'],radius:0,body:14,inset:6},
  {name:'Studio',density:'comfortable',family:['system-ui','sans-serif'],radius:32,body:20,inset:10},
];
const themeCSS = fixtures.map((f,index) => {
  const branch = mode => resolveTheme({ mode, density:f.density, pins:{
    'font.body.family':f.family,'font.body.size':{value:f.body+(mode==='dark'?1:0),unit:'px'},
    'radius.container':{value:f.radius+(mode==='dark'?2:0),unit:'px'},'space.2':{value:f.inset,unit:'px'},
  }});
  return emitThemePairCSS(createThemePair({name:f.name.toLowerCase(),light:branch('light'),dark:branch('dark')}),{selector:`[data-theme="${index}"]`});
}).join('\n');
const sizeCSS = ['small','medium','large'].map(s=>`[data-size="${s}"]{--_en-size-small:${s==='small'?1:0};--_en-size-medium:${s==='medium'?1:0};--_en-size-large:${s==='large'?1:0}}`).join('');
const decoration = `:host{display:block;font-family:system-ui}*{box-sizing:border-box}html{font-size:16px}body{margin:0;font-family:system-ui}section{padding:12px;margin:8px 0;background:var(--en-color-surface,#fff);color:var(--en-color-text,#1c2930);border:1px solid #8886}p{margin:4px 0} .pilot-inner,.pilot-badge{padding:10px;background:var(--en-color-surface-raised,#dfe8ef);border:1px solid currentColor} .pilot-badge{display:inline-block}`;
const sharedCSS = themeCSS+sizeCSS+decoration;
function sample(id) {
  return `<div class="pilot-inner en-inset-surface" data-probe="${id}-radius">${roles.map(role=>`<p class="en-${role}" data-probe="${id}-${role}">${role} · The shape of a shared idea</p>`).join('')}<span class="pilot-badge en-inset-surface" data-probe="${id}-badge">Nested corner</span></div>`;
}
function markup(appearance='light',size='medium') {
  return fixtures.map((f,i)=>`<section id="theme-${i}" class="en-foundation" data-theme="${i}" data-en-appearance="${appearance}" data-size="${size}"><h2>${f.name} · ${f.density}</h2>${sample(`t${i}`)}<section id="partial-${i}" class="en-foundation" style="--en-radius-container-medium:40px;--en-font-body-family:cursive">Partial override${sample(`p${i}`)}</section><section id="nested-${i}" class="en-foundation" data-theme="${(i+1)%3}" data-en-appearance="${appearance==='light'?'dark':'light'}">Independent nested theme${sample(`n${i}`)}</section></section>`).join('')+`<section class="en-foundation" id="fallback">Unspecified token fallbacks${sample('fallback')}</section>`;
}
class PilotSSR extends LitElement {
  static properties={appearance:{type:String},size:{type:String}};
  static styles=[styles,unsafeCSS(sharedCSS)];
  constructor(){super();this.appearance='light';this.size='medium';}
  render(){return html`${unsafeHTML(markup(this.appearance,this.size))}`;}
}
customElements.define('pilot-ssr',PilotSSR);
const ssrHTML=(appearance,size)=>Array.from(render(html`<pilot-ssr appearance=${appearance} size=${size}> </pilot-ssr>`)).join('');
assert.ok(ssrHTML('light','medium').includes(styles.cssText));
assert.ok(ssrHTML('light','medium').includes('shadowrootmode="open"'));
await writeFile(resolve(output,'ssr.html'),ssrHTML('light','medium'));
await writeFile(resolve(output,'consumer.css'),productionAuthoring ? await readFile(resolve(root,'packages/styles/src/css/typography.css'),'utf8') : consumerSource());
const imports={'@en-reve/tokens/':'/packages/tokens/dist/','lit':'/vendor/lit/index.js','lit/':'/vendor/lit/','lit-html':'/vendor/lit-html/lit-html.js','lit-html/':'/vendor/lit-html/','lit-element/':'/vendor/lit-element/','@lit/reactive-element':'/vendor/@lit/reactive-element/reactive-element.js','@lit/reactive-element/':'/vendor/@lit/reactive-element/','@lit-labs/ssr-client/':'/vendor/@lit-labs/ssr-client/'};
const importMap=`<script type="importmap">${JSON.stringify({imports})}</script>`;
const clientScript = `import '@lit-labs/ssr-client/lit-element-hydrate-support.js';import {LitElement,html,unsafeCSS} from 'lit';import {unsafeHTML} from 'lit/directives/unsafe-html.js';import {styles} from '/styles.mjs';const markup=${markup.toString()};const sample=${sample.toString()};const fixtures=${JSON.stringify(fixtures)};const roles=${JSON.stringify(roles)};
class PilotClient extends LitElement{static properties={appearance:{type:String},size:{type:String}};static styles=[styles,unsafeCSS(${JSON.stringify(sharedCSS)})];constructor(){super();this.appearance='light';this.size='medium'}render(){return html\`\${unsafeHTML(markup(this.appearance,this.size))}\`;}}
const tag=document.querySelector('pilot-ssr')?'pilot-ssr':'pilot-js';if(tag==='pilot-ssr')await import('@lit-labs/ssr-client/lit-element-hydrate-support.js');customElements.define(tag,PilotClient);await document.querySelector(tag).updateComplete;document.documentElement.dataset.ready='true';`;
const preview = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>THEME-07 · Authoring pilot</title><style>body{font:16px/1.5 system-ui;margin:32px;color:#1c2930;background:#f4f5f1}main{max-width:1400px;margin:auto}h1{font-size:clamp(28px,4vw,46px);letter-spacing:-.04em}label{display:inline-flex;gap:8px;margin:0 20px 16px 0}select{font:inherit;padding:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}iframe{width:100%;height:900px;border:1px solid #bcc3c7;background:white}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#245974}#return{position:fixed;bottom:16px;right:16px;background:white;padding:8px 14px;border:1px solid #bcc3c7;border-radius:99px}@media(max-width:700px){.grid{grid-template-columns:1fr}body{margin:16px}} </style><main><p>EN RÊVE · THEME-07 · LOCAL EXPERIMENT</p><h1>Different authoring. The same CSS.</h1><p>Compare the TypeScript helper with the compiled function and mixin. This pilot changes no production component or theme.</p><label>Appearance<select id="appearance"><option>light</option><option>dark</option></select></label><label>Size<select id="size"><option>small</option><option selected>medium</option><option>large</option></select></label><label>After delivery<select id="delivery"><option value="after">Plain CSS</option><option value="js">Lit styles</option><option value="ssr">Server HTML</option><option value="hydrate">Hydrated server HTML</option></select></label><div class="grid"><section><h2>Before · TypeScript helper</h2><iframe title="Before TypeScript helper" id="before" src="/fixture?mode=before"></iframe></section><section><h2>After · Compiled recipe</h2><iframe title="After compiled recipe" id="after" src="/fixture?mode=after"></iframe></section></div><details><summary>Source and generated CSS</summary><p><a href="/recipes.css">Authoring definitions</a> · <a href="/consumer.css">Generated call sites</a> · <a href="/after.css">Ordinary CSS</a> · <a href="/results.json">Verification evidence</a></p></details><p>Three recipe fixtures exercise typography, geometry and scoped variables. They are not the three application themes planned for THEME-08.</p></main><script>const a=document.querySelector('#appearance'),s=document.querySelector('#size'),d=document.querySelector('#delivery');function update(){for(const mode of ['before','after'])document.querySelector('#'+mode).src='/fixture?mode='+(mode==='before'?'before':d.value)+'&appearance='+a.value+'&size='+s.value}for(const x of [a,s,d])x.addEventListener('change',update);if(new URLSearchParams(location.search).has('progress-report')){const link=document.createElement('a');link.id='return';link.href='http://127.0.0.1:4177/#review-theme-07';link.textContent='Progress Report';document.body.append(link)}</script></html>`;
const server = createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');const path=url.pathname;
    if(path.startsWith('/packages/') && path.endsWith('.js')){
      const base=resolve(root,'packages'),file=resolve(root,path.slice(1));if(!file.startsWith(base+sep))throw new Error('Invalid path');
      res.setHeader('Content-Type','text/javascript');res.end(await readFile(file));return;
    }
    if(path.startsWith('/vendor/')){
      const base=resolve(root,'node_modules'),file=resolve(base,path.slice(8));if(!file.startsWith(base+sep))throw new Error('Invalid path');
      res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':'text/plain');res.end(await readFile(file));return;
    }
    if(path==='/fixture'){
      const mode=url.searchParams.get('mode')||'after',appearance=url.searchParams.get('appearance')==='dark'?'dark':'light',size=['small','large'].includes(url.searchParams.get('size'))?url.searchParams.get('size'):'medium';
      const content=mode==='before'||mode==='after'?`<link rel="stylesheet" href="/${mode}.css"><style>${sharedCSS}</style>${markup(appearance,size)}`:mode==='js'?`<pilot-js appearance="${appearance}" size="${size}"></pilot-js>`:ssrHTML(appearance,size);
      const script=['js','hydrate'].includes(mode)?`<script type="module">${clientScript}</script>`:'';
      res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>THEME-07 ${mode}</title><style>body{margin:0;font-family:system-ui}</style>${importMap}</head><body>${content}${script}</body></html>`);return;
    }
    if(path==='/'){res.setHeader('Content-Type','text/html');res.end(productionAuthoring?preview.replace('This pilot changes no production component or theme.','The CSS-authored production typography and surface exports preserve consumer behavior.').replace('THEME-07 · LOCAL EXPERIMENT','THEME-07 · CSS AUTHORING').replace('Generated call sites','CSS source call sites'):preview);return;}
    if(path==='/recipes.css'){res.setHeader('Content-Type','text/css');res.end(inputs.map(i=>i.css).join('\n'));return;}
    if(['/before.css','/after.css','/consumer.css','/styles.mjs','/results.json'].includes(path)){
      res.setHeader('Content-Type',path.endsWith('.mjs')?'text/javascript':path.endsWith('.json')?'application/json':'text/css');res.end(await readFile(resolve(output,path.slice(1))));return;
    }
    res.statusCode=404;res.end('Not found');
  }catch(error){res.statusCode=500;res.end(error.message);}
});
const serve = process.argv.includes('--serve');
await new Promise(resolve=>server.listen(serve?(productionAuthoring?47917:47907):0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
if(serve){console.log(`THEME-07 pilot: ${origin}/?progress-report`);}
else{
 const results=[];
 try{
  for(const [engineName,browserType] of Object.entries({chromium,firefox,webkit})){
   const browser=await browserType.launch();
   try{
    const pages=await Promise.all(['before','after','js','ssr','hydrate'].map(async mode=>({mode,page:await browser.newPage()})));
    for(const appearance of ['light','dark'])for(const size of ['small','medium','large']){
     const readings=[];
     for(const {mode,page} of pages){
      const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
      await page.goto(`${origin}/fixture?mode=${mode}&appearance=${appearance}&size=${size}`);
      if(['js','hydrate'].includes(mode))await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
      const read=()=>page.locator('[data-probe]').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return {id:n.dataset.probe,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,radius:s.borderTopLeftRadius,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height};}));
      readings.push(await read());assert.equal(readings.at(-1).length,70,`${engineName} ${mode} probe count`);assert.deepEqual(errors,[]);page.off('pageerror',listener);
     }
     for(let i=1;i<readings.length;i++)assert.deepEqual(readings[i],readings[0],`${engineName} ${appearance} ${size} ${pages[i].mode}`);
     const radius = id=>readings[0].find(r=>r.id===id).radius;
     assert.notEqual(radius('t0-radius'),radius('t2-radius'));
     assert.equal(radius('t1-radius'),'0px');
     assert.equal(readings[0].find(r=>r.id==='p0-body').font,'cursive');
     const scale={small:.9375,medium:1,large:1.125}[size];
     assert.equal(parseFloat(readings[0].find(r=>r.id==='t0-body').size),(18+(appearance==='dark'?1:0))*scale);
     assert.equal(parseFloat(readings[0].find(r=>r.id==='n2-body').size),(18+(appearance==='light'?1:0))*scale);
     assert.notEqual(readings[0].find(r=>r.id==='t0-body').font,readings[0].find(r=>r.id==='n0-body').font);
     results.push({engine:engineName,appearance,size,paths:pages.map(p=>p.mode),probes:70,parity:true});
    }
    // Live local changes must not bake in recipe arguments or affect a sibling.
    for(const {mode,page} of pages){
      const live=await page.evaluate(()=>{
       const root=document.querySelector('pilot-js,pilot-ssr')?.shadowRoot||document;
       const outside=root.querySelector('[data-probe="t2-radius"]'),node=root.querySelector('#theme-0');
       const before=getComputedStyle(outside).borderRadius;
       node.style.setProperty('--en-radius-container-large','70px');
       return {radius:getComputedStyle(root.querySelector('[data-probe="t0-radius"]')).borderTopLeftRadius,outsideUnchanged:before===getComputedStyle(outside).borderRadius};
      });
      assert.equal(live.outsideUnchanged,true);assert.equal(live.radius,'64px');results.push({engine:engineName,mode,case:'live-local-sibling-isolation',...live});
    }
    await pages[0].page.close();
   }finally{await browser.close();}
  }
  let metrics;
  if(productionAuthoring){metrics={startupMs,beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),beforeGzip:gzipSync(before).length,afterGzip:gzipSync(after).length};}
  else {
  const timings=(run)=>{const samples=[];for(let i=0;i<60;i++){const t=performance.now();run();if(i>=10)samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);return {medianMs:samples[25],p95Ms:samples[47],samples:50};};
  const cold={};
  for(const mode of ['baseline','pilot']){const samples=[];for(let i=0;i<7;i++){const t=performance.now();const result=JSON.parse(execFileSync(process.execPath,[fileURLToPath(new URL('./benchmark.mjs',import.meta.url)),mode],{encoding:'utf8'}));assert.equal(result.bytes,Buffer.byteLength(after));samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);cold[mode]={medianProcessMs:samples[3],samples:7};}
  metrics={cold,startupMs,baseline:timings(()=>canonicalCSS(baselineStyles().cssText)),pilot:timings(()=>compilePilot(inputs,engine)),beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),beforeGzip:gzipSync(before).length,afterGzip:gzipSync(after).length};

  }
  const report={at:new Date().toISOString(),productionAuthoring,manifest,engineDigest:engine?.sha256,cssIdentical:true,litExportIdentical:true,ssrCSSIdentical:true,metrics,browserScenarios:results.length,results,limitations:productionAuthoring?['Typography and surface recipes only; broader style migration out of scope.']:['Recipe fixtures only; external audited source needed for historical pilot.']};
  await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,browserScenarios:results.length,metrics},null,2));
 }finally{server.close();}
}
