import { spawn } from 'node:child_process';
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { lab, repo } from './config.mjs';
export async function execute(command, args, {cwd=repo, env=process.env, log}={}) {
  const handle=log ? await open(log,'wx') : null;
  const writes=[];
  try {
    await new Promise((done,reject)=>{
      const child=spawn(command,args,{cwd,env,stdio:handle?['ignore','pipe','pipe']:'inherit'});
      if(handle)for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{process.stdout.write(chunk);writes.push(handle.write(chunk));});
      child.once('error',reject);child.once('exit',(code,signal)=>code===0?done():reject(Error(`${command} exited ${code ?? signal}; retained log: ${log || 'terminal'}`)));
    });
  } finally {await Promise.all(writes);await handle?.close();}
}
export const node = (script,args=[],options={})=>execute(process.execPath,[resolve(lab,script),...args],options);
