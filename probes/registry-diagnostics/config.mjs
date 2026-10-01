import {mkdir,readFile,realpath,writeFile,rename,lstat} from 'node:fs/promises';
import {resolve,dirname,join,isAbsolute,relative,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
export function configuration(env=process.env,root=process.cwd()) {
 if(!env.EN_DIAGNOSTICS_OUT||!isAbsolute(env.EN_DIAGNOSTICS_OUT))throw Error('EN_DIAGNOSTICS_OUT must name a new absolute caller-owned directory.');
 const port=env.EN_DIAGNOSTICS_PORT??'0';if(!/^\d+$/.test(port)||Number(port)>65535)throw Error('EN_DIAGNOSTICS_PORT must be 0 (free port) or 1–65535.');
 const browsers=(env.EN_DIAGNOSTICS_BROWSERS??'chromium,firefox,webkit').split(',');
 if(!browsers.length||new Set(browsers).size!==browsers.length||browsers.some(b=>!['chromium','firefox','webkit'].includes(b)))throw Error('Select unique supported engines; empty selection is invalid.');
 if(env.EN_DIAGNOSTICS_EXPECT_COMMIT&&!/^[a-f0-9]{40}$/.test(env.EN_DIAGNOSTICS_EXPECT_COMMIT))throw Error('Expected commit must be a full hash.');
 return {root:resolve(root),output:resolve(env.EN_DIAGNOSTICS_OUT),port:Number(port),browsers,expectedCommit:env.EN_DIAGNOSTICS_EXPECT_COMMIT??null};
}
export async function claimOutput(config) {
 // Resolve the existing parent before checking boundaries, including symlink aliases.
 const parent=await realpath(dirname(config.output)),output=join(parent,config.output.split('/').at(-1));
 const frozenPath=join(config.root,'artifacts/scoped-followup-registry-diagnostics');
 let frozen;
 try{frozen=await realpath(frozenPath);}catch(error){
  if(error.code!=='ENOENT')throw error;
  // A clean current checkout may omit historical outputs. Keep their reserved
  // boundary protected without creating or importing those measurements.
  frozen=join(await realpath(dirname(frozenPath)),'scoped-followup-registry-diagnostics');
 }
 const rel=relative(frozen,output),parentTraversal=rel==='..'||rel.startsWith('..'+sep);if(rel===''||(!parentTraversal&&!isAbsolute(rel)))throw Error('Historical diagnostics evidence is immutable.');
 await mkdir(output); // Collision, file and symlink cases fail without altering the target.
 const id=randomUUID();await writeFile(join(output,'.diagnostics-run.json'),JSON.stringify({id}),{flag:'wx'});
 return {...config,output,id};
}
export async function atomicJSON(path,value) {const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,path);}
export async function ownedRun(env=process.env) {
 const config=configuration(env);const marker=JSON.parse(await readFile(join(config.output,'.diagnostics-run.json'),'utf8'));
 if(!env.EN_DIAGNOSTICS_RUN_ID||marker.id!==env.EN_DIAGNOSTICS_RUN_ID)throw Error('Use qualify.mjs; output ownership token does not match.');
 return {...config,id:marker.id};
}
export async function newResult(path,value) {await writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
export async function assertMissing(path) {try {await lstat(path);}catch(e){if(e.code==='ENOENT')return;throw e;}throw Error('Result already exists: '+path);}
