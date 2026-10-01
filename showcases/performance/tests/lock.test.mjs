import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { exclusiveBrowserWork } from '../src/lock.mjs';

async function fixture(work) {
 const root = await mkdtemp(join(tmpdir(), 'en-native-lease-'));
 try { await work({ root, machine: join(root, 'private-machine'), browser: join(root, 'private-browser.lock') }); }
 finally { await rm(root, { recursive: true, force: true }); }
}

test('native work owns its private machine, checkout and browser resources and cleans up on failure', async () => {
 await fixture(async ({ root, machine, browser }) => {
  const environment = { EN_TEST_MACHINE_LOCK: machine };
  const original = { ...environment };
  await assert.rejects(() => exclusiveBrowserWork(async () => {
   assert.equal(JSON.parse(await readFile(join(machine, 'owner.json'), 'utf8')).pid, process.pid);
   assert.equal(JSON.parse(await readFile(join(root, 'node_modules/.cache/test-execution-owner.json'), 'utf8')).pid, process.pid);
   assert.equal(JSON.parse(await readFile(browser, 'utf8')).pid, process.pid);
   throw new Error('seeded native work failure');
  }, { environment, workspaceRoot: root, browserPath: browser }), /seeded native work failure/);
  for (const path of [machine, browser, join(root, 'node_modules/.cache/test-execution-owner.json')])
   await assert.rejects(() => access(path), { code: 'ENOENT' });
  assert.deepEqual(environment, original);
 });
});

test('native work borrows exact integration machine and browser leases without deleting them', async () => {
 await fixture(async ({ root, machine, browser }) => {
  const owner = { id: randomUUID(), pid: process.pid }, bytes = JSON.stringify(owner);
  await mkdir(machine); await writeFile(join(machine, 'owner.json'), bytes); await writeFile(browser, bytes);
  const environment = { EN_GATE_MACHINE_LOCK: machine, EN_GATE_MACHINE_OWNER: bytes,
   EN_GATE_BROWSER_LOCK: browser, EN_GATE_BROWSER_OWNER: bytes };
  const original = { ...environment };
  await exclusiveBrowserWork(() => {}, { environment, workspaceRoot: root, browserPath: browser });
  assert.equal(await readFile(join(machine, 'owner.json'), 'utf8'), bytes);
  assert.equal(await readFile(browser, 'utf8'), bytes);
  assert.deepEqual(environment, original);
  await assert.rejects(() => access(join(root, 'node_modules/.cache/test-execution-owner.json')), { code: 'ENOENT' });
 });
});

test('native work rejects tampered inherited browser ownership without executing or removing producer leases', async () => {
 await fixture(async ({ root, machine, browser }) => {
  const bytes = JSON.stringify({ id: randomUUID(), pid: process.pid });
  await mkdir(machine); await writeFile(join(machine, 'owner.json'), bytes); await writeFile(browser, bytes);
  const environment = { EN_GATE_MACHINE_LOCK: machine, EN_GATE_MACHINE_OWNER: bytes,
   EN_GATE_BROWSER_LOCK: browser, EN_GATE_BROWSER_OWNER: JSON.stringify({ id: randomUUID(), pid: process.pid }) };
  await assert.rejects(() => exclusiveBrowserWork(() => assert.fail('must not run'), { environment, workspaceRoot: root, browserPath: browser }), /browser lease owner mismatch/);
  assert.equal(await readFile(join(machine, 'owner.json'), 'utf8'), bytes);
  assert.equal(await readFile(browser, 'utf8'), bytes);
 });
});
