import { mkdir, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { throwIfInterrupted } from './interruption.mjs';
import { randomUUID } from 'node:crypto';

const ownerVariable = 'EN_TEST_MACHINE_OWNER';
const pathVariable = 'EN_TEST_MACHINE_LOCK';
const same = (a, b) => a.id === b.id && a.pid === b.pid;
const valid = owner => typeof owner?.id === 'string' && owner.id.length > 0
  && Number.isInteger(owner.pid) && owner.pid > 0;

export function machineOwnerPath(environment = process.env) {
  return resolve(environment[pathVariable] ?? environment.EN_GATE_MACHINE_LOCK
    ?? join(tmpdir(), 'en-reve-integration-machine.lock'));
}

async function readOwner(path) {
  let owner;
  try { owner = JSON.parse(await readFile(join(path, 'owner.json'), 'utf8')); }
  catch (cause) { throw new Error(`Machine lease is incomplete or unreadable; retain and inspect ${path}`, { cause }); }
  if (!valid(owner)) throw new Error(`Machine lease has an invalid owner; retain and inspect ${path}`);
  return owner;
}

function assertAlive(owner, path) {
  try { process.kill(owner.pid, 0); }
  catch (cause) { throw new Error(`Machine owner cannot be verified alive; retain and inspect ${path}`, { cause }); }
}

/** Cooperates with the integration harness's machine directory lease. Never steals a lease. */
export async function withMachineOwner(work, { environment = process.env,
  path = machineOwnerPath(environment), invocation = process.argv, waitMs=0 } = {}) {
  if(!Number.isSafeInteger(waitMs)||waitMs<0)throw new Error('Invalid machine queue timeout');
  const queued=performance.now();
  path = resolve(path);
  const inherited = [
    [ownerVariable, pathVariable],
    ['EN_GATE_MACHINE_OWNER', 'EN_GATE_MACHINE_LOCK'],
  ].filter(([key]) => environment[key] !== undefined);
  if (inherited.length) {
    const actual = await readOwner(path);
    for (const [ownerKey, pathKey] of inherited) {
      if (!environment[pathKey] || resolve(environment[pathKey]) !== path)
        throw new Error('Inherited machine lease path is missing or mismatched');
      const claimed = JSON.parse(environment[ownerKey]);
      if (!valid(claimed) || !same(claimed, actual)) throw new Error('Inherited machine lease owner mismatch');
    }
    assertAlive(actual, path);
    return work({ borrowed: true, owner: actual, path });
  }

  while(true){
    throwIfInterrupted();
    try {await mkdir(path);break;}
    catch(error){
      if(error.code!=='EEXIST')throw error;
      const owner=await readOwner(path);
      if(performance.now()-queued>=waitMs)throw new Error(`Another execution owns machine resources (PID ${owner.pid}); serialize work and retain ${path}`);
      assertAlive(owner,path); // Waiting never authorizes recovery or stealing.
      await delay(Math.min(250,Math.max(1,waitMs-(performance.now()-queued))));
    }
  }
  const owner = { id: randomUUID(), pid: process.pid, startedAt: new Date().toISOString(), invocation };
  try { await writeFile(join(path, 'owner.json'), JSON.stringify(owner) + '\n', { flag: 'wx' }); }
  catch (error) {
    // Retain any partial owner record; only remove a still-empty directory.
    await rmdir(path).catch(() => {});
    throw error;
  }
  const previous = Object.fromEntries([ownerVariable, pathVariable].map(key => [key, environment[key]]));
  let failure;
  try {
    environment[ownerVariable] = JSON.stringify(owner);
    environment[pathVariable] = path;
    return await work({ borrowed: false, owner, path, queueMs:performance.now()-queued });
  } catch (error) { failure = error; throw error; }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete environment[key]; else environment[key] = value;
    }
    try {
      const current = await readOwner(path);
      if (!same(current, owner)) throw new Error('Machine ownership changed; refusing to remove another owner');
      await unlink(join(path, 'owner.json'));
      await rmdir(path);
    } catch (cleanupError) {
      if (failure) throw new AggregateError([failure, cleanupError], 'Execution and machine cleanup failed');
      throw cleanupError;
    }
  }
}
