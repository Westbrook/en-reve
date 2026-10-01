import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
 await page.goto('/probes/api-events/fixture.html');
 await page.waitForFunction(() => (window as any).fixtureReady);
});

test('feed pagination stages, rolls back and respects author/nested writes', async ({page}) => {
 expect(await page.evaluate(async () => {
  const feed = document.createElement('en-activity-feed');
  feed.items = Array.from({length:4}, (_,i) => ({key:String(i),author:'A',text:'Entry'}));feed.pageSize=1;
  document.body.append(feed);await feed.updateComplete;
  const log: unknown[]=[];
  feed.addEventListener('en-page-change', event => { log.push([feed.page,event.detail,Object.isFrozen(event.detail)]);event.preventDefault(); },{once:true});
  log.push(feed.goToPage(2),feed.page);
  feed.addEventListener('en-page-change', event => {feed.page=event.detail.proposed;event.preventDefault();},{once:true});
  log.push(feed.goToPage(2),feed.page);
  feed.page=1;
  feed.addEventListener('en-page-change', () => { feed.goToPage(3); },{once:true});
  log.push(feed.goToPage(2),feed.page);
  feed.page=1;
  feed.addEventListener('en-page-change', () => {feed.items=[];},{once:true});
  log.push(feed.goToPage(2),feed.page);
  return log;
 })).toEqual([[2,{previous:1,proposed:2,page:2,reason:'pagination'},true],false,1,false,2,false,3,false,1]);
});

test('feed and table expose the same tentative page shape', async ({page}) => {
 expect(await page.evaluate(async () => {
  const table=document.createElement('en-data-table');table.items=[{id:'1'},{id:'2'}];table.pageSize=1;table.columns=[{key:'id',label:'ID',renderCell:(item:any)=>item.id}];document.body.append(table);await table.updateComplete;
  let seen:unknown;
  table.addEventListener('en-page-change', event=>{seen=[table.page,event.detail];event.preventDefault();});
  table.shadowRoot!.querySelector('en-pagination')!.dispatchEvent(new CustomEvent('en-change',{detail:{proposed:2},cancelable:true}));
  return [seen,table.page];
 })).toEqual([[2,{previous:1,proposed:2,reason:'pagination'}],1]);
});

for (const terminal of ['loaded','empty','error'] as const) test(`respondWith settles ${terminal} once without legacy request`, async ({page}) => {
 expect(await page.evaluate(async terminal => {
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  const log:unknown[]=[];let legacy=0;
  feed.addEventListener('en-load',()=>legacy++);
  feed.addEventListener('en-load-state-change',event=>{event.preventDefault();log.push([event.detail.status,event.detail.requestId,event.cancelable,event.defaultPrevented]);});
  feed.addEventListener('en-load-request',event=>{
   event.respondWith(terminal==='error'?Promise.reject(new Error('offline')):Promise.resolve({items:terminal==='loaded'?[{key:'1',author:'A',text:'One'}]:[],hasMore:false,cursor:'next'}));
   event.detail.complete({items:[{key:'wrong',author:'A',text:'Ignored'}],hasMore:true});
  });
  const accepted=feed.requestOlder();await new Promise(resolve=>setTimeout(resolve,0));
  return {accepted,legacy,log,loading:feed.loading,keys:feed.items?.map(x=>x.key),error:feed.error,status:feed.loadState.status};
 },terminal)).toEqual({accepted:true,legacy:0,log:[['loading',1,false,false],[terminal,1,false,false]],loading:false,keys:terminal==='loaded'?['1']:[],error:terminal==='error'?'offline':'',status:terminal});
});

test('request veto aborts a claimed rejecting response and suppresses legacy transport', async ({page}) => {
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  let signal:AbortSignal|undefined,legacy=0,status=0;
  feed.addEventListener('en-load-request',event=>{signal=event.detail.signal;event.respondWith(Promise.reject(new Error('ignored')));});
  feed.addEventListener('en-load-request',event=>event.preventDefault());feed.addEventListener('en-load',()=>legacy++);feed.addEventListener('en-load-state-change',()=>status++);
  const accepted=feed.requestOlder();await new Promise(r=>setTimeout(r,0));return {accepted,legacy,status,aborted:signal?.aborted,loading:feed.loading};
 })).toEqual({accepted:false,legacy:0,status:0,aborted:true,loading:false});
 expect(errors).toEqual([]);
});

