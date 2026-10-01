import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { sealSource, verifySource } from './source-seal.mjs';

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'en-delivery-source-seal-')), source = resolve(root, 'checkout');
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(source, 'showcases/performance'), { recursive: true });
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init');
  await writeFile(resolve(source, 'package-lock.json'), '{"lockfileVersion":3}\n');
  await writeFile(resolve(source, 'showcases/performance/package-lock.json'), '{"lockfileVersion":3}\n');
  await writeFile(resolve(source, 'module.mjs'), 'export const value = 1;\n');
  await writeFile(resolve(source, '.gitignore'), 'node_modules/\ndist/\n');
  git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Source fixture');
  return { root, source, git, out: resolve(root, 'snapshot') };
}

test('explicit reference seals exact commit bytes while preserving later worktree edits', async t => {
  const f = await fixture(t), head = f.git('rev-parse', 'HEAD');
  await writeFile(resolve(f.source, 'module.mjs'), 'export const value = 2;\n');
  await writeFile(resolve(f.source, 'untracked.mjs'), 'export const draft = true;\n');
  await sealSource({ source: f.source, out: f.out, ref: head });
  const verified = await verifySource(f.out, { reference: true });
  assert.equal(verified.seal.git.head, head);
  assert.equal(verified.seal.git.dirty, false);
  assert.equal(await readFile(resolve(verified.source, 'module.mjs'), 'utf8'), 'export const value = 1;\n');
  assert.equal(await readFile(resolve(f.source, 'module.mjs'), 'utf8'), 'export const value = 2;\n');
  assert.ok(!verified.seal.files.some(file => file.path === 'untracked.mjs'));
  await assert.rejects(sealSource({ source: f.source, out: f.out, ref: head }), /EEXIST/);
});

test('dirty worktree is explicit candidate evidence and cannot stand in for accepted reference', async t => {
  const f = await fixture(t);
  await writeFile(resolve(f.source, 'module.mjs'), 'export const value = 2;\n');
  await assert.rejects(sealSource({ source: f.source, out: f.out }), /tracked or untracked changes/);
  await sealSource({ source: f.source, out: f.out, allowDirty: true });
  assert.equal((await verifySource(f.out)).seal.git.dirty, true);
  await assert.rejects(verifySource(f.out, { reference: true }), /clean checkout/);
});

test('sealed source rejects changed bytes and additional files', async t => {
  const f = await fixture(t);
  await sealSource({ source: f.source, out: f.out });
  await writeFile(resolve(f.out, 'source/module.mjs'), 'export const value = 3;\n');
  await assert.rejects(verifySource(f.out), /changed, has extra files/);
  await writeFile(resolve(f.out, 'source/module.mjs'), 'export const value = 1;\n');
  await writeFile(resolve(f.out, 'source/extra.mjs'), 'export {};\n');
  await assert.rejects(verifySource(f.out), /changed, has extra files/);
});

test('ignored install and build directories never enter a clean source snapshot', async t => {
  const f = await fixture(t);
  await mkdir(resolve(f.source, 'node_modules'), { recursive: true });
  await mkdir(resolve(f.source, 'dist'), { recursive: true });
  await writeFile(resolve(f.source, 'node_modules/host.js'), 'host dependency');
  await writeFile(resolve(f.source, 'dist/generated.js'), 'stale output');
  await sealSource({ source: f.source, out: f.out });
  const verified = await verifySource(f.out, { reference: true });
  assert.ok(!verified.seal.files.some(file => /^(node_modules|dist)\//.test(file.path)));
});

test('archive refuses export-subst transformations instead of claiming exact committed source', async t => {
  const f = await fixture(t);
  await writeFile(resolve(f.source, '.gitattributes'), 'module.mjs export-subst\n');
  await writeFile(resolve(f.source, 'module.mjs'), "export const hash = '$Format:%H$';\n");
  f.git('add', '.'); f.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Archive substitution');
  await assert.rejects(sealSource({ source: f.source, out: f.out, ref: 'HEAD' }), /changed exact committed bytes/);
});

test('archive explicitly excludes historical artifacts and frozen showcase baselines', async t => {
  const f = await fixture(t);
  await mkdir(resolve(f.source, 'artifacts/frozen'), { recursive: true });
  await mkdir(resolve(f.source, 'showcases/performance/baselines'), { recursive: true });
  await mkdir(resolve(f.source, 'showcases/performance/src'), { recursive: true });
  await writeFile(resolve(f.source, 'artifacts/frozen/old.json'), '{}');
  await writeFile(resolve(f.source, 'showcases/performance/baselines/old.json'), '{}');
  await writeFile(resolve(f.source, 'showcases/performance/src/fixture.mjs'), 'export {};');
  f.git('add', '.'); f.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Historical artifacts');
  await sealSource({ source: f.source, out: f.out, ref: 'HEAD' });
  const verified = await verifySource(f.out, { reference: true });
  assert.equal(verified.seal.selection.excludedFileCount, 2);
  assert.ok(verified.seal.files.some(file => file.path === 'showcases/performance/src/fixture.mjs'));
  assert.ok(!verified.seal.files.some(file => file.path.includes('/old.json')));
});

test('lexically contained symlink cannot escape through another symlink', async t => {
  const f = await fixture(t);
  await writeFile(resolve(f.root, 'outside'), 'outside sealed source');
  await symlink('.', resolve(f.source, 'b'));
  await symlink('b/../outside', resolve(f.source, 'a'));
  await assert.rejects(sealSource({ source: f.source, out: f.out, allowDirty: true }), /resolves outside sealed source/);
});

test('both checkout and committed seals retain the two transitive performance runtime configs only', async t => {
  const f = await fixture(t);
  const retained = ['registry/systems.json', 'profiles/profiles.json'];
  for (const path of [...retained, 'registry/historical.json', 'profiles/legacy.json']) {
    await mkdir(resolve(f.source, 'showcases/performance', path, '..'), { recursive: true });
    await writeFile(resolve(f.source, 'showcases/performance', path), JSON.stringify({ path }));
  }
  f.git('add', '.'); f.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Runtime config inputs');
  for (const [name, options] of [['checkout', {}], ['commit', { ref: 'HEAD' }]]) {
    const out = resolve(f.root, 'sealed-' + name);
    await sealSource({ source: f.source, out, ...options });
    const verified = await verifySource(out, { reference: true });
    for (const path of retained) {
      const selected = 'showcases/performance/' + path;
      assert.ok(verified.seal.files.some(file => file.path === selected));
      assert.ok(verified.seal.selection.included.includes(selected));
      assert.equal(await readFile(resolve(verified.source, selected), 'utf8'), JSON.stringify({ path }));
    }
    assert.ok(!verified.seal.files.some(file => /(?:historical|legacy)\.json$/.test(file.path)));
    assert.equal(verified.seal.selection.excludedFileCount, 2);
  }
});
