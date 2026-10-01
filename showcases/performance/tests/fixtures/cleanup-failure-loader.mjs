// Failure injection at module boundaries; the owned HTTP server is real.
import { registerHooks } from 'node:module';
const moduleURL = source => 'data:text/javascript,' + encodeURIComponent(source);
const config = moduleURL(`
 export const root=process.env.EN_NATIVE_CLEANUP_ROOT;
 export const showcases=root+'/showcases';
 export const registry=[{id:'en-reve',port:0}];
 export const selectSystems=()=>registry;
 export const json=value=>JSON.stringify(value,null,2)+'\\n';
`);
const server = moduleURL(`
 import {createServer} from 'node:http';
 import {appendFileSync} from 'node:fs';
 const trace=event=>appendFileSync(process.env.EN_NATIVE_CLEANUP_TRACE,JSON.stringify(event)+'\\n');
 export async function startServers(){
  const server=createServer((request,response)=>response.end('fixture'));
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  trace({event:'server-started',port:server.address().port});
  return async()=>{
   trace({event:'server-stop-attempt'});
   await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
   trace({event:'server-closed',listening:server.listening});
   if(process.env.EN_NATIVE_CLEANUP_STOP_FAIL==='1')throw Error('server-stop-failure');
  };
 }
`);
const playwright = moduleURL(`
 import {appendFileSync} from 'node:fs';
 const trace=event=>appendFileSync(process.env.EN_NATIVE_CLEANUP_TRACE,JSON.stringify(event)+'\\n');
 export const chromium={async launch(){
  trace({event:'browser-launch'});
  if(process.env.EN_NATIVE_CLEANUP_LAUNCH_FAIL==='1')throw Error('browser-launch-failure');
  const fail=async()=>{throw Error('acquisition-work-failure')};
  return {newPage:fail,newContext:fail,async close(){trace({event:'browser-close-attempt'});throw Error('browser-close-failure')}};
 }};
 export const expect=()=>{throw Error('Unexpected browser assertion in failure fixture')};
`);
const lock = moduleURL('export async function exclusiveBrowserWork(work){return work()}');
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='@playwright/test')return {url:playwright,shortCircuit:true};
 if(specifier.endsWith('/config.mjs'))return {url:config,shortCircuit:true};
 if(specifier.endsWith('/server.mjs'))return {url:server,shortCircuit:true};
 if(specifier.endsWith('/lock.mjs'))return {url:lock,shortCircuit:true};
 return nextResolve(specifier,context);
}});