for(const cancel of ['cancel','replace','disconnect'] as const)test(`${cancel} aborts the request and ignores stale resolution`,async({page})=>{
 expect(await page.evaluate(async cancel=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  let complete!:(value:any)=>void,signal!:AbortSignal;const states:string[]=[];
  feed.addEventListener('en-load-state-change',e=>states.push(e.detail.status));
  feed.addEventListener('en-load-request',e=>{signal=e.detail.signal;e.respondWith(new Promise(resolve=>complete=resolve));},{once:true});
  feed.requestOlder();
  if(cancel==='cancel')feed.cancelLoad();else if(cancel==='replace')feed.items=[];else feed.remove();
  complete({items:[{key:'stale',author:'A',text:'old'}],hasMore:false});await new Promise(r=>setTimeout(r,0));
  return [states,signal.aborted,feed.items?.length,feed.loading];
 },cancel)).toEqual([['loading','idle'],true,0,false]);
});

test('legacy callbacks settle once, allow retry and are safe after await',async({page})=>{
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  let request:any;const states:unknown[]=[];
  feed.addEventListener('en-load',e=>request=e.detail);feed.addEventListener('en-load-state-change',e=>states.push([e.detail.status,e.detail.requestId]));
  feed.requestOlder();await Promise.resolve();request.fail('retry');request.complete({items:[],hasMore:false});await Promise.resolve();
  const error=feed.error;feed.requestOlder();request.complete({items:[],hasMore:false});await Promise.resolve();
  return [error,states,feed.hasMore,feed.loading];
 })).toEqual(['retry',[['loading',1],['error',1],['loading',2],['empty',2]],false,false]);
});

test('response claim is synchronous and single; new callbacks can also claim',async({page})=>{
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  const errors:string[]=[];let retained:any,legacy=0;
  feed.addEventListener('en-load',()=>legacy++);
  feed.addEventListener('en-load-request',event=>{
   retained=event;event.respondWith({items:[],hasMore:true});
   try{event.respondWith({items:[],hasMore:true});}catch(error){errors.push((error as Error).name);}
  },{once:true});
  feed.requestOlder();
  try{retained.respondWith({items:[],hasMore:true});}catch(error){errors.push((error as Error).name);}
  await Promise.resolve();await Promise.resolve();
  feed.addEventListener('en-load-request',event=>event.detail.complete({items:[],hasMore:false}),{once:true});feed.requestOlder();await Promise.resolve();
  return [errors,legacy,feed.hasMore];
 })).toEqual([['InvalidStateError','InvalidStateError'],0,false]);
});

test('canceling from a loading listener produces an ordered terminal path',async({page})=>{
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  const states:string[]=[];
  feed.addEventListener('en-load-request',e=>e.respondWith({items:[],hasMore:false}));
  feed.addEventListener('en-load-state-change',e=>{states.push(e.detail.status);if(e.detail.status==='loading')feed.cancelLoad();});
  const accepted=feed.requestOlder();await Promise.resolve();await Promise.resolve();return [accepted,states,feed.loading,feed.hasMore];
 })).toEqual([false,['loading','idle'],false,true]);
});

test('tree status events are noncancelable and preserve legacy notification',async({page})=>{
 expect(await page.evaluate(async()=>{
  const tree=document.createElement('en-tree');tree.items=[{value:'a',label:'A',lazy:true}];tree.expanded=['a'];tree.loadChildren=async()=>[];
  const modern:unknown[]=[],legacy:unknown[]=[];
  tree.addEventListener('en-load-state-change',e=>{e.preventDefault();modern.push([e.detail.key,e.detail.status,e.cancelable,e.defaultPrevented]);});
  tree.addEventListener('en-load',e=>legacy.push(e.detail.status));document.body.append(tree);await tree.updateComplete;await new Promise(r=>setTimeout(r,0));
  return [modern,legacy,tree.getBranchState('a').status];
 })).toEqual([[['a','loading',false,false],['a','empty',false,false]],['loading','empty'],'empty']);
});

test('tree cancellation during loading does not emit an obsolete legacy loading event',async({page})=>{
 expect(await page.evaluate(async()=>{
  const tree=document.createElement('en-tree');tree.items=[{value:'a',label:'A',lazy:true}];tree.expanded=['a'];let called=0;tree.loadChildren=async()=>{called++;return [];};
  const modern:string[]=[],legacy:string[]=[];
  tree.addEventListener('en-load-state-change',e=>{modern.push(e.detail.status);if(e.detail.status==='loading'){tree.expanded=[];tree.loadChildren=undefined;}});
  tree.addEventListener('en-load',e=>legacy.push(e.detail.status));document.body.append(tree);await tree.updateComplete;await new Promise(r=>setTimeout(r,0));return [modern,legacy,called];
 })).toEqual([['loading','idle'],['idle'],0]);
});

