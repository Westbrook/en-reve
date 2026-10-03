import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createReviewDraft} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {captureReview} from '../../../tooling/visual-review/capture.mjs';
import {catalogue} from '../../../tooling/visual-review/catalogue.mjs';
import {verifyState} from '../../../tooling/visual-review/state-checks.mjs';

test('state postconditions reject unmet UI and accept asynchronously reached state',async({page})=>{
 await page.setContent('<button aria-expanded="false">Open</button><p hidden>Ready</p>');
 await page.locator('button').evaluate(button=>button.addEventListener('click',()=>setTimeout(()=>{button.setAttribute('aria-expanded','true');document.querySelector('p')!.hidden=false;},30)));
 await page.locator('button').click();
 await verifyState(page,[{kind:'attribute',selector:'button',name:'aria-expanded',value:'true'},{kind:'visible',selector:'p'}]);
 await expect(verifyState(page,[{kind:'count',selector:'button',value:2}])).rejects.toThrow();
});

test('authored catalogue captures real state with exact candidate identity',async({browser,browserName},info)=>{
 test.skip(process.env.EN_VISUAL_CATALOGUE!=='1','Opt-in full visual catalogue acquisition.');test.setTimeout(60*60*1000);
 const buildDirectory=fileURLToPath(new URL('../../../dist',import.meta.url));const build=JSON.parse(await readFile(buildDirectory+'/review-build.json','utf8'));
 const light=createReviewDraft(),dark=createReviewDraft();dark.setContext({mode:'dark'});
 const baseline=exportReviewBundle(light,build,{title:'Catalogue baseline',rationale:''},{},{pair:{name:'catalogue',light,dark}});
 light.setToken('radius.control',{value:1,unit:'rem'});dark.setToken('radius.control',{value:0.75,unit:'rem'});
 const candidate=exportReviewBundle(light,build,{title:'Catalogue radius candidate',rationale:'Exercise real authored states and both responsive appearances.'},{},{pair:{name:'catalogue',light,dark}});
 const baselineFile=info.outputPath('baseline.json'),candidateFile=info.outputPath('candidate.json');await writeFile(baselineFile,baseline);await writeFile(candidateFile,candidate);
 const cases=catalogue(build);const selected=process.env.EN_VISUAL_SELECTED?.split(',');
 const result=await captureReview({buildDirectory,baselineFile,candidateFile,outputDirectory:info.outputPath('capture'),cacheDirectory:undefined,options:{engines:[browserName],viewports:[{id:'desktop',width:1280,height:900},{id:'mobile',width:390,height:844}],cases,...(selected?{selected}:{})},browsers:{[browserName]:browser}});
 expect(result.results.filter((row:any)=>row.status==='failed').map((row:any)=>({key:row.key,reason:row.reason}))).toEqual([]);
 for(const row of result.results.filter((row:any)=>['passed','different'].includes(row.status))){
  expect(row.captures.actual.details.stateChecks).toHaveLength(row.fixture.checks?.length??0);
  if(row.fixture.capture==='viewport')expect(row.captures.actual.details.coverage.method).toBe('viewport');
 }
 expect(result.results.filter((row:any)=>['passed','different'].includes(row.status))).toHaveLength((selected?.length??cases.length)*4);
});
