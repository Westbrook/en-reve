import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createReviewDraft,createThemePair,emitThemePairCSS} from '../dist/index.js';

test('all inspired toast recipes round trip through managed paired theme delivery',async()=>{
 const definitions=JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json',import.meta.url),'utf8'));
 for(const name of ['spectrum','fluent','astryx','shadcn','radix','holotable']){
  const themes=[];
  for(const mode of ['light','dark']){
   const edits=JSON.parse(await readFile(new URL(`../../../tooling/theme-candidates/inspired/${name}.${mode}.json`,import.meta.url),'utf8'));
   const draft=createReviewDraft(definitions.find(d=>d.id===`${name}-inspired`).baseOptions?.[mode]??{});
   for(const edit of edits){if(edit.type==='context'){const {type,...context}=edit;draft.setContext(context);}else if(edit.type==='token')draft.setToken(edit.id,edit.value);}
   themes.push(draft.theme);
  }
  const pair=createThemePair({name:`${name}-toast-test`,light:themes[0],dark:themes[1]});
  const css=emitThemePairCSS(pair);
  assert.match(css,/--en-toast-background:/);assert.match(css,/--en-toast-region-width:/);assert.match(css,/--en-toast-shadow:/);
  if(name==='astryx')assert.match(css,/--en-toast-background: light-dark\(/);
 }
});
