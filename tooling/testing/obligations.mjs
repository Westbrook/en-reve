import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {schedulePlan} from './schedule.mjs';
export function obligations(tasks,pathways){
 return tasks.map(task=>({id:task.id,owner:task.assertionSources??(task.config?[task.config]:task.command?.filter(arg=>/\.(?:[cm]?[jt]s|py)$/.test(arg))??[]),kind:task.kind,
  purpose:task.scope??task.failurePolicy??({producer:'Produce the required consumer artifacts using their owning compiler/generator',types:'Detect semantic type errors against the declared compiler environment',node:'Exercise the assertions in the owning Node sources',browser:'Exercise the complete owning configuration and its engine/fixture matrix',barrier:'Require every producer in this boundary'}[task.kind]??'Execute the original assertion owner; individual case rationale remains in its source'),
  aliases:Object.entries(pathways).filter(([,ids])=>ids.includes(task.id)).map(([name])=>name),prerequisites:task.dependencies??[],resources:schedulePlan([{...task,dependencies:[],deps:[]}])[0],
  inputs:{assertions:task.assertionSources??[],config:task.config??null,sourceClosure:task.dependenciesComplete===true?'declared-complete':'unresolved; broad final gate remains required'},
  matrix:task.config?'Resolved by non-executing Playwright discovery before coverage qualification':task.selection??task.isolation??'Owning command and flags',
  tier:task.kind==='producer'?'preparation':task.freshAcquisition?'separate-acquisition':'selected-correctness',
  reuse:{priorResults:false,reason:'Incomplete dependency closure; no changed-only or cross-run result admission'},
 }));
}
/** Read-only activation inventory. No recipe or hook is executed. */
export async function triggerInventory(root){
 const records=[];
 for(const path of ['AGENTS.md','README.md','tooling/test-pipeline/README.md','apps/docs/tests/README.md','showcases/performance/ci/github-actions.yml'])try{
  const text=await readFile(resolve(root,path),'utf8');records.push({path,activation:path.includes('/ci/')?'template-only':'guidance',lines:text.split('\n').flatMap((text,index)=>/test|validat|confirm|check|campaign|npm ci/i.test(text)?[{line:index+1,text}]:[])});
 }catch(error){if(error.code!=='ENOENT')throw error;}
 let workflows=[];try{workflows=await readdir(resolve(root,'.github/workflows'));}catch(error){if(error.code!=='ENOENT')throw error;}
 let hooksPath=null;try{hooksPath=execFileSync('git',['config','--get','core.hooksPath'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch(error){if(error.status!==1)throw error;}
 return {records,workflows,hooksPath,policy:'Presence is inventory only; templates, historical recipes and manual review are never activated by discovery.'};
}
