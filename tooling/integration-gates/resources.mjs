/** Cooperative machine resources: browser file first, machine directory second. Never steal. */
import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export async function atomic(path,data){const temp=`${path}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(data,null,2)+'\n');await rename(temp,path);}
const same=(a,b)=>a.id===b.id&&a.pid===b.pid;
export async function acquireLock(path,owner){
 await mkdir(path);
 try{await atomic(join(path,'owner.json'),owner);}catch(error){await rm(path,{recursive:true});throw error;}
 return async()=>{const current=JSON.parse(await readFile(join(path,'owner.json'),'utf8'));if(!same(current,owner))throw Error('Lock ownership changed');await rm(path,{recursive:true});};
}
export function resourcePaths(root,env=process.env){
 const common=execFileSync('git',['rev-parse','--path-format=absolute','--git-common-dir'],{cwd:root,encoding:'utf8'}).trim();
 return {browser:resolve(env.EN_GATE_BROWSER_LOCK??join(dirname(common),'showcases/performance/.cache/browser-run.lock')),machine:resolve(env.EN_GATE_MACHINE_LOCK??join(tmpdir(),'en-reve-integration-machine.lock'))};
}
async function verify(path,owner){
 if(!owner?.id||!Number.isInteger(owner.pid)||owner.pid<=0)throw Error('Invalid inherited resource owner');
 const actual=JSON.parse(await readFile(path,'utf8'));if(!same(actual,owner))throw Error('Inherited resource ownership mismatch');
 try{process.kill(owner.pid,0);}catch(error){if(error.code!=='EPERM')throw Error('Inherited resource owner is not alive');}
}
export async function acquireResources(root,{env=process.env,paths=resourcePaths(root,env)}={}){
 const inherited=env.EN_GATE_MACHINE_OWNER||env.EN_GATE_BROWSER_OWNER;
 if(inherited){
  if(!env.EN_GATE_MACHINE_OWNER||!env.EN_GATE_BROWSER_OWNER||!env.EN_GATE_MACHINE_LOCK||!env.EN_GATE_BROWSER_LOCK)throw Error('Partial inherited resource context');
  const machineOwner=JSON.parse(env.EN_GATE_MACHINE_OWNER),browserOwner=JSON.parse(env.EN_GATE_BROWSER_OWNER);
  await verify(join(paths.machine,'owner.json'),machineOwner);await verify(paths.browser,browserOwner);
  return {paths,inherited:true,env:{EN_GATE_MACHINE_LOCK:paths.machine,EN_GATE_MACHINE_OWNER:JSON.stringify(machineOwner),EN_GATE_BROWSER_LOCK:paths.browser,EN_GATE_BROWSER_OWNER:JSON.stringify(browserOwner)},release:async()=>{}};
 }
 const owner={id:randomUUID(),pid:process.pid,startedAt:new Date().toISOString()};
 await mkdir(dirname(paths.browser),{recursive:true});
 await writeFile(paths.browser,JSON.stringify(owner)+'\n',{flag:'wx'});
 const releaseBrowser=async()=>{await verify(paths.browser,owner);await rm(paths.browser);};
 let releaseMachine;try{releaseMachine=await acquireLock(paths.machine,owner);}catch(error){await releaseBrowser();throw error;}
 return {paths,inherited:false,env:{EN_GATE_MACHINE_LOCK:paths.machine,EN_GATE_MACHINE_OWNER:JSON.stringify(owner),EN_GATE_BROWSER_LOCK:paths.browser,EN_GATE_BROWSER_OWNER:JSON.stringify(owner)},release:async()=>{try{await releaseMachine();}finally{await releaseBrowser();}}};
}