for(const tag of ['en-navigation-group','en-navigation'] as const)test(`${tag} supports vetoes, silent writes and terminal notifications`,async({page})=>{
 await page.evaluate(async tag=>{
  const host=document.createElement(tag);host.id='disclosure';if(tag==='en-navigation')(host as any).collapseAt='10000px';host.innerHTML='<a href="#target">Link</a>';document.body.append(host);await host.updateComplete;await host.updateComplete;
  (window as any).events=[];
  host.addEventListener('en-change',e=>{(window as any).events.push(['proposal',host.open,e.detail.reason]);e.preventDefault();},{once:true});
  host.addEventListener('en-toggle',e=>(window as any).events.push(['terminal',e.detail.open,e.cancelable]));
 },tag);
 await page.locator('#disclosure').locator('summary').click();
 await expect(page.locator('#disclosure')).toHaveJSProperty('open',false);
 await page.locator('#disclosure').locator('summary').press('Enter');
 await expect(page.locator('#disclosure')).toHaveJSProperty('open',true);
 await page.evaluate(async()=>{const host=document.getElementById('disclosure') as any;host.open=false;await host.updateComplete;});
 await expect.poll(()=>page.evaluate(()=>(window as any).events)).toEqual([['proposal',true,'toggle'],['terminal',true,false]]);
});

test('cancel status sees an aborted signal and reentrant retry owns the next lease',async({page})=>{
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  let signal!:AbortSignal;const states:unknown[]=[];
  feed.addEventListener('en-load-request',e=>{signal=e.detail.signal;e.respondWith(new Promise(()=>{}));},{once:true});
  feed.addEventListener('en-load-state-change',e=>{states.push([e.detail.status,e.detail.requestId,e.detail.status==='idle'?signal.aborted:null]);});
  feed.requestOlder();signal.addEventListener('abort',()=>{feed.requestOlder();},{once:true});feed.cancelLoad();
  return [states,feed.loadState.requestId,feed.loading];
 })).toEqual([[['loading',1,null],['idle',1,true],['loading',2,null]],2,true]);
});

test('invalid loaded data terminates as error without replacing existing records',async({page})=>{
 expect(await page.evaluate(async()=>{
  const feed=document.createElement('en-activity-feed');feed.items=[{key:'original',author:'A',text:'Keep'}];feed.hasMore=true;document.body.append(feed);await feed.updateComplete;
  feed.addEventListener('en-load-request',e=>e.respondWith({items:[{key:'same',author:'A',text:'1'},{key:'same',author:'A',text:'2'}],hasMore:false}));
  feed.requestOlder();await Promise.resolve();await Promise.resolve();return [feed.loadState.status,feed.loading,feed.items?.map(x=>x.key),feed.hasMore];
 })).toEqual(['error',false,['original'],true]);
});

test('events and cancellation signals use the receiving document realm',async({page})=>{
 expect(await page.evaluate(async()=>{
  const iframe=document.createElement('iframe');document.body.append(iframe);const view=iframe.contentWindow! as any;
  const feed=document.createElement('en-activity-feed');feed.items=[];feed.hasMore=true;view.document.adoptNode(feed); // Realm contract does not require mounting cross-document Lit styles.
  let realm:unknown;
  feed.addEventListener('en-load-request',e=>{realm=[e instanceof view.CustomEvent,e.detail.signal instanceof view.AbortSignal];e.respondWith({items:[],hasMore:false});});
  feed.requestOlder();await Promise.resolve();await Promise.resolve();return [realm,feed.loadState.status];
 })).toEqual([[true,true],'empty']);
});

test('compact Escape can be vetoed and native terminal toggles are not proposals',async({page})=>{
 await page.evaluate(async()=>{
  const nav=document.createElement('en-navigation');nav.id='nav';nav.collapseAt='10000px';nav.open=true;document.body.append(nav);await nav.updateComplete;await nav.updateComplete;
  (window as any).log=[];
  nav.addEventListener('en-change',e=>{(window as any).log.push(['proposal',e.detail.reason,nav.open]);e.preventDefault();},{once:true});
  nav.addEventListener('en-toggle',e=>(window as any).log.push(['terminal',e.detail.open,e.cancelable]));
 });
 await page.locator('#nav').locator('summary').press('Escape');await expect(page.locator('#nav')).toHaveJSProperty('open',true);
 await page.evaluate(()=>{(document.getElementById('nav')!.shadowRoot!.querySelector('details')!).open=false;});
 await expect(page.locator('#nav')).toHaveJSProperty('open',false);
 expect(await page.evaluate(()=>(window as any).log)).toEqual([['proposal','escape',false],['terminal',false,false]]);
});
