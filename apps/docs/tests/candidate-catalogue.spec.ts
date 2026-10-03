import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createReviewDraft} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {captureReview} from '../../../tooling/visual-review/capture.mjs';
import {catalogue} from '../../../tooling/visual-review/catalogue.mjs';
import {verifyState} from '../../../tooling/visual-review/state-checks.mjs';
import {performActions} from '../../../tooling/visual-review/state-actions.mjs';

test('native file and pointer actions preserve real input events and cancellation',async({page})=>{
 await page.setViewportSize({width:600,height:600});
 await page.setContent('<iframe style="position:absolute;left:40px;top:60px;width:400px;height:400px" srcdoc="<input type=file multiple><button>Modifier</button><div role=slider style=width:200px;height:80px;background:gray;touch-action:none tabindex=0></div><output></output>"></iframe>');
 const frame=page.frames()[1]!;
 await frame.locator('input').evaluate(input=>input.addEventListener('change',()=>{
  document.querySelector('output')!.textContent=Array.from((input as HTMLInputElement).files??[]).map(file=>`${file.name}:${file.size}`).join(',');
 }));
 await frame.locator('button').evaluate(button=>button.addEventListener('click',event=>button.textContent=(event as MouseEvent).shiftKey?'Shift click':'Click'));
 await frame.locator('[role="slider"]').evaluate(slider=>{
  slider.addEventListener('pointerdown',event=>{slider.setAttribute('data-drag','active');slider.setPointerCapture((event as PointerEvent).pointerId);});
  slider.addEventListener('pointermove',event=>{if((event as PointerEvent).buttons)slider.setAttribute('data-moved','true');});
  slider.addEventListener('pointerup',()=>slider.setAttribute('data-drag',slider.getAttribute('data-drag')==='cancelled'?'cancelled':'released'));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')slider.setAttribute('data-drag','cancelled');});
 });
 await performActions(page,frame,[{kind:'files',selector:'input',files:[{name:'draft.txt',mimeType:'text/plain',base64:'ZHJhZnQ='}]},{kind:'click',selector:'#absent-wide-control',whenViewport:{minWidth:601}},{kind:'click',selector:'button',modifiers:['Shift'],whenViewport:{maxWidth:600}}]);
 await expect(frame.locator('output')).toHaveText('draft.txt:5');
 await expect(frame.locator('button')).toHaveText('Shift click');
 const drag={kind:'drag',selector:'[role="slider"]',from:{x:0.1,y:0.5},to:{x:0.9,y:0.5}};
 await performActions(page,frame,[{...drag,end:'hold'}]);
 await expect(frame.locator('[role="slider"]')).toHaveAttribute('data-drag','active');
 await expect(frame.locator('[role="slider"]')).toHaveAttribute('data-moved','true');
 await page.mouse.up();
 await expect(frame.locator('[role="slider"]')).toHaveAttribute('data-drag','released');
 await performActions(page,frame,[{...drag,end:'escape'},{kind:'files',selector:'input',files:[]}]);
 await expect(frame.locator('[role="slider"]')).toHaveAttribute('data-drag','cancelled');
 await expect(frame.locator('output')).toHaveText('');
});

test('pointer actions reach the source below sticky page navigation',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.setContent('<iframe style="position:fixed;inset:0;width:100%;height:100%;border:0" srcdoc="<style>body{margin:0}nav{position:sticky;top:0;height:145px;background:white;z-index:2}#plane{height:192px;background:gray;touch-action:none}</style><nav>Navigation</nav><div style=height:1000px></div><div id=plane></div><div style=height:1500px></div>"></iframe>');
 const frame=page.frames()[1]!;
 await frame.locator('#plane').evaluate(plane=>{
  document.querySelector('nav')!.addEventListener('pointerdown',()=>document.querySelector('nav')!.setAttribute('data-hit','true'));
  plane.addEventListener('pointerdown',event=>{plane.setAttribute('data-drag','active');plane.setPointerCapture((event as PointerEvent).pointerId);});
  plane.addEventListener('pointermove',event=>{if((event as PointerEvent).buttons)plane.setAttribute('data-moved','true');});
  plane.addEventListener('pointerup',()=>plane.setAttribute('data-drag','released'));
  scrollTo(0,plane.getBoundingClientRect().top+scrollY-80);
 });
 const plane=frame.locator('#plane');
 expect((await plane.boundingBox())!.y).toBe(80);
 await performActions(page,frame,[{kind:'drag',selector:'#plane',from:{x:.2,y:.2},to:{x:.5,y:.5},end:'release'}]);
 await expect(plane).toHaveAttribute('data-moved','true');
 await expect(plane).toHaveAttribute('data-drag','released');
 await expect(frame.locator('nav')).not.toHaveAttribute('data-hit','true');
});

