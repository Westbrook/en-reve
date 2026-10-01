import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

async function fingerprint(root) {
  const hash=createHash('sha256');
  async function walk(url){
    for(const entry of (await readdir(url,{withFileTypes:true}).catch(()=>[])).sort((a,b)=>a.name.localeCompare(b.name))){
      if(entry.name==='generated')continue;
      const child=new URL(entry.name+(entry.isDirectory()?'/':''),url);
      if(entry.isDirectory())await walk(child);
      else if(/\.(css|ts|mjs|json|js)$/.test(entry.name)){hash.update(child.href);hash.update(await readFile(child).catch(()=>''));}
    }
  }
  for(const path of ['src/','scripts/','../tokens/dist/','../../tooling/css-authoring/'])await walk(new URL(path,root));
  hash.update(await readFile(new URL('css-authoring.json',root)).catch(()=>''));
  return hash.digest('hex');
}
/** Serialized polling makes rename/add/delete and changes during a build reliable. */
export function watchStyles({root=new URL('../',import.meta.url),build,onResult=()=>{},interval=150}){
  let stopped=false,previous=null,timer;
  let active=Promise.resolve();
  const poll=async()=>{
    try{
      const next=await fingerprint(root);
      if(next!==previous){previous=next;try{await build();onResult({ok:true});}catch(error){onResult({ok:false,error});}}
    }catch(error){onResult({ok:false,error});}
    if(!stopped)timer=setTimeout(()=>{active=poll();},interval);
  };
  active=poll();
  return async()=>{stopped=true;clearTimeout(timer);await active;};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const stop=watchStyles({build:()=>new Promise((resolve,reject)=>{
    const child=spawn('npm',['run','build'],{cwd:new URL('../',import.meta.url),stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Styles build exited ${code}`)));
  }),onResult:result=>console.log(result.ok?'CSS styles rebuilt; consumer artifacts refreshed.':'CSS styles build failed; fix the source to resume.')});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await stop();process.exit();});
}
