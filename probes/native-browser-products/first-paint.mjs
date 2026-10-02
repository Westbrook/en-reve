// Actual Firefox first paint and hydration; native input with unchanged production assets.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,realpath,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {withMachineOwner} from '../../tooling/testing/machine-owner.mjs';
import {withExecutionOwner} from '../../tooling/testing/execution-owner.mjs';
import {contentInventory,inventoryDigest} from '../../tooling/evidence/setup.mjs';
import {firefox} from './firefox.mjs';
const root=resolve(import.meta.dirname,'../..'),output=process.env.EN_EXECUTION_OUTPUT;
assert.equal(process.platform,'darwin');assert(output?.startsWith('/'));await mkdir(output);
const bundle=await realpath(process.env.EN_FIREFOX_APP??'/Applications/Firefox.app');
const metadata=path=>JSON.parse(execFileSync('plutil',['-convert','json','-o','-',join(path,'Contents/Info.plist')],{encoding:'utf8'}));
const receipt={schemaVersion:1,status:'running',sourceBase:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),cases:[],host:{version:execFileSync('sw_vers',['-productVersion'],{encoding:'utf8'}).trim(),build:execFileSync('sw_vers',['-buildVersion'],{encoding:'utf8'}).trim(),arch:process.arch},scope:'Actual Firefox headless production first-paint/hydration journeys. Existing qualified build reused, no new build/install/types. DOM identity, native editing and computed accessible name/role targets; not computed descriptions/full AX, speech, IME or physical-device acceptance.'};
const save=()=>writeFile(join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n');
const children=[];
function child(file,args,name){const p=spawn(file,args,{stdio:['ignore','pipe','pipe']});let log='',error;p.stdout.on('data',x=>log+=x);p.stderr.on('data',x=>log+=x);p.once('error',e=>error=e);const closed=new Promise(r=>p.once('close',(code,signal)=>r({code,signal})));const item={p,closed,name,log:()=>log,error:()=>error};children.push(item);return item;}
async function stop(item){if(item.p.exitCode===null&&item.p.signalCode===null)item.p.kill('SIGTERM');await Promise.race([item.closed,delay(5000).then(()=>{if(item.p.exitCode===null&&item.p.signalCode===null)item.p.kill('SIGKILL');})]);await item.closed;await writeFile(join(output,item.name+'.log'),item.log());}
async function until(fn,label){let last;const deadline=Date.now()+10000;while(Date.now()<deadline){try{const value=await fn();if(value)return value;}catch(e){last=e;if(/BiDi timed out|BiDi connection closed/.test(e.message))throw e;}await delay(100);}throw Error('Timed out: '+label,{cause:last});}
async function identity(paths){const files=await contentInventory(root,paths,undefined,true,{includeModes:true});return {files,digest:inventoryDigest(files)};}
let browser,server,base,scene,gate;
const q=selector=>`document.querySelector(${JSON.stringify('#'+scene+' '+selector)})`;
async function check(expression,expected){let actual;await until(async()=>{actual=await browser.evaluate(expression);try{assert.deepEqual(actual,expected);return true;}catch{return false;}},expression+' expected '+JSON.stringify(expected));}
async function checkNode(node,source,expected){await until(async()=>{const actual=await browser.call(node,source);try{assert.deepEqual(actual,expected);return true;}catch{return false;}},source+' expected '+JSON.stringify(expected));}
async function named(role,name){
 if(gate){
  const targets={'sso:Work email':q('#sso-email')+".shadowRoot.querySelector('input')",'sso:Workspace':q('#sso-workspace')+".shadowRoot.querySelector('input')",'chat:Message':q('[data-testid=chat-composer]')+".shadowRoot.querySelector('textarea')",'selection:Project':q('en-combobox')+".shadowRoot.querySelector('input')",'settings:Layer opacity Exact value':q('en-slider')+".shadowRoot.querySelector('[part~=editor]')"};
  const expression=targets[scene+':'+name];assert(expression,'Unexpected pre-hydration target');const node=await browser.element(expression);(receipt.cases.at(-1).earlyTargets??=[]).push({role,name,sharedId:node.sharedId});return node;
 }
 return until(async()=>{const nodes=await browser.locateAcrossRoots(role,name,scene==='chat'&&name==='Send message'?q('[data-testid=chat-send]'):`document.querySelector('#${scene}')`);return nodes.length===1&&nodes[0];},role+' '+name);
}

async function key(value){await browser.actions([{type:'key',id:'keyboard',actions:[{type:'keyDown',value},{type:'keyUp',value}]}]);}
async function focus(node){await browser.call(node,'e=>{e.scrollIntoView({block:"center"});e.focus();return true;}');}
async function press(name){await focus(await named('button',name));await key('\uE007');}
async function fill(role,name,value){const node=await named(role,name);await focus(node);await browser.actions([{type:'key',id:'keyboard',actions:[{type:'keyDown',value:'\uE03D'},{type:'keyDown',value:'a'},{type:'keyUp',value:'a'},{type:'keyUp',value:'\uE03D'},{type:'keyDown',value:'\uE003'},{type:'keyUp',value:'\uE003'},...[...value].flatMap(value=>[{type:'keyDown',value},{type:'keyUp',value}])]}]);await checkNode(node,'e=>e.value',value);return node;}
const routes=[['sso','Sign-in','/workflows'],['settings','Settings','/workflows/settings'],['chat','Chat','/workflows/chat'],['selection','Selection','/workflows/selection'],['multi-step','Project brief','/workflows/multi-step'],['assets','Assets','/workflows/assets']];
async function isolated(id){scene=id;await check("document.querySelectorAll('.workflow-section').length",1);await check(`Boolean(document.querySelector('#${id}.workflow-section'))`,true);await check("document.querySelectorAll('en-navigation.section-nav > a').length",6);await check("document.querySelectorAll('en-navigation.section-nav [aria-current=page]').length",1);await check("document.querySelectorAll('.workflow-tools').length",1);await check("document.querySelectorAll('.code-disclosure').length",1);}
async function hydrated(){await check('Boolean(document.querySelector("en-workflows-app")?.hasUpdated&&!document.querySelector("en-workflows-app").hasAttribute("data-ssr"))',true);}
async function phase(label){receipt.cases.at(-1).phase=label;console.log('PHASE '+label);await save();}
async function early(id){scene=id;let release;const promise=new Promise(r=>release=r);gate={promise,release,requests:[]};const path=routes.find(r=>r[0]===id)[2];await phase('navigate without load wait');await browser.navigate(base+path,'none');await phase('inspect SSR while modules held');await check('Boolean(document.querySelector("en-workflows-app")?.hasAttribute("data-ssr"))',true);await phase('SSR found; inspect isolated scene');await isolated(id);await phase('wait for held module request');await until(()=>gate.requests.length>0,'Module requests held');await check('Boolean(customElements.get("en-workflows-app"))',false);await phase('early controls ready');}
async function enhance(){const current=gate;assert(current.requests.length>0);receipt.cases.at(-1).heldModulePaths=[...new Set(current.requests)];gate=null;current.release();await hydrated();for(const target of receipt.cases.at(-1).earlyTargets??[]){const node=await named(target.role,target.name);assert.equal(node.sharedId,target.sharedId,'Hydrated accessible target must be the original native node');}receipt.cases.at(-1).hydratedNamesAndIdentityVerified=true;}
async function selection(node,start,end){await browser.call(node,`e=>{e.setSelectionRange(${start},${end},'backward');return true;}`);}
async function retained(node,value,start,end){await checkNode(node,'e=>({connected:e.isConnected,value:e.value,focused:e.getRootNode().activeElement===e,start:e.selectionStart,end:e.selectionEnd,direction:e.selectionDirection})',{connected:true,value,focused:true,start,end,direction:'backward'});}
const cases=[
 ['no-js-documents','All six direct/legacy SSR documents remain isolated with scripting disabled',false,async()=>{
  const result=receipt.cases.at(-1);result.documents=[];
  for(const [id,label,path] of routes)for(const suffix of ['', '.html']){
   scene=id;await browser.navigate(base+path+suffix);await isolated(id);await check('document.querySelector("en-workflows-app").hasAttribute("data-ssr")',true);await check('Boolean(customElements.get("en-workflows-app"))',false);await check('location.pathname',path+suffix);
   const nav=await browser.locateAcrossRoots('navigation','Workflow sections','document.querySelector("en-navigation.section-nav")');assert.equal(nav.length,1);
   for(const [,destination,destinationPath] of routes){const links=await browser.locateAcrossRoots('link',destination,'document.querySelector("en-navigation.section-nav")');assert.equal(links.length,1);assert.equal(await browser.call(links[0],'e=>new URL(e.href).pathname'),destinationPath);if(destination===label)await checkNode(links[0],'e=>e.getAttribute("aria-current")','page');}
   if(id==='sso'){await checkNode(await named('textbox','Workspace'),'e=>e.value','');await fill('textbox','Work email','before@example.test');await check('Boolean(customElements.get("en-text-field"))',false);}
   if(id==='settings')await checkNode(await named('spinbutton','Layer opacity Exact value'),'e=>e.value','64');
   if(id==='chat')await checkNode(await named('textbox','Message'),'e=>e.value','Make the cover image a little stronger.\nKeep the text easy to read.');
   if(id==='selection')await checkNode(await named('combobox','Project'),'e=>e.value','Studio North · Autumn campaign');
   result.documents.push({id,path:path+suffix,isolated:true,unhydrated:true});
  }
 }],
 ['sso-hydration','Early account drafts preserve native identity, focus and selection and submit exact values',true,async()=>{
  await early('sso');await phase('type early account');const email=await fill('textbox','Work email','before@example.test');const workspace=await fill('textbox','Workspace','Before modules studio');await selection(workspace,2,8);await phase('release modules');await enhance();await phase('assert hydrated account');await retained(workspace,'Before modules studio',2,8);await checkNode(email,'e=>e.value','before@example.test');
  assert.deepEqual(await browser.evaluate(`Object.fromEntries(new FormData(${q('form[data-sso-form=account]')}))`),{workspace:'Before modules studio',email:'before@example.test'});await focus(email);await key('\uE007');await checkNode(await named('heading','Choose your sign-in provider'),'e=>e.getRootNode().activeElement===e',true);await check('document.querySelector("#sso").textContent.includes("Before modules studio")',true);await check('document.querySelector("#sso").textContent.includes("before@example.test")',true);
 }],
 ['chat-hydration','Early chat draft preserves native identity and selection and sends its exact text',true,async()=>{
  await early('chat');const value='A chat draft written before modules load.';const input=await fill('textbox','Message',value);await selection(input,2,9);await enhance();await retained(input,value,2,9);assert.equal((await browser.locateAcrossRoots('article','You message','document.querySelector("#chat")')).length,0);await press('Send message');await check('Boolean('+q('[data-testid="chat-adjustment"]')+')',true);assert.equal((await browser.locateAcrossRoots('article','You message','document.querySelector("#chat")')).length,1);await check(`${q('[data-testid="chat-transcript"]')}.textContent.includes(${JSON.stringify(value)})`,true);
 }],
 ['selection-hydration','Early project query preserves editing without accepting a new project',true,async()=>{
  await early('selection');const input=await fill('combobox','Project','Studio');await selection(input,1,4);await enhance();await retained(input,'Studio',1,4);await checkNode(input,'e=>e.getAttribute("aria-expanded")','false');await check(q('[data-selection-accepted]')+'.textContent.trim()','Studio North · Autumn campaign · project-01');await check(`new FormData(${q('form')}).get('project')`,'project-01');await check(q('[data-selection-submission]')+'.textContent.trim()','No assignment submitted.');await key('\uE00C');await checkNode(input,'e=>e.value','Studio North · Autumn campaign');
 }],
 ['settings-hydration','Early invalid numeric draft survives enhancement without changing accepted form data',true,async()=>{
  await early('settings');const input=await fill('spinbutton','Layer opacity Exact value','101');await enhance();await checkNode(input,'e=>({connected:e.isConnected,value:e.value,focused:e.getRootNode().activeElement===e})',{connected:true,value:'101',focused:true});await check(`new FormData(${q('form')}).get('opacity')`,'64');await check(q('[data-settings-current]')+'.textContent.trim()','64% opacity · PNG · Portrait · Background included');await key('\uE00C');await checkNode(input,'e=>e.value','64');
 }],
];
try{await withMachineOwner(()=>withExecutionOwner(root,async()=>{
 const inputs=['dist','probes/native-browser-products/first-paint.mjs','probes/native-browser-products/firefox.mjs','apps/docs/tests/workflows.spec.ts','apps/docs/tests/selection.spec.ts'];
 const before=await identity([bundle,...inputs]);await writeFile(join(output,'identity-before.json'),JSON.stringify(before,null,2)+'\n');receipt.identityBefore=before.digest;const app=metadata(bundle);receipt.product={name:'Firefox',version:app.CFBundleShortVersionString,build:app.CFBundleVersion,bundle};
 server=createServer(async(req,res)=>{try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/__probe__/script-state.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Scripting canary</title><script>document.documentElement.dataset.inlineScript="ran"</script><script src="/__probe__/external.js"></script><noscript>Scripting disabled</noscript>');return;}
  if(path==='/__probe__/external.js'){res.setHeader('Content-Type','text/javascript');res.end('document.documentElement.dataset.externalScript="ran"');return;}
  if(path==='/')path='/index.html';if(!extname(path))path+='.html';const file=resolve(root,'dist','.'+path);assert(file.startsWith(join(root,'dist')+'/'));const real=await realpath(file);assert(real.startsWith(join(root,'dist')+'/'));assert((await stat(real)).isFile());
  if(gate&&extname(file)==='.js'){gate.requests.push(path);await gate.promise;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[extname(file)]??'application/octet-stream');res.end(await readFile(real));
 }catch{if(!res.destroyed)res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 for(const [id,title,javaScriptEnabled,run] of cases){const result={id,title,javaScriptEnabled,status:'running'};receipt.cases.push(result);await save();const caseOutput=join(output,id);await mkdir(caseOutput);console.log('START '+id);
  try{browser=await firefox({bundle,output:caseOutput,metadata,child:(file,args,name)=>child(file,args,id+'-'+name),until,stop,javaScriptEnabled});assert.equal(browser.capabilities.browserVersion,app.CFBundleShortVersionString);result.capabilities=browser.capabilities;await browser.setViewport({width:1280,height:900});
   if(javaScriptEnabled)await browser.addPreload('()=>{window.probeErrors=[];addEventListener("error",e=>probeErrors.push(e.message));addEventListener("unhandledrejection",e=>probeErrors.push(String(e.reason)));const original=console.error;console.error=(...args)=>{probeErrors.push(args.map(String).join(" "));original.apply(console,args);};}');
   await browser.navigate(base+'/__probe__/script-state.html');result.scriptCanary=await browser.evaluate('({inline:document.documentElement.getAttribute("data-inline-script"),external:document.documentElement.getAttribute("data-external-script")})');assert.deepEqual(result.scriptCanary,javaScriptEnabled?{inline:'ran',external:'ran'}:{inline:null,external:null});
   await run();if(javaScriptEnabled)assert.deepEqual(await browser.evaluate('probeErrors'),[]);result.status='passed';
  }catch(error){result.status='failed';result.error=String(error.stack??error);try{result.diagnostic=await browser?.evaluate('({url:location.href,errors:window.probeErrors,body:document.body.innerText})');}catch{};throw error;}
  finally{gate?.release();gate=null;await browser?.close();browser=null;await save();}console.log('PASS '+id);
 }
 const after=await identity([bundle,...inputs]);await writeFile(join(output,'identity-after.json'),JSON.stringify(after,null,2)+'\n');receipt.identityAfter=after.digest;assert.equal(after.digest,before.digest);receipt.status='passed';
}));}catch(error){receipt.status='failed';receipt.error=String(error.stack??error);process.exitCode=1;}finally{gate?.release();await browser?.close();for(const item of children)await stop(item);if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}receipt.completedAt=new Date().toISOString();receipt.stats={passed:receipt.cases.filter(c=>c.status==='passed').length,failed:receipt.cases.filter(c=>c.status==='failed').length,planned:cases.length};await save();console.log(receipt.status+' '+JSON.stringify(receipt.stats));}
