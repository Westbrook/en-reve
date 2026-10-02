// Actual macOS product qualification. Playwright's patched engines remain separate.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, realpath} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {withMachineOwner} from '../../tooling/testing/machine-owner.mjs';
import {withExecutionOwner} from '../../tooling/testing/execution-owner.mjs';
import {contentInventory, inventoryDigest} from '../../tooling/evidence/setup.mjs';
import {firefox} from './firefox.mjs';
import {cohorts} from '../framework-consumption/cohorts.mjs';

const root=resolve(import.meta.dirname,'../..');
const output=process.env.EN_EXECUTION_OUTPUT, fixture=process.env.EN_FRAMEWORK_OUT;
assert(process.platform==='darwin','This product acquisition targets macOS');
assert(output?.startsWith('/') && fixture?.startsWith('/'),'Absolute EN_EXECUTION_OUTPUT and retained EN_FRAMEWORK_OUT are required');
const firefoxApp=process.env.EN_FIREFOX_APP??'/Applications/Firefox.app';
assert(firefoxApp.startsWith('/')&&firefoxApp.endsWith('.app'),'EN_FIREFOX_APP must be an absolute app bundle path');
const selected=process.argv[2]??'both';assert(['both','safari','firefox'].includes(selected),'Use both, safari or firefox');
await mkdir(output); // A new run never overwrites evidence.
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const receipt={schemaVersion:1,startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,fixture,products:[],cases:[],status:'running',selectedProducts:selected,scope:'Six native-input consumer scenarios per cohort, plus Firefox BiDi accessible-name/role queries. Not full Playwright accessible-description parity, whole accessibility-tree/speech, all workflows, a complete product/OS matrix or physical-device qualification.'};
const save=()=>writeFile(join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n');
const children=[];
function child(file,args,name){
 const p=spawn(file,args,{stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',x=>log+=x);p.stderr.on('data',x=>log+=x);
 const closed=new Promise(resolve=>p.once('close',(code,signal)=>resolve({code,signal})));let spawnError;
 p.once('error',e=>spawnError=e);const item={p,closed,name,log:()=>log,error:()=>spawnError};children.push(item);return item;
}
async function until(action,label){let last;for(let i=0;i<100;i++){try{const v=await action();if(v)return v;}catch(e){last=e;}await delay(100);}throw Error('Timed out: '+label,{cause:last});}
async function stop(item){if(item.p.exitCode===null && item.p.signalCode===null)item.p.kill('SIGTERM');await Promise.race([item.closed,delay(5000).then(()=>{if(item.p.exitCode===null && item.p.signalCode===null)item.p.kill('SIGKILL');})]);await item.closed;await writeFile(join(output,item.name+'.log'),item.log());}
function portServer(handler){return new Promise((resolve,reject)=>{const s=createServer(handler);s.once('error',reject);s.listen(0,'127.0.0.1',()=>resolve(s));});}
async function freePort(){const s=await portServer((_,r)=>r.end());const port=s.address().port;await new Promise(r=>s.close(r));return port;}
function metadata(path){return JSON.parse(execFileSync('plutil',['-convert','json','-o','-',join(path,'Contents/Info.plist')],{encoding:'utf8'}));}
async function identity(paths){const files=await contentInventory(root,paths,undefined,true,{includeModes:true});return {files,digest:inventoryDigest(files)};}

async function safari(){
 const port=await freePort(),driver=child('/usr/bin/safaridriver',['--port',String(port)],'safari-driver');
 const base='http://127.0.0.1:'+port;
 async function request(path,body,method=body===undefined?'GET':'POST'){
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const json=await response.json();if(!response.ok||json.value?.error)throw Error(JSON.stringify(json));return json.value;
 }
 await until(async()=>{if(driver.error())throw driver.error();return (await request('/status')).ready;},'Safari driver');
 const session=await request('/session',{capabilities:{alwaysMatch:{browserName:'safari'}}});const prefix='/session/'+session.sessionId;
 const handle=await request(prefix+'/window');await request(prefix+'/window',{handle});await request(prefix+'/window/rect',{width:1100,height:900});
 return {capabilities:session.capabilities,headless:false,
  navigate:url=>request(prefix+'/url',{url}),
  evaluate:async expression=>{const value=await request(prefix+'/execute/async',{script:'const done=arguments[arguments.length-1]; Promise.resolve().then(()=>eval(arguments[0])).then(value=>done({ok:true,value}),error=>done({ok:false,error:String(error)}));',args:[expression]});if(!value.ok)throw Error(value.error);return value.value;},
  actions:actions=>request(prefix+'/actions',{actions}),
  close:async()=>{await request(prefix,undefined,'DELETE');await stop(driver);},
 };
}
const firefoxSession=bundle=>firefox({bundle,output,metadata,child,until,stop});

const el=(id,selector)=>`document.querySelector(${JSON.stringify('#'+id)})${selector?`.shadowRoot.querySelector(${JSON.stringify(selector)})`:''}`;
async function ready(b,expression){await until(()=>b.evaluate(`Boolean(${expression})`),expression);}
async function click(b,expression){
 const point=await b.evaluate(`(()=>{const e=${expression};if(!e?.isConnected)throw Error('Missing click target');e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('Invisible click target');return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);
 await b.actions([{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',origin:'viewport',...point},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]);
}
async function key(b,value){await b.actions([{type:'key',id:'keyboard',actions:[{type:'keyDown',value},{type:'keyUp',value}]}]);}
async function state(b,expression,expected){await until(async()=>{const actual=await b.evaluate(expression);try{assert.deepEqual(actual,expected);return true;}catch{return false;}},'state '+expression);assert.deepEqual(await b.evaluate(expression),expected);}
async function accessible(b,role,name,count,startExpression){await until(async()=> (await b.locateAccessible(role,name,startExpression)).length===count,`accessible ${role}: ${name} (${count})`);}
async function hydrate(b){await b.evaluate(`(()=>{window.observedErrors=[];addEventListener('error',e=>observedErrors.push(e.message));addEventListener('unhandledrejection',e=>observedErrors.push(String(e.reason)));window.hydrateFixture().catch(error=>observedErrors.push(String(error)));return true;})()`);await ready(b,`document.documentElement.dataset.ready==='true'`);}
const scenarios=[
 ['SSR node identity and native checkbox',async b=>{
  await ready(b,el('island-checkbox','input'));
  await b.evaluate(`(()=>{const host=${el('island-checkbox')},select=${el('island-select')};window.before={host,root:host.shadowRoot,input:host.shadowRoot.querySelector('input'),select,selectInput:select.shadowRoot.querySelector('select')};return true;})()`);
  await hydrate(b);
  assert.deepEqual(await b.evaluate(`[before.host===${el('island-checkbox')},before.root===before.host.shadowRoot,before.input===${el('island-checkbox','input')},before.select===${el('island-select')},before.selectInput===${el('island-select','select')}]`),[true,true,true,true,true]);
  await click(b,el('island-checkbox','input'));await state(b,el('island-checkbox','input')+'.checked',true);
 }],
 ['Cancelable accept, reject, supersede and keyboard activation',async b=>{
  await hydrate(b);const checkbox=el('island-checkbox','input');
  await click(b,checkbox);await state(b,checkbox+'.checked',true);
  await click(b,el('reject-mode'));await click(b,checkbox);await state(b,checkbox+'.checked',true);
  await click(b,el('supersede-mode'));await click(b,checkbox);await state(b,checkbox+'.checked',false);
  assert.deepEqual(await b.evaluate('window.fixture.events'),[
   {type:'en-change',previous:false,proposed:true,observed:true,cancelable:true},
   {type:'en-change',previous:true,proposed:false,observed:false,cancelable:true},
   {type:'en-change',previous:true,proposed:false,observed:false,cancelable:true}]);
  await click(b,el('accept-mode'));await b.evaluate(`(${checkbox}.focus(),true)`);await key(b,' ');await state(b,checkbox+'.checked',true);
 }],
 ['Framework property updates, native editing and listener disposal',async b=>{
  await hydrate(b);const input=el('client-field','input');await state(b,input+'.value','Initial brief');
  if(b.locateAccessible)await accessible(b,'textbox','Project title',1,el('client-field')+'.shadowRoot');
  await state(b,el('client-field')+`.querySelector('[slot=description]').textContent`,'Framework supplied description');
  await click(b,el('client-toggle'));await state(b,el('client-checkbox','input')+'.checked',true);
  await click(b,el('client-update'));await state(b,input+'.value','Revised brief');
  assert.deepEqual(await b.evaluate(el('client-tree')+'.items.map(x=>({key:x.key,label:x.label}))'),[{key:'export',label:'Export artwork'}]);
  assert.equal(await b.evaluate(el('client-tree')+`.getAttribute('items')`),null);
  assert.deepEqual(await b.evaluate('fixture.clientEvents'),[]);
  await click(b,input);await b.evaluate(`(${input}.setSelectionRange(0,${input}.value.length),true)`);
  for(const character of 'Edited')await key(b,character);await state(b,input+'.value','Edited');
  await b.evaluate(`(window.detachedTree=${el('client-tree')},true)`);
  await click(b,el('client-mount'));await state(b,`Boolean(${el('client-tree')})`,false);
  // Synthetic dispatch specifically probes listener disposal, not user activation.
  await b.evaluate(`detachedTree.dispatchEvent(new CustomEvent('en-change',{detail:{proposed:{selectedKey:'stale'}}}))`);
  assert.deepEqual(await b.evaluate('fixture.clientEvents'),[]);
  await click(b,el('client-mount'));await state(b,input+'.value','Revised brief');
  await state(b,el('client-checkbox','input')+'.checked',true);
  const item=el('client-tree','[role=treeitem]');await b.evaluate(`(${item}.focus(),true)`);await key(b,'\uE007');
  await state(b,el('client-tree-state')+'.textContent','export');
  assert.deepEqual(await b.evaluate('fixture.clientEvents'),['export']);
  assert.equal(await b.evaluate(el('client-tree')+'!==detachedTree'),true);
 }],

 ['Framework-owned checkbox state, cancellation and keyboard input',async b=>{
  await hydrate(b);const checkbox=el('client-checkbox','input');await state(b,checkbox+'.checked',false);
  await click(b,el('client-toggle'));await state(b,checkbox+'.checked',true);
  await click(b,checkbox);await state(b,checkbox+'.checked',false);
  await click(b,el('client-toggle'));await state(b,checkbox+'.checked',true);
  await click(b,el('reject-mode'));await click(b,checkbox);await state(b,checkbox+'.checked',true);
  await click(b,el('supersede-mode'));await click(b,checkbox);await state(b,checkbox+'.checked',true);
  await click(b,el('accept-mode'));await click(b,checkbox);await state(b,checkbox+'.checked',false);
  await b.evaluate(`(${checkbox}.focus(),true)`);await key(b,' ');await state(b,checkbox+'.checked',true);
 }],
 ['Authored choices update while native select and keyboard editing persist',async b=>{
  await hydrate(b);const select=el('island-select','select');
  await b.evaluate(`(window.nativeSelect=${select},true)`);
  await click(b,el('add-option'));
  await state(b,`Array.from(${select}.options,o=>o.textContent)`,['SVG','PNG','PDF']);
  await b.evaluate(`(${select}.focus(),true)`);await key(b,'\uE010');await key(b,'\uE007');
  await state(b,select+'.value','pdf');await state(b,el('island-select')+'.value','pdf');
  await click(b,el('remove-option'));
  await state(b,`Array.from(${select}.options,o=>o.textContent)`,['SVG','PNG']);
  await b.evaluate(`(${select}.focus(),true)`);await key(b,'\uE010');await key(b,'\uE007');
  await state(b,select+'.value','png');await state(b,el('island-select')+'.value','png');
  assert.equal(await b.evaluate(`nativeSelect===${select}`),true);
 }],
 ['Tree property updates and pointer selection reach framework state',async b=>{
  await hydrate(b);const tree=el('client-tree'),item=el('client-tree','[role=treeitem]');
  await state(b,item+'.textContent.trim()','Project artwork');
  if(b.locateAccessible)await accessible(b,'treeitem','Project artwork',1,tree+'.shadowRoot');
  await click(b,el('client-update'));await state(b,item+'.textContent.trim()','Export artwork');
  assert.deepEqual(await b.evaluate('fixture.clientEvents'),[]);
  if(b.locateAccessible){
   await accessible(b,'treeitem','Project artwork',0,tree+'.shadowRoot');
   await accessible(b,'treeitem','Export artwork',1,tree+'.shadowRoot');
  }
  await click(b,item);await state(b,el('client-tree-state')+'.textContent','export');
  assert.deepEqual(await b.evaluate(`({items:${tree}.items.map(x=>({key:x.key,label:x.label})),selected:${tree}.selectedKey,attribute:${tree}.getAttribute('items')})`),{items:[{key:'export',label:'Export artwork'}],selected:'export',attribute:null});
  assert.deepEqual(await b.evaluate('fixture.clientEvents'),['export']);
 }],

];

let server;
try {await withMachineOwner(()=>withExecutionOwner(root,async()=>{
 const preparation=JSON.parse(await readFile(join(fixture,'preparation.json'),'utf8'));
 assert.deepEqual(Object.keys(preparation.consumers).sort(),cohorts.map(c=>c.id).sort());
 // Reuse exact already-packed artifacts, never call this a fresh installation.
 for(const consumer of Object.values(preparation.consumers))for(const [name,digest] of Object.entries(consumer.assets))assert.equal(hash(await readFile(join(fixture,'site',name))),digest,name);
 receipt.preparationSHA256=hash(await readFile(join(fixture,'preparation.json')));
 receipt.artifactPolicy='Reuse exact hash-verified packed assets from retained acquisition; no new installation/type compilation claimed.';
 receipt.host={version:execFileSync('sw_vers',['-productVersion'],{encoding:'utf8'}).trim(),build:execFileSync('sw_vers',['-buildVersion'],{encoding:'utf8'}).trim(),arch:process.arch};
 server=await portServer(async(req,res)=>{try{const name=new URL(req.url,'http://127.0.0.1').pathname;if(!/^\/[a-z0-9-]+\.(html|js|json)$/.test(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(await readFile(join(fixture,'site',name.slice(1))));}catch{res.writeHead(404).end();}});
 const url='http://127.0.0.1:'+server.address().port;
 for(const [name,start,path] of [['Safari',safari,'/Applications/Safari.app'],['Firefox',firefoxSession,firefoxApp]].filter(([name])=>selected==='both'||name.toLowerCase()===selected)){
  const bundle=await realpath(path),plist=metadata(bundle),paths=[bundle];if(name==='Safari')paths.push(await realpath('/usr/bin/safaridriver'));
  const before=await identity(paths);await writeFile(join(output,name+'-identity-before.json'),JSON.stringify(before,null,2)+'\n');
  const product={name,version:plist.CFBundleShortVersionString,build:plist.CFBundleVersion,bundle,identityDigest:before.digest,identityPolicy:name==='Safari'?'Safari app and safaridriver bytes plus exact macOS build; OS WebKit system frameworks are not fully hashed.':'Full selected Firefox application distribution.',status:'running'};receipt.products.push(product);await save();
  let b;
  try{
   b=await start(bundle);product.capabilities=b.capabilities;product.headless=b.headless;product.accessibilityQueryScope=b.locateAccessible?'Browser-computed names/roles through BiDi accessibility locator; no description or whole-tree claim.':'No accessibility locator implemented for this protocol.';assert.equal(b.capabilities.browserVersion,product.version);
   for(const {id} of cohorts)for(const [scenario,test] of scenarios){
    const result={product:name,cohort:id,scenario,status:'running'};receipt.cases.push(result);console.log(name+' '+id+' '+scenario);
    try{await b.navigate(`${url}/${id}.html?defer`);await test(b);assert.deepEqual(await b.evaluate('observedErrors'),[]);result.status='passed';}
    catch(error){result.status='failed';result.error=String(error.stack??error);try{result.diagnostic=await b.evaluate(`({ready:document.documentElement.dataset.ready,errors:window.observedErrors,fixture:Boolean(window.fixture),client:Boolean(document.querySelector('#client-checkbox')),visibility:document.visibilityState,body:document.body.innerText})`);}catch(diagnostic){result.diagnosticError=String(diagnostic);}if(b.locateAccessible){try{result.accessibilityDiagnostic={textboxes:await b.locateAccessible('textbox'),treeitems:await b.locateAccessible('treeitem')};}catch(e){result.accessibilityDiagnosticError=String(e);}}throw error;}finally{await save();}
   }product.status='passed';
  }finally{
   await b?.close();const after=await identity(paths);await writeFile(join(output,name+'-identity-after.json'),JSON.stringify(after,null,2)+'\n');product.unchanged=before.digest===after.digest;assert(product.unchanged,'Product distribution changed during acquisition');await save();
  }
 }
 receipt.status='passed';
}));}catch(error){receipt.status='failed';receipt.error=String(error.stack??error);process.exitCode=1;}finally{
 for(const item of children)await stop(item);if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
 receipt.completedAt=new Date().toISOString();receipt.stats={passed:receipt.cases.filter(c=>c.status==='passed').length,failed:receipt.cases.filter(c=>c.status==='failed').length,planned:cohorts.length*scenarios.length*(selected==='both'?2:1)};await save();console.log(receipt.status+' '+JSON.stringify(receipt.stats));
}
