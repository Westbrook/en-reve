import {chromium,firefox,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {ownedRun,newResult,assertMissing} from './config.mjs';
const config=await ownedRun();const url=process.env.EN_DIAGNOSTICS_URL;
if(!url||new URL(url).hostname!=='127.0.0.1')throw Error('Owned localhost server URL required.');
if((await fetch(url+'/diagnostic-run.json').then(r=>r.json())).runId!==config.id)throw Error('Server run identity mismatch.');
await assertMissing(join(config.output,'conformance.json'));

const results=[];
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 if(!config.browsers.includes(name)){results.push({name,status:'skipped',reason:'Engine not selected by caller',cases:[],errors:[]});continue;}
 let browser;try {browser=await engine.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const cases=await page.evaluate(async()=>{
  const A=await import('/api.js');const checks=[];
  const check=(name,pass,detail)=>{checks.push({name,status:pass?'passed':'failed',pass,detail});};
  for(const requested of ['auto','global'])for(const shadow of [false,true]) {
   const scope=A.createElementScope({document,registry:requested});
   const host=scope.createElement('section');document.body.append(host);const root=shadow?scope.attachShadow(host):host;
   const tag=`diagnostic-${requested}-${shadow?'shadow':'light'}`;class Item extends HTMLElement {}
   const item=scope.createElement(tag);root.append(item);
   const loaders=Object.freeze({[tag]:async()=>({tagName:tag,elementClass:Item})});const loader=A.createDefinitionLoader(scope.registry,loaders);
   const d=A.createRegistryDiagnostic({scope,requested,roots:[root],instances:[item],tags:[tag,tag]});
   let s=d.snapshot();check(`${requested}/${shadow}/initial`,s.actual===scope.mode&&s.declared.length===1&&!s.declared[0].definitionAvailable&&s.instances[0].upgrade==='unknown',s);
   await d.observe('module',()=>loader.load([tag]));s=d.snapshot();check('load is not definition',!s.declared[0].definitionAvailable&&s.milestones.module.state==='fulfilled');
   await d.observe('registration',()=>loader.ensure([tag]));s=d.snapshot();check('registration not readiness',s.declared[0].definitionAvailable&&s.instances[0].upgrade==='matches-scope-constructor'&&!s.milestones.readiness);
   d.observeSync('registration',()=>scope.register([{tagName:tag,elementClass:Item}]));
   let collision=false;try{d.observeSync('registration',()=>scope.register([{tagName:tag,elementClass:class extends HTMLElement {}}]));}catch{collision=true;}
   check('conflict preserved and actionable',collision&&d.snapshot().milestones.registration.state==='failed'&&scope.get(tag)===Item);
   check('association uses owning realm',s.roots[0].association==='scope'&&s.roots[0].ownerDocument==='scope-document');
   d.dispose();check('dispose clears all handles',Object.values(d.snapshot().handles).every(n=>n===0)&&!d.snapshot().declared.length);host.remove();
  }
  const scope=A.createElementScope({document});const cap=A.elementScopeCapabilities(document);
  check('actual fallback evidence',scope.mode===(cap.native?'scoped':'global'),{cap,actual:scope.mode});
  if(cap.native){
   const nullRoot=document.createElement('section',{customElementRegistry:null});nullRoot.innerHTML='<diagnostic-null></diagnostic-null>';document.body.append(nullRoot);
   const nullShadowHost=document.createElement('div',{customElementRegistry:null});nullRoot.append(nullShadowHost);const nullShadow=nullShadowHost.attachShadow({mode:'open',customElementRegistry:null});
   const item=nullRoot.firstElementChild;class NullItem extends HTMLElement {}
   const d=A.createRegistryDiagnostic({scope,requested:'auto',roots:[nullRoot,nullShadow],instances:[item],tags:['diagnostic-null']});
   scope.register([{tagName:'diagnostic-null',elementClass:NullItem}]);let s=d.snapshot();
   check('null is authoritative after definition',s.roots.every(r=>r.association==='intentional-null')&&s.declared[0].definitionAvailable&&s.instances[0].upgrade==='not-matching-scope-constructor');
   scope.initialize(nullRoot);scope.upgrade(nullRoot);s=d.snapshot();check('initialization excludes null shadow',s.roots[0].association==='scope'&&s.roots[1].association==='intentional-null'&&s.instances[0].upgrade==='matches-scope-constructor');
   scope.initialize(nullShadow);check('explicit shadow initialization',d.snapshot().roots[1].association==='scope');
   const foreign=A.createElementScope({document});const globalNode=document.createElement('div');const other=foreign.createElement('div');
   const mismatch=A.createRegistryDiagnostic({scope,requested:'auto',roots:[globalNode,other],tags:[]}).snapshot();check('ownership mismatch visible',mismatch.roots[0].association==='owner-global'&&mismatch.roots[1].association==='other-registry');
   nullRoot.remove();d.dispose();
  }else checks.push({name:'Native null construction',status:'skipped',reason:'Native capability unavailable; actual global fallback remains tested.'});
  const iframe=document.createElement('iframe');document.body.append(iframe);const doc=iframe.contentDocument;
  const owner=A.createElementScope({document:doc});const ownerRoot=owner.createElement('div');doc.body.append(ownerRoot);
  const ownerD=A.createRegistryDiagnostic({scope:owner,requested:'auto',roots:[ownerRoot,document.createElement('div')],tags:[]});
  check('iframe owner realm',ownerD.snapshot().roots[0].association==='scope'&&ownerD.snapshot().roots[1].ownerDocument==='other-document');
  iframe.remove();ownerD.dispose();
  // Actual controller and controlled import/ready gates; diagnostic never wraps a manifest.
  for(const requested of ['auto','global']) {
   const scope=A.createElementScope({document,registry:requested});const tag='diagnostic-activation-'+requested;
   const root=scope.mode==='scoped'?document.createElement('section',{customElementRegistry:null}):document.createElement('section');
   const template=document.createElement('template');template.innerHTML=`<${tag}></${tag}>`;
   if(scope.mode==='scoped')root.innerHTML=template.innerHTML;document.body.append(root);
   let release,readyEntered;const gate=new Promise(r=>release=r);const entered=new Promise(r=>readyEntered=r);
   class Item extends HTMLElement{};const loaders=Object.freeze({[tag]:async()=>({tagName:tag,elementClass:Item})});
   let d;const controller=A.createElementActivation({scope,root,tags:[tag],loaders,policy:'dormant',template:scope.mode==='global'?template:undefined,ready:()=>d.observe('readiness',async()=>{readyEntered();await gate;})});
   d=A.createRegistryDiagnostic({scope,requested,roots:[root],tags:[tag],controller});
   await d.observe('module',()=>controller.load());check('controller load leaves dormant',controller.state==='dormant'&&!scope.get(tag));
   const pending=d.observe('activation',()=>controller.activate()).then(()=>false,e=>e.name==='AbortError');await entered;
   check('availability not usable readiness',d.snapshot().declared[0].definitionAvailable&&d.snapshot().controllerState==='activating'&&d.snapshot().milestones.readiness.state==='pending');
   controller.cancel();check('cancel is not rollback',await pending&&d.snapshot().milestones.activation.state==='canceled'&&!!scope.get(tag));
   release();await controller.activate();check('explicit readiness completed',controller.state==='ready'&&d.snapshot().milestones.readiness.state==='fulfilled');
   controller.dispose();check('controller disposal visible',d.snapshot().controllerState==='disposed');d.dispose();root.remove();
  }
  const explicit=A.createElementScope({document,registry:scope.registry});
  check('explicit request retained',A.createRegistryDiagnostic({scope:explicit,requested:'explicit',roots:[],tags:[]}).snapshot().requested==='explicit');
  const duplicateScope=A.createElementScope({document});class Shared extends HTMLElement {}
  const duplicate=A.createRegistryDiagnostic({scope:duplicateScope,requested:'auto',roots:[],tags:['diagnostic-one','diagnostic-two']});
  let aliasFailed=false;try{duplicate.observeSync('registration',()=>duplicateScope.register([{tagName:'diagnostic-one',elementClass:Shared},{tagName:'diagnostic-two',elementClass:Shared}]));}catch{aliasFailed=true;}
  check('constructor alias preflight leaves both undefined',aliasFailed&&duplicate.snapshot().declared.every(d=>!d.definitionAvailable));
  const lookup=A.createDefinitionLoader(duplicateScope.registry,Object.freeze({}));let failure;
  try{await duplicate.observe('module',()=>lookup.load(['diagnostic-missing']));}catch(e){failure=e;}
  check('lookup failure propagated unchanged',failure?.stage==='lookup'&&duplicate.snapshot().milestones.module.state==='failed');
  let abandonedRelease;const abandoned=duplicate.observe('module',()=>new Promise(r=>abandonedRelease=r));
  const latest=duplicate.observe('module',async()=>{throw Error('latest');}).catch(()=>undefined);await latest;abandonedRelease();await abandoned;
  check('older operation cannot overwrite newer failure',duplicate.snapshot().milestones.module.state==='failed');duplicate.dispose();
  const fail=A.createRegistryDiagnostic({scope,requested:'auto',roots:[],tags:['diagnostic-private']});
  try{await fail.observe('module',async()=>{throw Error('secret-form-value /private/url');});}catch{}
  check('arbitrary error content redacted',!JSON.stringify(fail.snapshot()).includes('secret-form')&&fail.snapshot().milestones.module.state==='failed');
  for(let i=0;i<200;i++)await fail.observe('module',async()=>undefined);
  check('bounded records',Object.keys(fail.snapshot().milestones).length===1);
  let rejected=false;try{A.createRegistryDiagnostic({scope,requested:'auto',roots:Array(17).fill(document.body),tags:[]});}catch{rejected=true;}check('input limit enforced',rejected);
  let release;const pending=fail.observe('module',()=>new Promise(r=>release=r));fail.dispose();release();await pending;check('late result does not repopulate disposed observer',Object.keys(fail.snapshot().milestones).length===0);
  return checks;
 });
 // Automated DOM/focus only. No AT/device claim.
 await page.reload();await page.getByRole('button',{name:'Load module'}).focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('pre').textContent.includes('fulfilled'));
 assert.equal(await page.getByRole('button',{name:'Load module'}).evaluate(e=>e===document.activeElement),true);
 assert.equal(await page.locator('#report').isVisible(),false);
 await page.goto(url+'/?progress-report=untrusted');assert.equal(await page.locator('#report').getAttribute('href'),'http://127.0.0.1:4177');assert.equal(await page.locator('#report').isVisible(),true);
 results.push({name,status:cases.some(c=>c.status==='failed')||errors.length?'failed':'passed',version:browser.version(),capability:cases.find(c=>c.name==='actual fallback evidence')?.detail,cases,errors,keyboardFocus:'passed',returnLink:'passed'});
 }catch(error){results.push({name,status:'failed',category:'browser-or-harness',error:{name:error.name,message:error.message,stack:error.stack},cases:[],errors:[]});}
 finally{if(browser)await browser.close();}
}
await newResult(join(config.output,'conformance.json'),{schemaVersion:1,kind:'current-source-conformance',runId:config.id,results});
for(const r of results)console.log(r.name,r.status,r.cases.length,'checks');
if(!results.some(r=>r.status==='passed')||results.some(r=>r.status==='failed'))process.exitCode=1;
