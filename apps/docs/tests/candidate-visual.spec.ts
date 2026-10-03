import {test,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createReviewDraft,hashValue} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {captureReview} from '../../../tooling/visual-review/capture.mjs';
import {comparePixels} from '../../../tooling/visual-review/pixels.mjs';
test.setTimeout(180000);
const buildDirectory=fileURLToPath(new URL('../../../dist',import.meta.url));
const fixture={id:'buttons',page:'sheet',state:'default',selector:'[data-specimen="buttons"]',actions:[]};
async function inputs(info:any,changed=false,paired=false){
 const build=JSON.parse(await readFile(buildDirectory+'/review-build.json','utf8'));
 const light=createReviewDraft(),dark=createReviewDraft();dark.setContext({mode:'dark'});
 const baseline=exportReviewBundle(light,build,{title:'Expected',rationale:''},{},paired?{pair:{name:'visual-pair',light,dark}}:{});
 if(changed){light.setToken('radius.control',{value:1,unit:'rem'});dark.setToken('radius.control',{value:0.75,unit:'rem'});}
 const candidate=exportReviewBundle(light,build,{title:'Actual',rationale:''},{},paired?{pair:{name:'visual-pair',light,dark}}:{});
 await mkdir(info.outputPath('inputs'),{recursive:true});const baselineFile=info.outputPath('inputs/baseline.json'),candidateFile=info.outputPath('inputs/candidate.json');await writeFile(baselineFile,baseline);await writeFile(candidateFile,candidate);return {buildDirectory,baselineFile,candidateFile};
}
test('real preview captures retain state, missing coverage and independent cache identities',async({browser,browserName},info)=>{
 const input=await inputs(info);const cacheDirectory=info.outputPath('cache');
 const options={engines:[browserName],viewports:[{id:'desktop',width:1000,height:800}],cases:[fixture,{...fixture,state:'focus',actions:[{kind:'focus',selector:'[data-specimen="buttons"] en-button button >> nth=0'}]},{id:'calendar',page:'sheet',state:'default',selector:'[data-specimen="calendar"]',actions:[]}],selected:['buttons:default','buttons:focus']};
 const first=await captureReview({...input,cacheDirectory,outputDirectory:info.outputPath('first'),options:{...options,reuse:false},browsers:{[browserName]:browser}});
 expect(first.results.map((r:any)=>r.status)).toEqual(['passed','passed','not-run']);expect(first.status).toBe('incomplete');
 expect(first.results[0].captures.actual.artifact.digest).not.toBe(first.results[1].captures.actual.artifact.digest);
 const json=JSON.parse(await readFile(input.candidateFile,'utf8'));json.coverage.browserInteraction='not-run';const {integrity,...payload}=json;payload.reopen.instruction+=' Metadata-only note.';await writeFile(input.candidateFile,JSON.stringify({...payload,integrity:hashValue(payload)}));
 const second=await captureReview({...input,cacheDirectory,outputDirectory:info.outputPath('second'),options,browsers:{[browserName]:browser}});
 expect(second.results[0].captures.actual.reused).toBe(true);expect(second.results[0].comparison.reused).toBe(true);expect(second.reviewIdentity!.digest).not.toBe(first.reviewIdentity!.digest);
 const settings=await captureReview({...input,cacheDirectory,outputDirectory:info.outputPath('settings'),options:{...options,selected:['buttons:default'],comparison:{channelThreshold:2}},browsers:{[browserName]:browser}});
 expect(settings.results[0].captures.actual.reused).toBe(true);expect(settings.results[0].comparison.reused).toBe(false);expect(settings.results[0].comparison.identity.digest).not.toBe(first.results[0].comparison.identity.digest);
 const corrupt=settings.results[0].captures.actual.artifact.digest.slice(7);await writeFile(cacheDirectory+'/blobs/'+corrupt,'corrupt');
 const repaired=await captureReview({...input,cacheDirectory,outputDirectory:info.outputPath('repaired'),options:{...options,selected:['buttons:default']},browsers:{[browserName]:browser}});
 expect(repaired.results[0].status).toBe('passed');expect(repaired.results[0].captures.expected.cacheMiss).toBe('corrupt');expect(repaired.results[0].captures.expected.reused).toBe(false);
 const newBase=createReviewDraft();newBase.setToken('radius.control',{value:1,unit:'rem'});await writeFile(input.baselineFile,exportReviewBundle(newBase,JSON.parse(await readFile(buildDirectory+'/review-build.json','utf8')),{title:'New baseline',rationale:''},{}));
 const rebased=await captureReview({...input,cacheDirectory,outputDirectory:info.outputPath('changed-baseline'),options:{...options,selected:['buttons:default']},browsers:{[browserName]:browser}});
 expect(rebased.results[0].status).toBe('different');expect(rebased.results[0].captures.actual.reused).toBe(true);expect(rebased.results[0].captures.expected.reused).toBe(false);expect(rebased.results[0].comparison.reused).toBe(false);
});
test('paired responsive candidate keeps visible differences and capture failures explicit',async({browser,browserName},info)=>{
 const input=await inputs(info,true,true);const result=await captureReview({...input,cacheDirectory:info.outputPath('cache'),outputDirectory:info.outputPath('paired'),options:{engines:[browserName],viewports:[{id:'mobile',width:390,height:844}],cases:[fixture,{...fixture,state:'absent-target',selector:'#missing-target'},{...fixture,state:'manual-only',unsupported:'Physical assistive-technology review is required.'}],selected:['buttons:default','buttons:absent-target','buttons:manual-only']},browsers:{[browserName]:browser}});
 expect(result.results.map((r:any)=>r.status)).toEqual(['different','failed','unsupported','different','failed','unsupported']);
 for(const row of result.results.filter((r:any)=>r.status==='different')){expect(row.comparison.stats.differentPixels).toBeGreaterThan(0);expect(row.captures.expected.artifact.path).not.toBe(row.captures.actual.artifact.path);expect(row.comparison.artifact.mediaType).toBe('image/png');}
 for(const failed of result.results.filter((r:any)=>r.status==='failed'))expect(failed.captureFailure.artifact.mediaType).toBe('application/json');
 const artifact=result.results[0].captures.actual.artifact;const bytes=await readFile(info.outputPath('paired',artifact.path));expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
});
test('pixel comparisons expose dimension changes and thresholds without promoting a baseline',async({page})=>{
 const images=await page.evaluate(()=>{const png=(width:number,color:string)=>{const c=document.createElement('canvas');c.width=width;c.height=2;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,width,2);return c.toDataURL().split(',')[1];};return {expected:png(2,'rgb(10 10 10)'),actual:png(2,'rgb(11 10 10)'),wider:png(3,'rgb(10 10 10)')};});
 const equal=await page.evaluate(comparePixels,{...images,settings:{channelThreshold:1,maxDifferentPixels:0}});expect(equal.match).toBe(true);
 const changed=await page.evaluate(comparePixels,{...images,settings:{channelThreshold:0,maxDifferentPixels:0}});expect(changed.differentPixels).toBe(4);expect(changed.match).toBe(false);
 const resized=await page.evaluate(comparePixels,{expected:images.expected,actual:images.wider,settings:{channelThreshold:255,maxDifferentPixels:100}});expect(resized.dimensionsMatch).toBe(false);expect(resized.match).toBe(false);
});
