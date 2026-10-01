import {chromium, firefox, webkit} from '@playwright/test';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {startDocsServer} from '../../apps/docs/tests/static-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distribution = resolve(process.env.EN_FAMILY_CENSUS_SITE ?? resolve(root, 'dist'));
const output = process.env.EN_FAMILY_CENSUS_OUTPUT;
if (!output) throw new Error('Set EN_FAMILY_CENSUS_OUTPUT to a fresh non-existing directory.');
const out = resolve(output);
await mkdir(out, {recursive: false});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hash = async path => digest(await readFile(path));
const sourceFiles = [
  'package-lock.json', 'plans/lazy-delivery/family-designs.json',
  'probes/lazy-delivery-families/census.mjs', 'probes/lazy-delivery-families/README.md',
  'packages/elements/src/media-viewer.ts', 'packages/elements/src/carousel.ts',
  'packages/elements/src/combobox/template.ts', 'packages/elements/src/combobox/element.ts',
  'packages/elements/src/internal/multiple-choice.ts', 'packages/elements/src/menubar.ts',
  'packages/elements/src/action-overflow.ts', 'packages/elements/src/command-palette/template.ts',
  'packages/elements/src/command-palette/element.ts', 'packages/elements/src/pagination/template.ts',
  'packages/elements/src/toast-region/element.ts', 'apps/docs/src/component-patterns.ts',
  'apps/docs/src/workflows/selection/template.ts', 'apps/docs/src/workflows/selection/model.ts',
  'apps/docs/src/workflows/settings/template.ts', 'apps/docs/src/examples.ts', 'apps/docs/src/toast-demo.ts',
];
const identity = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, await hash(resolve(root, path))])));
const frozenManifestPath = resolve(dirname(distribution), 'assets.json');
const frozenAssets = JSON.parse(await readFile(frozenManifestPath, 'utf8'));
const verifySite = async () => {
  const failures = [];
  for (const asset of frozenAssets) {
    const bytes = await readFile(resolve(distribution, asset.path));
    if (bytes.length !== asset.bytes || digest(bytes) !== asset.sha256) failures.push(asset.path);
  }
  return {files: frozenAssets.length, bytes: frozenAssets.reduce((sum, item) => sum + item.bytes, 0), manifestSha256: await hash(frozenManifestPath), failures};
};
const routes = [
  {id: 'component-patterns', path: '/component-patterns.html', targets: [
    {id: 'media', host: '#viewer', count: 1, kind: 'media', gate: {unit: 'elements', componentPercent: 75, componentAbsolute: 50, routePercent: 5, routeAbsolute: 50}},
    {id: 'multiselect', host: '#choices en-multiselect[name="teams"]', count: 1, kind: 'multiselect', gate: {unit: 'nodes', componentPercent: 40, componentElements: 24, routePercent: 10, routeElements: 24}},
    {id: 'menubar', host: 'en-menubar', count: 1, kind: 'menubar', gate: {unit: 'nodes', componentPercent: 20, componentAbsolute: 24, routePercent: 5, routeAbsolute: 32}},
    {id: 'overflow', host: 'en-action-overflow', count: 1, kind: 'overflow', gate: {unit: 'nodes', componentPercent: 20, componentAbsolute: 10, routePercent: 5, routeAbsolute: 32}},
  ]},
  {id: 'selection', path: '/workflows/selection.html', targets: [
    {id: 'combobox', host: '#selection en-combobox', count: 1, kind: 'combobox', gate: {unit: 'nodes', componentPercent: 40, componentElements: 24, routePercent: 10, routeElements: 24}},
  ]},
  {id: 'settings', path: '/workflows/settings.html', targets: [
    {id: 'command-palette', host: '#settings-command-palette', count: 1, kind: 'command', gate: {unit: 'nodes', componentPercent: 20, componentAbsolute: 20, routePercent: 2}},
  ]},
  {id: 'pagination', path: '/api-examples/pagination.html', standalone: true, targets: [
    {id: 'pagination', host: 'en-pagination', count: 8, kind: 'pagination', gate: {unit: 'nodes', componentPercent: 10, routePercent: 5, routeAbsolute: 32}},
  ]},
  {id: 'toast', path: '/api-examples/toast.html', standalone: true, targets: [
    {id: 'toast-history', host: '[data-toast-demo] en-toast-region[label="Demo notifications"]', count: 1, kind: 'toast', gate: {unit: 'elements', generatedBodyPercent: 40, componentAbsolute: 50}},
  ]},
];
const manifest = {
  schemaVersion: 1, kind: 'lazy-delivery-family-structural-census', startedAt: new Date().toISOString(),
  source: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  node: process.version, distribution,
  frozenBuild: JSON.parse(await readFile(resolve(dirname(distribution), 'receipt.json'), 'utf8')),
  playwrightVersion: JSON.parse(await readFile(resolve(root, 'node_modules/@playwright/test/package.json'), 'utf8')).version,
  browserPins: JSON.parse(await readFile(resolve(root, 'node_modules/playwright-core/browsers.json'), 'utf8')),
  protocol: {routes, viewports: [{width:1280,height:900},{width:390,height:844}], workload: 'Unchanged real route, no seeded data, no opening/closing/actions, no template mutation.', method: 'One deterministic census per engine/viewport/route; deep connected nodes include shadow roots and text/comments, template contents excluded. Candidate closure is an optimistic upper bound before replacement markers/controls. No timing samples.', registry: 'Existing route registry, observed from every host shadow root; no registry override.', limitations: 'Not a candidate implementation, speed measurement, retention measurement, physical touch, native picker, IME, or assistive-technology acceptance.'},
  sourceBefore: await identity(), siteBefore: await verifySite(), cases: [],
};
if (manifest.siteBefore.failures.length) throw new Error('Frozen site hash mismatch before census: ' + manifest.siteBefore.failures.join(', '));
await writeFile(resolve(out, 'started.json'), JSON.stringify(manifest,null,2)+'\n');
const errorRecord = error => ({message:String(error),stack:error.stack});
const evaluateGates = (metric, gate) => {
  const unit=gate.unit, generated=metric.generated[unit], component=metric.component[unit], route=metric.document[unit];
  const componentPercent=component ? generated/component*100 : 0, routePercent=route ? generated/route*100 : 0;
  const componentChecks=[['generated-body-percent',gate.generatedBodyPercent,metric.generated.elements?100:0],['percent',gate.componentPercent,componentPercent],['absolute-'+unit,gate.componentAbsolute,generated],['absolute-elements',gate.componentElements,metric.generated.elements]].filter(([,threshold])=>threshold!==undefined).map(([name,threshold,actual])=>({name,threshold,actual,withinOpportunity:actual>=threshold}));
  const routeChecks=[['percent',gate.routePercent,routePercent],['absolute-'+unit,gate.routeAbsolute,generated],['absolute-elements',gate.routeElements,metric.generated.elements]].filter(([,threshold])=>threshold!==undefined).map(([name,threshold,actual])=>({name,threshold,actual,withinOpportunity:actual>=threshold}));
  return {unit, componentPercent,routePercent,componentChecks,routeChecks,componentOpportunity:componentChecks.every(c=>c.withinOpportunity)?'not-rejected-by-upper-bound':'below-frozen-gate',routeOpportunity:routeChecks.length?(routeChecks.every(c=>c.withinOpportunity)?'not-rejected-by-upper-bound':'below-frozen-gate'):'no-structural-route-percentage-gate',claim:'An upper bound that clears a threshold is not a qualified implementation or promotion.'};
};
try {
 await exclusiveBrowserWork(async()=>{
  const server=await startDocsServer({distribution,port:0}); manifest.origin=server.url;
  try {
   for(const [engine,type] of Object.entries({chromium,firefox,webkit})) {
    const browser=await type.launch();
    try {
     for(const viewport of manifest.protocol.viewports) for(const route of routes) {
      const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
      const page=await context.newPage();
      const record={engine,version:browser.version(),viewport,route:route.path,pageErrors:[],httpErrors:[],requests:[],metrics:[]};manifest.cases.push(record);
      page.on('pageerror',error=>record.pageErrors.push(String(error)));
      page.on('request',request=>record.requests.push(request.url()));
      page.on('response',response=>{if(response.status()>=400)record.httpErrors.push({url:response.url(),status:response.status()});});
      try {
       const response=await page.goto(server.url+route.path,{waitUntil:'networkidle'});
       if(!response?.ok())throw new Error('Route failed to load: '+response?.status());
       for(const target of route.targets) {
        await page.locator(target.host).first().waitFor({state:'attached',timeout:15000});
        const count=await page.locator(target.host).count();
        if(count!==target.count)throw new Error(`${target.id}: expected ${target.count} original hosts, found ${count}; do not alter workload.`);
       }
       if(route.standalone)await page.waitForFunction(()=>document.documentElement.hasAttribute('data-example-standalone')&&!document.querySelector('en-api-example-app')?.hasAttribute('data-ssr'));
       record.readiness=await page.locator(route.targets.map(target=>target.host).join(',')).evaluateAll(async hosts=>{
        await document.fonts.ready;
        const dormant=[];let observed=0;
        for(let pass=0;pass<3;pass++){
         const complete=[],seen=new Set();
         const visit=e=>{if(seen.has(e))return;seen.add(e);if(e.nodeType===1){if(e.hasAttribute('defer-hydration'))dormant.push({tag:e.localName,id:e.id});else if(e.updateComplete){complete.push(e.updateComplete);observed++;}if(e.shadowRoot)visit(e.shadowRoot);}for(const child of e.childNodes)visit(child);};
         hosts.forEach(visit);
         let timer;try{await Promise.race([Promise.all(complete),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Candidate readiness exceeded5seconds; retain failure, do not activate dormant SSR.')),5000);})]);}finally{clearTimeout(timer);}
         await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
        }
        return {passes:3,observedPromises:observed,dormantHydrationDescendants:dormant,scope:'Candidate hosts and descendants only; deferred hydration owners remain untouched.'};
       });
       for(const target of route.targets) {
        const metric=await page.locator(target.host).evaluateAll((hosts,{kind,id})=>{
         const empty=()=>({nodes:0,elements:0,texts:0,comments:0,shadowRoots:0});
         const add=(a,b)=>{for(const key of Object.keys(a))a[key]+=b[key];return a;};
         const census=roots=>{
          const result=empty(),seen=new Set();
          const visit=node=>{if(!node||seen.has(node))return;seen.add(node);result.nodes++;if(node.nodeType===1)result.elements++;if(node.nodeType===3)result.texts++;if(node.nodeType===8)result.comments++;for(const child of node.childNodes)visit(child);if(node.shadowRoot){result.shadowRoots++;visit(node.shadowRoot);}};
          for(const node of roots)visit(node);return result;
         };
         const instances=hosts.map(host=>{
          const shadow=host.shadowRoot;if(!shadow)throw new Error(id+' is not defined/hydrated');
          let generated=[],attributed=[],boundary='',state={};
          if(kind==='media'){const body=shadow.querySelector('[part="body"]');generated=[...body.childNodes];boundary='All childNodes of retained dialog body; excludes dialog/header/description/footer/body wrapper.';state={items:host.items.length,open:host.open,carousel:shadow.querySelectorAll('en-carousel').length,slides:shadow.querySelectorAll('en-carousel-slide').length,images:shadow.querySelectorAll('img').length,carouselState:[...shadow.querySelectorAll('en-carousel')].map(carousel=>({index:carousel.index,visibleCount:carousel.visibleCount,end:carousel.end,pickerImages:carousel.shadowRoot?.querySelectorAll('[part~=picker] img').length,pickerButtons:carousel.shadowRoot?.querySelectorAll('[part~=picker] button').length,rect:carousel.getBoundingClientRect().toJSON()}))};}
          if(kind==='combobox'){attributed=[...shadow.querySelectorAll('#listbox > [role="option"]')];generated=[...shadow.querySelector('#listbox').childNodes];boundary='All listbox childNodes as optimistic upper bound; attributed counts isolate generated option rows. Native input, popup/listbox/status preserved.';state={items:host.items?.length,rows:attributed.length,open:shadow.querySelector('#control')?.getAttribute('aria-expanded')};}
          if(kind==='multiselect'){attributed=[...shadow.querySelectorAll('#choices > button[role="option"]')];generated=[...shadow.querySelector('#choices').childNodes];boundary='All listbox childNodes as optimistic upper bound; attributed counts isolate option buttons. Query, tags and listbox shell preserved.';state={items:host.items?.length,rows:attributed.length,open:shadow.querySelector('#query')?.getAttribute('aria-expanded'),selectedTags:shadow.querySelectorAll('[part~="tags"] button').length};}
          if(kind==='menubar'){attributed=[...shadow.querySelectorAll('en-menu-item')];generated=[...shadow.querySelectorAll('en-menu')].flatMap(menu=>[...menu.childNodes]);boundary='All childNodes of generated menu hosts as optimistic upper bound; attributed counts isolate menu-item hosts and their descendants. Root buttons/en-menu shells retained.';state={roots:host.items?.length,items:attributed.length,menus:[...shadow.querySelectorAll('en-menu')].map(menu=>({open:menu.open,items:menu.querySelectorAll('en-menu-item').length}))};}
          if(kind==='overflow'){attributed=[...shadow.querySelectorAll('.extra > button')];generated=[...(shadow.querySelector('.extra')?.childNodes??[])];boundary='All settled .extra childNodes as optimistic upper bound; attributed counts isolate action buttons; source count=Infinity means every action was constructed in initial visible row. This is not initial construction savings.';state={items:host.items?.length,extra:attributed.length,open:shadow.querySelector('details')?.open,measurementButtons:shadow.querySelectorAll('.measure button').length,visibleButtons:shadow.querySelectorAll('.row > button').length};}
          if(kind==='command'){attributed=[shadow.querySelector('.en-command-palette-content')];generated=[...shadow.querySelector('[part="body"]').childNodes];boundary='All dialog body childNodes as optimistic upper bound; attributed counts isolate search/results/status wrapper; native dialog shell retained. Undefined SSR host is not activated by this probe.';state={commands:host.commands?.length,options:shadow.querySelectorAll('[role="option"]').length,open:host.open};}
          if(kind==='pagination'){attributed=[...shadow.querySelectorAll('#page-jump > .en-pagination__jump')];generated=[...(shadow.querySelector('#page-jump')?.childNodes??[])];boundary='All chooser childNodes as optimistic upper bound; attributed counts isolate editor wrapper plus label/input/two actions; chooser popover shell retained. Unknown-total pager has no generated chooser.';state={pageCount:host.pageCount,known:Boolean(host.pageCount),open:shadow.querySelector('#page-jump')?.matches(':popover-open')??false};}
          if(kind==='toast'){const history=shadow.querySelector('details[part="history"]');generated=[...history.childNodes].filter(node=>node.nodeType!==1||node.localName!=='summary');boundary='Optimistic whole history body (headings/lists/clear button) excluding details/summary, larger than history rows alone.';state={open:history.open,historyLimit:host.historyLimit,historyRows:history.querySelectorAll('li').length,historyItems:host.historyItems?.length,waiting:host.waitingMessages?.length,visibleToasts:host.querySelectorAll('en-toast:not([hidden])').length};}
          if(generated.some(node=>!node))throw new Error(id+' generated boundary missing');
          return {tag:host.localName,id:host.id,label:host.getAttribute('label'),component:census([host]),generated:census(generated),attributed:census(attributed),boundary,state,defined:host.constructor!==host.ownerDocument.defaultView.HTMLElement,constructor:host.constructor.name,contentRendering:host.contentRendering??'not implemented',actualRegistry:shadow.customElementRegistry===host.ownerDocument.defaultView.customElements?'global':shadow.customElementRegistry?'scoped':'not exposed by engine'};
         });
         return {id,kind,document:census([document]),component:instances.reduce((sum,item)=>add(sum,item.component),empty()),generated:instances.reduce((sum,item)=>add(sum,item.generated),empty()),instances};
        },{kind:target.kind,id:target.id});
        metric.gate=evaluateGates(metric,target.gate);
        metric.wholeHostRemovalUpperBound={nodesPercent:metric.component.nodes/metric.document.nodes*100,elementsPercent:metric.component.elements/metric.document.elements*100,claim:'Removing the whole host is not permitted; this looser bound can only reject a route, never support promotion.'};
        metric.perInstanceGates=metric.instances.map(instance=>target.kind==='pagination'&&!instance.state.known?{componentOpportunity:'not-applicable-unknown-total',routeContribution:0}:evaluateGates({...instance,document:metric.document},target.gate));
        if(target.kind==='pagination'){metric.gate.componentOpportunity='use-known-total-per-instance-verdicts';metric.gate.componentChecks=[];}
        record.metrics.push(metric);
       }
       record.screenshot=`${engine}-${viewport.width}-${route.id}.png`;
       await page.screenshot({path:resolve(out,record.screenshot),fullPage:true});
      } catch(error){record.error=errorRecord(error);await page.screenshot({path:resolve(out,`${engine}-${viewport.width}-${route.id}-failure.png`),fullPage:true}).catch(e=>record.screenshotError=String(e));}
      finally{await context.close();}
      await writeFile(resolve(out,'partial.json'),JSON.stringify(manifest,null,2)+'\n');
     }
    } finally{await browser.close();}
   }
  }finally{await server.close();}
 });
}catch(error){manifest.error=errorRecord(error);}
finally{
 manifest.finishedAt=new Date().toISOString();manifest.sourceAfter=await identity();manifest.siteAfter=await verifySite();
 manifest.sourceUnchanged=JSON.stringify(manifest.sourceBefore)===JSON.stringify(manifest.sourceAfter);
 manifest.siteUnchanged=!manifest.siteAfter.failures.length&&manifest.siteBefore.manifestSha256===manifest.siteAfter.manifestSha256;
 manifest.summary=routes.flatMap(route=>route.targets).map(target=>{const rows=manifest.cases.flatMap(row=>row.metrics.filter(metric=>metric.id===target.id).map(metric=>({engine:row.engine,viewport:row.viewport,...metric})));return {id:target.id,cells:rows.length,componentBelowGate:rows.filter(row=>row.gate.componentOpportunity==='below-frozen-gate').length,routeBelowGate:rows.filter(row=>row.gate.routeOpportunity==='below-frozen-gate').length,rows};});
 await writeFile(resolve(out,'census.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({output:out,cases:manifest.cases.length,sourceUnchanged:manifest.sourceUnchanged,siteUnchanged:manifest.siteUnchanged,errors:manifest.cases.filter(row=>row.error||row.pageErrors.length||row.httpErrors.length).map(({engine,viewport,route,error,pageErrors,httpErrors})=>({engine,viewport,route,error,pageErrors,httpErrors})),summary:manifest.summary.map(({id,cells,componentBelowGate,routeBelowGate})=>({id,cells,componentBelowGate,routeBelowGate})),error:manifest.error},null,2));
 if(manifest.error||!manifest.sourceUnchanged||!manifest.siteUnchanged||manifest.cases.some(row=>row.error||row.pageErrors.length||row.httpErrors.length)||manifest.cases.length!==30)process.exitCode=1;
}
