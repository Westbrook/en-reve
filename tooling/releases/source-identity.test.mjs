import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {sourceIdentity} from './source-identity.mjs';

const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const git = (root, args, input) => execFileSync('git', args, {cwd: root, input, encoding: 'utf8'});
async function repository(t) {
  const root = await mkdtemp(join(tmpdir(), 'en-source-identity-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  git(root, ['init', '--quiet']);
  git(root, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'fixture']);
  return root;
}

test('source identity handles over 1 MiB of tracked paths and detects edits and missing files', async t => {
  const root = await repository(t);
  const paths = Array.from({length: 6000}, (_, index) => `large-index/${String(index).padStart(5, '0')}-${'source-identity'.repeat(14)}.js`);
  assert.ok(Buffer.byteLength(paths.join('\0') + '\0') > 1024 * 1024);
  const blob = git(root, ['hash-object', '-w', '--stdin'], '').trim();
  // Populate only the index: absent tracked files must still contribute null.
  git(root, ['update-index', '-z', '--index-info'], paths.map(file => `100644 ${blob}\t${file}\0`).join(''));
  await writeFile(join(root, 'source.js'), 'export const value = 1;\n');
  git(root, ['add', 'source.js']);
  const expected = content => sha(JSON.stringify([
    ...paths.map(file => [file, null]),
    ['source.js', content === null ? null : sha(content)],
  ]));
  const initial = await sourceIdentity(root);
  assert.equal(initial.files, paths.length + 1);
  assert.equal(initial.head, git(root, ['rev-parse', 'HEAD']).trim());
  assert.equal(initial.sourceDigest, expected('export const value = 1;\n'));
  assert.deepEqual(await sourceIdentity(root), initial);
  await writeFile(join(root, 'source.js'), 'export const value = 2;\n');
  assert.equal((await sourceIdentity(root)).sourceDigest, expected('export const value = 2;\n'));
  await rm(join(root, 'source.js'));
  assert.equal((await sourceIdentity(root)).sourceDigest, expected(null));
});

test('source identity preserves filtering, untracked inclusion, and unusual path sorting', async t => {
  const root = await repository(t);
  const sources = new Map([
    ['z-untracked.js', 'untracked'],
    ['line\nbreak.ts', 'newline'],
    ['følder/源.ts', 'unicode'],
    ['results-keep.js', 'retained'],
  ]);
  const omitted = ['artifacts/excluded.js', 'nested/artifacts/excluded.js', 'nested/results/excluded.js', 'dist/excluded.js', 'node_modules/excluded.js', 'ignored.js'];
  for (const [file, content] of [...sources, ...omitted.map(file => [file, 'excluded'])]) {
    await mkdir(join(root, file, '..'), {recursive: true});
    await writeFile(join(root, file), content);
  }
  await writeFile(join(root, '.git/info/exclude'), 'ignored.js\n');
  git(root, ['add', 'line\nbreak.ts', 'følder/源.ts', ...omitted.filter(file => file !== 'ignored.js')]);
  const identity = await sourceIdentity(root);
  assert.equal(identity.files, sources.size);
  assert.equal(identity.sourceDigest, sha(JSON.stringify([...sources.keys()].sort().map(file => [file, sha(sources.get(file))]))));
});

test('source identity rejects a failed git enumeration', async t => {
  const root = await mkdtemp(join(tmpdir(), 'en-source-identity-invalid-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await assert.rejects(sourceIdentity(root), /git ls-files failed/);
});
