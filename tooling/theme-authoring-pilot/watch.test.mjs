import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, unlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEngine } from './compiler.mjs';
import { rebuild, watchDefinitions } from './watch.mjs';

test('watch edit/add/delete, errors, and recovery match fresh manifest builds', async () => {
  const root = await mkdtemp(join(tmpdir(),'theme07-watch-'));
  const engine = await loadEngine();
  const consumer = '.a{width:--value()}';
  const manifest = names => writeFile(join(root,'manifest.json'),JSON.stringify({definitions:names}));
  let pending;
  const results = [];
  const stop = watchDefinitions(root,consumer,engine,result => { results.push(result); pending?.(result); });
  const changed = async (mutate, predicate) => {
    const promise = new Promise((resolve,reject) => {
      const timeout = setTimeout(() => reject(new Error('Watch result timed out')),3000);
      pending = result => { if (predicate(result)) {clearTimeout(timeout);pending=null;resolve(result);} };
    });
    await mutate();
    return promise;
  };
  try {
    await changed(async()=>{await writeFile(join(root,'one.css'),'@function --value(){result:1px}');await manifest(['one.css']);},r=>r.ok);
    assert.equal(results.at(-1).result.css,(await rebuild(root,consumer,engine)).css);
    await changed(()=>writeFile(join(root,'one.css'),'@function --value(){result:2px}'),r=>r.ok&&r.result.css.includes('2px'));
    assert.equal(results.at(-1).result.css,(await rebuild(root,consumer,engine)).css);
    await changed(async()=>{await writeFile(join(root,'two.css'),'@function --other(){result:8px}');await manifest(['one.css','two.css']);},r=>r.ok);
    assert.equal(results.at(-1).result.css,(await rebuild(root,consumer,engine)).css);
    await changed(()=>writeFile(join(root,'two.css'),'@function --value(){result:9px}'),r=>!r.ok&&r.error.includes('Duplicate definition'));
    await assert.rejects(rebuild(root,consumer,engine),/Duplicate definition/);
    await changed(()=>unlink(join(root,'two.css')),r=>!r.ok&&r.error.includes('ENOENT'));
    await assert.rejects(rebuild(root,consumer,engine),/ENOENT/);
    await changed(()=>manifest(['one.css']),r=>r.ok);
    assert.equal(results.at(-1).result.css,(await rebuild(root,consumer,engine)).css);
    await changed(()=>writeFile(join(root,'one.css'),'@function --value(){result:var(--missing)}'),r=>!r.ok&&r.error.includes('must reference'));
    await changed(()=>writeFile(join(root,'one.css'),'@function --value(){result:3px}'),r=>r.ok&&r.result.css.includes('3px'));
    assert.equal(results.at(-1).result.css,(await rebuild(root,consumer,engine)).css);
  } finally { await stop(); await rm(root,{recursive:true,force:true}); }
});