test('state postconditions reject unmet UI and accept asynchronously reached state',async({page})=>{
 await page.setContent('<button aria-expanded="false">Open</button><p hidden>Ready</p>');
 await page.locator('button').evaluate(button=>button.addEventListener('click',()=>setTimeout(()=>{button.setAttribute('aria-expanded','true');document.querySelector('p')!.hidden=false;},30)));
 await page.locator('button').click();
 await verifyState(page,[{kind:'attribute',selector:'button',name:'aria-expanded',value:'true'},{kind:'visible',selector:'p'}]);
 await expect(verifyState(page,[{kind:'count',selector:'button',value:2}])).rejects.toThrow();
});

test('CSS postconditions distinguish local overrides from inherited siblings',async({page})=>{
 await page.setContent('<main style="color:rgb(10, 20, 30)"><button class="shared" style="padding:10px;border-radius:8px">Shared</button><section style="color:rgb(40, 50, 60)"><button class="local" style="padding:20px;border-radius:0">Local</button></section></main>');
 await verifyState(page,[
  {kind:'css',selector:'.local',name:'border-top-left-radius',value:'0px'},
  {kind:'css-relationship',selector:'section',referenceSelector:'main',name:'color',relation:'different'},
  {kind:'css-relationship',selector:'.local',referenceSelector:'.shared',name:'padding-left',relation:'greater'},
  {kind:'css-relationship',selector:'.shared',referenceSelector:'.local',name:'padding-left',relation:'less'},
  {kind:'css-relationship',selector:'.shared',referenceSelector:'.shared',name:'border-top-left-radius',relation:'equal'},
 ]);
 await expect(verifyState(page,[{kind:'css',selector:'.local',name:'border-top-left-radius',value:'8px'}])).rejects.toThrow();
 await expect(verifyState(page,[{kind:'css-relationship',selector:'section',referenceSelector:'main',name:'color',relation:'equal'}])).rejects.toThrow();
 await expect(verifyState(page,[{kind:'css-relationship',selector:'section',referenceSelector:'main',name:'color',relation:'greater'}])).rejects.toThrow(/pixel lengths/);
});

test('authored catalogue captures real state with exact candidate identity',async({browser,browserName},info)=>{
 test.skip(process.env.EN_VISUAL_CATALOGUE!=='1','Opt-in full visual catalogue acquisition.');test.setTimeout(12*60*60*1000);
 const buildDirectory=fileURLToPath(new URL('../../../dist',import.meta.url));const build=JSON.parse(await readFile(buildDirectory+'/review-build.json','utf8'));
 const densities=(process.env.EN_VISUAL_DENSITIES??'compact,comfortable,spacious').split(',');
 expect(densities.length).toBe(new Set(densities).size);
 for(const density of densities){
 expect(['compact','comfortable','spacious']).toContain(density);
 const light=createReviewDraft(),dark=createReviewDraft();
 light.setContext({density:density as 'compact'|'comfortable'|'spacious'});dark.setContext({mode:'dark',density:density as 'compact'|'comfortable'|'spacious'});
 const baseline=exportReviewBundle(light,build,{title:'Catalogue baseline',rationale:''},{},{pair:{name:'catalogue',light,dark}});
 light.setToken('radius.control',{value:1,unit:'rem'});dark.setToken('radius.control',{value:0.75,unit:'rem'});
 const candidate=exportReviewBundle(light,build,{title:'Catalogue radius candidate',rationale:'Exercise real authored states and both responsive appearances.'},{},{pair:{name:'catalogue',light,dark}});
 const baselineFile=info.outputPath(density+'-baseline.json'),candidateFile=info.outputPath(density+'-candidate.json');await writeFile(baselineFile,baseline);await writeFile(candidateFile,candidate);
 const cases=catalogue(build);const selected=process.env.EN_VISUAL_SELECTED?.split(',');
 const viewports=[{id:'desktop',width:1280,height:900},{id:'mobile',width:390,height:844}].filter(viewport=>!process.env.EN_VISUAL_VIEWPORTS || process.env.EN_VISUAL_VIEWPORTS.split(',').includes(viewport.id));
 const cacheDirectory=process.env.EN_VISUAL_CACHE_ROOT?resolve(process.env.EN_VISUAL_CACHE_ROOT,browserName,density):undefined;
 const result=await captureReview({buildDirectory,baselineFile,candidateFile,outputDirectory:info.outputPath(density+'-capture'),cacheDirectory,options:{engines:[browserName],viewports,cases,...(selected?{selected}:{})},browsers:{[browserName]:browser}});
 expect(result.results.filter((row:any)=>row.status==='failed').map((row:any)=>({key:row.key,reason:row.reason}))).toEqual([]);
 for(const row of result.results.filter((row:any)=>['passed','different'].includes(row.status))){
  expect(row.captures.actual.details.stateChecks).toHaveLength(row.fixture.checks?.length??0);
  if(row.fixture.capture==='viewport')expect(row.captures.actual.details.coverage.method).toBe('viewport');
 }
 expect(result.results.filter((row:any)=>['passed','different'].includes(row.status))).toHaveLength((selected?.length??cases.length)*viewports.length*2);
 }
});
