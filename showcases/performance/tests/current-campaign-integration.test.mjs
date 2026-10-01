import test from 'node:test';
import assert from 'node:assert/strict';
import {integrateCurrentCampaign} from '../experiments/integrate-current-campaign.mjs';
const md=(h,r)=>[h,h.map(()=>'---'),...r].map(row=>'| '+row.join(' | ')+' |').join('\n')+'\n';
test('latest campaign adds dated rows, preserves history, is repeatable and uses initial rather than all-JS sizes',()=>{
 const common=['Implementation','Run ID','Date (UTC)','Successful n','Failed n'];
 const headers=[...common,'FCP ms','LCP ms','LCP p75 ms'];
 const prior=['Historical En Reve','old-load','2026-09-23',10,0,100,110,120];
 const reference=['Implementation','Run ID','Date (UTC)','Successful n','Initial JS Brotli KiB','All JS Brotli KiB','External CSS Brotli KiB','Median LCP ms','Lab p75 LCP ms'];
 const domHeaders=[...common,'connectedNodes','connectedElements','openShadowRoots','styleElements','stylesheetAdoptions','uniqueAdoptedStylesheets'];
 const domOld=['Implementation','Run ID','Date (UTC)','Connected nodes','Connected elements','Open shadow roots','Style elements','Stylesheet adoptions','Unique adopted sheets'];
 const payloadHeaders=['Implementation','Run ID','Date (UTC)','Initial JS Brotli KiB','JS Brotli KiB','CSS Brotli KiB'];
 const text='# Results\n\n## Loading and visual stability\n\n### mobile cold loading\n\n'+md(headers,[prior])+'\n### Historical connected DOM diagnostics\n\n'+md(domOld,[['Old','old-dom','2026-09-23',5,2,1,0,1,1]])+'\n## First reference comparison\n\n'+md(reference,[['Old','old-load','2026-09-23',10,80,90,4,110,120]])+'\n## Rendering and interaction evidence\n\n'+md(domOld,[['Old','old-dom','2026-09-23',5,2,1,0,1,1]])+'\n## Production files\n\n### Production payload sizes\n\n'+md(payloadHeaders,[['Old','old-build','2026-09-23',80,90,4]])+'\n<!-- BEGIN WEB AWESOME -->\nHistorical supplement untouched.\n';
 const input={id:'new-run',label:'En Reve main abc123',sourceCommit:'abc123',date:'2026-10-01',interpretation:'Keep audit outliers visible.',tables:[
 {title:'load · loading · mobile · cold · none · instrumented',headers,rows:[['En Reve · Current source','new-run-current-load','2026-10-01',10,0,90,95,99]]},
 {title:'Production payload sizes',headers:payloadHeaders,rows:[['En Reve · Current source','new-run','2026-10-01',70,100,3]]},
 {title:'diagnostic · Connected DOM and styles · desktop · cold · none · instrumented',headers:domHeaders,rows:[['En Reve · Current source','new-run-current-diagnostic','2026-10-01',1,0,4,2,1,0,1,1]]},
 ]};
 const result=integrateCurrentCampaign(text,input);assert(result.markdown.includes(md(headers,[prior]).split('\n')[2]));assert(result.markdown.includes('| En Reve main abc123 | new-run-current-load | 2026-10-01 | 10 | 70 | 100 | 3 | 95 | 99 |'));assert(result.markdown.includes('Historical supplement untouched.'));
 assert(result.markdown.includes('Keep audit outliers visible.'));assert.equal(integrateCurrentCampaign(result.markdown,input).markdown,result.markdown);
});
test('calendar refresh remains additive, dated and repeatable',async()=>{
 const {integrateCalendarCampaign}=await import('../experiments/integrate-calendar-campaign.mjs');
 const prior='# Results\n\n## Calendar delivery variants\n\nHistorical observations.\n',options={id:'main-abc12345-20261001-v1-calendar',sourceCommit:'abc12345',referenceCampaign:'main-abc12345-20261001-v1',primaryDate:'2026-10-01',config:{samples:10,calendarSamples:30,preparedSamples:10,lighthouseSamples:5,memorySamples:1},tables:[{title:'Calendar focus',note:'Dated samples',headers:['Implementation','Date (UTC)','Focus ms'],rows:[['En Reve · Eager reference','2026-10-01','10.0']]},{title:'Paired change relative to eager',headers:['Implementation','Median change ms'],rows:[['En Reve · Split','1.0']]}]};
 const next=integrateCalendarCampaign(prior,options);assert(next.includes('Historical observations.'));assert(next.includes('| En Reve abc12345 · Eager reference | 2026-10-01 | 10.0 |'));assert(next.includes('| En Reve abc12345 · Split | main-abc12345-20261001-v1-calendar-primary | 2026-10-01 | 1.0 |'));assert.equal(integrateCalendarCampaign(next,options),next);
});
