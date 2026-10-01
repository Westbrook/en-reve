import {performance} from 'node:perf_hooks';import {writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const isolated=process.argv.includes('--isolated'),output=process.argv.find(a=>a.startsWith('--out='))?.slice(6);
const {snapshot}=JSON.parse(await readFile(new URL('./rendered.json',import.meta.url)));
let render,dispose=()=>{};
if(isolated){const {createScopedRenderer}=await import('@en-reve/ssr/scoped.js');const renderer=createScopedRenderer({commands:{module:new URL('./island.mjs',import.meta.url),version:'1'}},{concurrency:1});render=()=>renderer.render({key:'commands',snapshot}).then(r=>r.html);dispose=()=>renderer.dispose();}
else{await import('@en-reve/ssr/install.js');const {registerDefinitions}=await import('@en-reve/primitives/interactions/registration.js');const {renderToString}=await import('@en-reve/ssr');const module=await import('./island.mjs');registerDefinitions(customElements,module.definitions);render=()=>renderToString(module.template(snapshot));}
const samples=[];try{for(let i=-5;i<30;i++){const start=performance.now(),html=await render(),durationMs=performance.now()-start;if(!html.includes('en-command-palette')||!html.includes('Settings commands'))throw Error('Missing rendered palette');if(i>=0)samples.push({index:i,durationMs,bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')});}}finally{dispose();}
await writeFile(output,JSON.stringify({at:new Date().toISOString(),isolated,node:process.version,warmups:5,samples},null,2)+'\n');
