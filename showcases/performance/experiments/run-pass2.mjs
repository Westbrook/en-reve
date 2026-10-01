import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root,json } from '../src/config.mjs';
const campaigns = [
 {suite:'load',samples:'10',profiles:'desktop,mobile',caches:'cold,warm',id:'pass2-load-matrix-v1'},
 {suite:'startup',samples:'10',profiles:'desktop,mobile',caches:'cold',id:'pass2-startup-v1'},
 {suite:'interactions',samples:'10',profiles:'desktop,mobile',caches:'cold',id:'pass2-interactions-v1'},
 {suite:'lighthouse',samples:'5',profiles:'mobile',caches:'cold',id:'pass2-lighthouse-v1'},
 {suite:'memory',samples:'1',profiles:'desktop',caches:'cold',checkpoints:'0,10,50',id:'pass2-memory-50-v1'},
];
const receipt={startedAt:new Date().toISOString(),campaigns:[]};
await writeFile(resolve(root,'reports/pass2-execution.json'),json(receipt));
for (const c of campaigns) {
 console.log('START CAMPAIGN',c.id,new Date().toISOString());
 const start=new Date().toISOString();
 const exitCode=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'src/cli.mjs'),'run',...Object.entries(c).flatMap(([key,value])=>['--'+key,value])],{stdio:'inherit'});child.on('error',reject);child.on('exit',done);});
 receipt.campaigns.push({...c,startedAt:start,finishedAt:new Date().toISOString(),exitCode});
 await writeFile(resolve(root,'reports/pass2-execution.json'),json(receipt));
 console.log('END CAMPAIGN',c.id,'exit',exitCode);
}
receipt.finishedAt=new Date().toISOString();await writeFile(resolve(root,'reports/pass2-execution.json'),json(receipt));
