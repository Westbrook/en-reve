import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, json, sha } from '../src/config.mjs';
const read = async path => JSON.parse(await readFile(resolve(root, path)));
const runPath = 'runs/web-awesome-dom-v1';
const rows = await read(runPath + '/snapshots.json');
const manifest = await read(runPath + '/manifest.json');
const ownership = await read('reports/web-awesome/shadow-ownership.json');
const previous = await read('reports/dom-review/census.json');
const fields = ['nodes','elements','text','whitespaceText','comments','shadowRoots','other','customElements','slots','svgElements','baseParts'];
let checks = 0;
function equal(actual, expected, note) { checks++; assert.deepEqual(actual, expected, note); }
function sum(buckets, key) { return buckets.reduce((total, bucket) => total + bucket[key], 0); }
const expected = new Set();
const key = row => [row.system,row.session,row.stage,row.profile,row.repeat].join('/');
const systems = ['en-reve','fluent-web-components','web-awesome'];
for (const system of systems) {
  for (let repeat=1; repeat<=3; repeat++) for (const stage of ['initial','after-journey']) expected.add(key({system,session:'journey',stage,profile:'desktop',repeat}));
  expected.add(key({system,session:'initial-only',stage:'initial',profile:'narrow',repeat:1}));
}
for (let repeat=1; repeat<=3; repeat++) for (const stage of ['initial','date-open','date-closed']) expected.add(key({system:'en-reve',session:'date',stage,profile:'desktop',repeat}));
equal(rows.length, 30, 'Expected complete selected-system schedule');
equal(manifest.successfulSnapshots, 30); equal(manifest.failures, 0);
equal(new Set(rows.map(key)), expected, 'Unique complete snapshot keys');
const stable = new Map();
for (const row of rows) {
  equal(row.status, 'passed'); equal(row.cardCount, 16);
  for (const name of ['total','date','withoutDate']) {
    const counts = row[name];
    equal(counts.nodes, counts.elements + counts.text + counts.comments + counts.shadowRoots + counts.other, 'Node type accounting ' + key(row));
    for (const field of fields) equal(Number.isInteger(counts[field]) && counts[field] >= 0, true);
  }
  for (const field of fields) {
    equal(row.total[field], row.date[field] + row.withoutDate[field], 'Date partition ' + field);
    equal(row.total[field], sum(Object.values(row.byCard),field), 'Card partition ' + field);
    equal(row.withoutDate[field], sum(Object.values(row.byCardWithoutDate),field), 'Non-date card partition ' + field);
    equal(row.total[field], sum(Object.values(row.byOwner).map(owner => owner.all),field), 'Nearest owner partition ' + field);
    equal(row.withoutDate[field], sum(Object.values(row.byOwner).map(owner => owner.withoutDate),field), 'Non-date nearest owner partition ' + field);
  }
  equal(Object.values(row.elementsByTag).reduce((a,b)=>a+b,0), row.total.elements);
  equal(Object.values(row.commentKinds).reduce((a,b)=>a+b,0), row.total.comments);
  equal(row.baseInstances.length, row.total.baseParts);
  equal(row.baseInstances.filter(part=>part.inDate).length, row.date.baseParts);
  equal(sum(Object.values(row.baseOwners),'count'), row.total.baseParts);
  const group = [row.system,row.session,row.stage,row.profile].join('/');
  const counts = {total:row.total,date:row.date,withoutDate:row.withoutDate,byCard:row.byCard,byCardWithoutDate:row.byCardWithoutDate};
  if (stable.has(group)) equal(counts, stable.get(group), 'Repeated census is stable: ' + group);
  else stable.set(group, counts);
  if (row.system !== 'web-awesome') {
    const old = previous.find(prior=>key(prior)===key(row));
    equal(Boolean(old), true, 'Existing control snapshot found');
    for (const name of ['total','date','withoutDate']) equal(row[name], old[name], 'Frozen control matches historical DOM: ' + key(row));
  }
}
equal(ownership.rows.length, 3);
for (const row of ownership.rows) {
  const initial = rows.find(value=>value.system===row.system && value.session==='journey' && value.stage==='initial' && value.repeat===1);
  for (const name of ['total','date','withoutDate']) equal(row.census[name], initial[name]);
  for (const field of ['nodes','elements','text','whitespaceText','comments','shadowRoots','slots','baseParts']) {
    equal(sum(Object.values(row.byShadowHost),field), row.census.total[field], 'Direct shadow ownership ' + field);
    equal(sum(Object.values(row.dateZones),field), row.census.date[field], 'Date ownership ' + field);
  }
  equal(sum(Object.values(row.slotUsage),'slots'), row.census.total.slots);
  for (const bucket of Object.values(row.slotUsage)) equal(bucket.assigned + bucket.unassigned, bucket.slots);
}
for (const [path, digest] of Object.entries(manifest.sources)) equal(sha(await readFile(resolve(root,path))),digest,'Measured source identity');
for (const [path, digest] of Object.entries(ownership.sources)) equal(sha(await readFile(resolve(root,path))),digest,'Ownership source identity');
for (const [system, assets] of Object.entries(manifest.artifacts)) for (const [path,digest] of Object.entries(assets)) equal(sha(await readFile(resolve(root,'.cache/snapshots',system,path))),digest,'Frozen artifact identity');
const result = {at:new Date().toISOString(),passed:true,checks,snapshots:30,ownershipSnapshots:3,systems,failedSnapshots:0,protocol:manifest.protocol,stableDesktopRepetitions:3,controlsMatchHistorical:true,initial:systems.map(system=>{const row=rows.find(row=>row.system===system&&row.session==='journey'&&row.stage==='initial');return {system,total:row.total,date:row.date,withoutDate:row.withoutDate};}),sourceSha256:sha(await readFile(new URL(import.meta.url)))};
await writeFile(resolve(root,'reports/web-awesome/dom-verification.json'),json(result),{flag:'wx'});
console.log(json({passed:true,checks,snapshots:30,ownershipSnapshots:3,initial:result.initial.map(row=>({system:row.system,nodes:row.total.nodes,elements:row.total.elements,dateNodes:row.date.nodes,dateElements:row.date.elements,withoutDateNodes:row.withoutDate.nodes,withoutDateElements:row.withoutDate.elements}))}));
