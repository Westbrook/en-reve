import {render} from '@lit-labs/ssr';
import {collectResult} from '@lit-labs/ssr/lib/render-result.js';
import {writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
// The application chooses the SSR environment before explicit definition import.
await import('@en-reve/elements/define/skeleton.js');
const {fixtureTemplate:content,initialState}=await import('./content/fixture-template.js');
const {fixtureTemplate:navigation}=await import('./navigation/fixture-template.js');
const {documentHTML:contentDocument}=await import('./content/document.mjs');
const {documentHTML:navigationDocument}=await import('./navigation/document.mjs');
const {foundationStyles}=await import('@en-reve/styles/foundations.js');
const {contentStyles}=await import('@en-reve/styles/content.js');
const {navigationStyles}=await import('@en-reve/styles/navigation.js');
const site=process.argv[2],pages=[];
for(const loading of [false,true]){
 const body=await collectResult(render(content({...initialState(),loading})));
 for(const delivery of ['lit','css']){
  const file=`content-${delivery}-${loading}.html`;
  const html=contentDocument(body,{styles:delivery==='lit'?foundationStyles.cssText+contentStyles.cssText:'',stylesheet:delivery==='css'?'/assets/content.css':'',scriptURL:'/assets/content.js'});
  await writeFile(join(site,file),html);pages.push(file);
 }
}
for(const delivery of ['lit','css'])for(const mode of ['single','nested','two'])for(const dir of ['ltr','rtl']){
 const body=await collectResult(render(navigation(mode))),file=`navigation-${delivery}-${mode}-${dir}.html`;
 await writeFile(join(site,file),navigationDocument(body,{mode,dir,styles:delivery==='lit'?navigationStyles.cssText:'',stylesheet:delivery==='css'?'/assets/navigation.css':'',scriptURL:'/assets/navigation.js'}));pages.push(file);
}
await writeFile(join(site,'pages.json'),JSON.stringify(Object.fromEntries(await Promise.all(pages.map(async file=>[file,createHash('sha256').update(await readFile(join(site,file))).digest('hex')]))),null,2)+'\n');
