import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { withMachineOwner } from './machine-owner.mjs';

async function fixture(work) {
 const root = await mkdtemp(join(tmpdir(), 'en-machine-owner-test-'));
 try { await work(join(root, 'private-lease')); }
 finally { await rm(root, { recursive: true, force: true }); }
}

test('independent executions are excluded and a nested command borrows its live machine owner', async () => {
 await fixture(async path => {
  const environment = {};
  await withMachineOwner(async original => {
   await assert.rejects(() => withMachineOwner(() => assert.fail('must not execute'), { path, environment: {} }), /owns machine resources/);
   await withMachineOwner(async nested => {
    assert.equal(nested.borrowed, true);
    assert.deepEqual(nested.owner, original.owner);
   }, { path, environment });
   assert.equal(JSON.parse(await readFile(join(path, 'owner.json'), 'utf8')).id, original.owner.id);
  }, { path, environment });
  assert.deepEqual(environment, {});
  await assert.rejects(() => access(path), { code: 'ENOENT' });
 });
});

test('a real child observes the same private machine lease across checkout-independent execution', async () => {
 await fixture(async path => {
  await withMachineOwner(async () => {
   const code = `import {withMachineOwner} from ${JSON.stringify(new URL('./machine-owner.mjs', import.meta.url).href)};try{await withMachineOwner(()=>{throw Error('unexpected execution')},{path:process.argv[1],environment:{}});process.exitCode=9;}catch(error){if(!error.message.includes('owns machine resources'))throw error;}`;
   const child = spawn(process.execPath, ['--input-type=module', '-e', code, path], { stdio: ['ignore', 'pipe', 'pipe'] });
   let stderr = ''; child.stderr.on('data', chunk => stderr += chunk);
   const result = await new Promise((yes, no) => { child.once('error', no); child.once('close', (code, signal) => yes({ code, signal })); });
   assert.deepEqual(result, { code: 0, signal: null }, stderr);
  }, { path, environment: {} });
 });
});

test('canonical integration ownership can be borrowed only with the exact live owner and path', async () => {
 await fixture(async path => {
  const owner = { id: randomUUID(), pid: process.pid };
  await mkdir(path); const bytes = JSON.stringify(owner); await writeFile(join(path, 'owner.json'), bytes);
  const environment = { EN_GATE_MACHINE_LOCK: path, EN_GATE_MACHINE_OWNER: bytes };
  await withMachineOwner(borrowed => assert.equal(borrowed.borrowed, true), { path, environment });
  assert.equal(await readFile(join(path, 'owner.json'), 'utf8'), bytes);
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: { ...environment, EN_GATE_MACHINE_OWNER: JSON.stringify({ ...owner, id: randomUUID() }) } }), /owner mismatch/);
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: { EN_GATE_MACHINE_OWNER: bytes } }), /path is missing/);
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: { ...environment, EN_TEST_MACHINE_LOCK: path, EN_TEST_MACHINE_OWNER: JSON.stringify({ ...owner, id: randomUUID() }) } }), /owner mismatch/);
  assert.equal(await readFile(join(path, 'owner.json'), 'utf8'), bytes);
 });
});

test('assertion failures release only the owned lease and preserve changed foreign ownership', async () => {
 await fixture(async path => {
  const environment = {};
  await assert.rejects(() => withMachineOwner(() => { throw new Error('seeded assertion failure'); }, { path, environment }), /seeded assertion failure/);
  await assert.rejects(() => access(path), { code: 'ENOENT' });
  assert.deepEqual(environment, {});
  const foreign = { id: randomUUID(), pid: process.pid };
  await assert.rejects(() => withMachineOwner(async () => {
   await writeFile(join(path, 'owner.json'), JSON.stringify(foreign));
   throw new Error('seeded work failure');
  }, { path, environment }), error => error instanceof AggregateError && error.errors[0].message === 'seeded work failure' && /refusing to remove another owner/.test(error.errors[1].message));
  assert.deepEqual(JSON.parse(await readFile(join(path, 'owner.json'), 'utf8')), foreign);
  assert.deepEqual(environment, {});
 });
});

test('incomplete, malformed and dead inherited owners remain retained and never authorize execution', async () => {
 await fixture(async path => {
  await mkdir(path);
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: {} }), /incomplete or unreadable/);
  await writeFile(join(path, 'owner.json'), '{');
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: {} }), /incomplete or unreadable/);
  assert.equal(await readFile(join(path, 'owner.json'), 'utf8'), '{');
  const child = spawn(process.execPath, ['-e', 'process.exit(0)']);
  await new Promise((yes, no) => { child.once('error', no); child.once('close', yes); });
  const bytes = JSON.stringify({ id: randomUUID(), pid: child.pid });
  await writeFile(join(path, 'owner.json'), bytes);
  await assert.rejects(() => withMachineOwner(() => assert.fail(), { path, environment: { EN_TEST_MACHINE_LOCK: path, EN_TEST_MACHINE_OWNER: bytes } }), /cannot be verified alive/);
  assert.equal(await readFile(join(path, 'owner.json'), 'utf8'), bytes);
 });
});

test('bounded queue waits for the verified owner and never removes its lease',async()=>{await fixture(async path=>{let enter,release;const ready=new Promise(r=>enter=r),hold=new Promise(r=>release=r);const first=withMachineOwner(async()=>{enter();await hold;},{path,environment:{}});await ready;const next=withMachineOwner(async owner=>{assert.equal(owner.borrowed,false);assert(owner.queueMs>=0);},{path,environment:{},waitMs:1500});setTimeout(release,30);await first;await next;});});
