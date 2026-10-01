import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {BrowserPorts} from './browser-ports.mjs';
const config='probes/scoped-registry/playwright.config.ts';
const listen=(server,port=0)=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
const close=server=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
test('one scope endpoint remains reserved across discovery and is released for its owner',async()=>{
 const pool=new BrowserPorts();let successor;
 try{
  const [a,b]=await Promise.all([pool.environment(config,{}),pool.environment(config,{})]);assert.deepEqual(a,b);
  const port=Number(a.EN_SCOPE_PORT);assert(port>0);assert.deepEqual(await pool.environment('unreviewed',{}),{});
  const intruder=createServer();await assert.rejects(listen(intruder,port),{code:'EADDRINUSE'});
  await pool.release(config);successor=createServer();await listen(successor,port);
  assert.deepEqual(await pool.environment(config,{}),a,'execution must match discovery');
  await pool.close();assert(successor.listening,'pool must not close the actual server or another owner');
 }finally{await pool.close();if(successor?.listening)await close(successor);}
});
test('explicit endpoints are preserved and abandoned reservations close on cancellation',async()=>{
 const pool=new BrowserPorts(),owner=createServer();await listen(owner);
 try{
  assert.deepEqual(await pool.environment(config,{EN_SCOPE_PORT:String(owner.address().port)}),{});
  const env=await pool.environment(config,{});assert.notEqual(Number(env.EN_SCOPE_PORT),owner.address().port);
  await pool.close();assert(owner.listening);
  const replacement=createServer();await listen(replacement,Number(env.EN_SCOPE_PORT));await close(replacement);
 }finally{await pool.close();await close(owner);}
});
