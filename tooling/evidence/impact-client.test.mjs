import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {selectAffected} from './graph.ts';
import {selectCandidateImpact,verifyImpact} from './impact-client.mjs';
function fixture(extra={}) {
 const body={schemaVersion:1,kind:'en-reve/source-impact',policy:'Potential impact',components:[{tagName:'en-button',source:'button.ts'}],scenarios:[{id:'buttons',path:'/#specimen-buttons',tags:['en-button']}],gaps:[],graph:{schemaVersion:1,nodes:[{id:'token:radius',kind:'token',dependencies:[]},{id:'component:en-button',kind:'component',dependencies:['token:radius']},{id:'scenario:buttons',kind:'scenario',dependencies:['component:en-button']}]},...extra};return {...body,digest:hashValue(body)};
}
test('browser and maintainer selection share identities, reasons and cases',()=>{
 const manifest=fixture();const selected=selectCandidateImpact(manifest,['token:radius']);
 const existing=selectAffected(manifest.graph,['token:radius']);
 for(const [name,value] of Object.entries(existing))assert.deepEqual(selected[name],value);
 assert.deepEqual(selected.components,['en-button']);assert.deepEqual(selected.caseIds,['buttons']);
 assert.deepEqual(selectCandidateImpact(manifest,[]).caseIds,[]);
});
test('unknown changes expand and corrupt or malformed maps cannot report empty impact',()=>{
 const manifest=fixture();assert.equal(selectCandidateImpact(manifest,['token:unknown']).mode,'expanded');
 assert.deepEqual(selectCandidateImpact(manifest,['token:unknown']).caseIds,['buttons']);
 assert.throws(()=>verifyImpact({...manifest,policy:'changed'}),/integrity/);
 assert.throws(()=>verifyImpact(fixture({graph:{schemaVersion:1,nodes:[{id:'x',kind:'oops',dependencies:[]}]}})),/kind/);
});
