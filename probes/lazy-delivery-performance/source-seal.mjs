import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, readlink, realpath, symlink, writeFile, chmod } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export async function digestFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
export const json = async path => JSON.parse(await readFile(path, 'utf8'));
export const writeJSON = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const sourceDirectories = ['packages', 'apps', 'tooling', 'probes', 'plans', 'showcases/performance/src'];
const performanceRuntimeConfigs = ['showcases/performance/registry/systems.json', 'showcases/performance/profiles/profiles.json'];
export function selectedSourcePath(path) {
  return !path.includes('/') || sourceDirectories.some(directory => path.startsWith(directory + '/'))
    || performanceRuntimeConfigs.includes(path)
    || /^showcases\/performance\/[^/]+$/.test(path);
}
function selectionIdentity(names) {
  const excluded = names.filter(name => !selectedSourcePath(name)).sort();
  return {
    id: 'en-reve-production-build-source-v1',
    included: ['Every root tracked file', ...sourceDirectories.map(path => path + '/**'), 'showcases/performance/* (direct files only)', ...performanceRuntimeConfigs],
    excluded: ['artifacts/**', 'showcases/** except the explicitly included performance sources, direct files and two runtime configs', 'All other nonselected top-level directories; no host fallback'],
    excludedFileCount: excluded.length, excludedPathsSha256: digest(excluded),
    scope: 'Bounded production build source closure with complete repository Git commit/tree identity; this is not a full repository source archive.',
  };
}

export function contained(root, path) {
  const result = relative(root, path);
  return result === '' || (!result.startsWith('..' + sep) && result !== '..' && !isAbsolute(result));
}

export async function fileIdentity(root, name) {
  if (isAbsolute(name) || !contained(root, resolve(root, name))) throw new Error('Unsafe source path: ' + name);
  const path = resolve(root, name), info = await lstat(path);
  if (info.isSymbolicLink()) {
    const target = await readlink(path);
    if (isAbsolute(target) || !contained(root, resolve(dirname(path), target))) throw new Error('Source symlink leaves sealed source: ' + name);
    let referent;
    try { referent = await realpath(path); }
    catch (error) { throw new Error('Source symlink must resolve within the declared source: ' + name, { cause: error }); }
    if (!contained(await realpath(root), referent)) throw new Error('Source symlink resolves outside sealed source: ' + name);
    return { path: name, type: 'symlink', target, sha256: digest(target) };
  }
  if (!info.isFile()) throw new Error('Source inventory requires ordinary files: ' + name);
  return { path: name, type: 'file', executable: Boolean(info.mode & 0o111), bytes: info.size, sha256: await digestFile(path) };
}

export async function inventoryFiles(root, names) {
  const files = [];
  for (let index = 0; index < names.length; index += 16) files.push(...await Promise.all(names.slice(index, index + 16).map(name => fileIdentity(root, name))));
  return files;
}

export async function inventory(root) {
  const names = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else names.push(relative(root, path).split(sep).join('/'));
    }
  }
  await walk(root);
  return inventoryFiles(root, names.sort());
}

export async function copyInventory(source, destination, files) {
  await mkdir(destination, { recursive: false });
  for (const entry of files) {
    const target = resolve(destination, entry.path);
    if (!contained(destination, target)) throw new Error('Unsafe source inventory path: ' + entry.path);
    await mkdir(dirname(target), { recursive: true });
    if (entry.type === 'symlink') await symlink(entry.target, target);
    else {
      await copyFile(resolve(source, entry.path), target);
      await chmod(target, entry.executable ? 0o755 : 0o644);
    }
  }
}

async function sourceState(root, allowDirty) {
  if ((await realpath(root)) !== (await realpath(git(root, 'rev-parse', '--show-toplevel').trim()))) throw new Error('--source must be a Git checkout root');
  const status = git(root, 'status', '--porcelain=v1', '--untracked-files=all');
  if (status && !allowDirty) throw new Error('Source has tracked or untracked changes. Seal an accepted clean checkout, or explicitly use --allow-dirty for a candidate snapshot.');
  const allNames = [...new Set(git(root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean))].sort();
  const names = allNames.filter(selectedSourcePath);
  const files = [];
  for (const name of names) {
    try { files.push(await fileIdentity(root, name)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; } // A recorded deletion is part of the worktree status.
  }
  return {
    git: {
      head: git(root, 'rev-parse', 'HEAD').trim(),
      tree: git(root, 'rev-parse', 'HEAD^{tree}').trim(),
      status, dirty: Boolean(status),
      trackedDiffSha256: digest(git(root, 'diff', '--binary', 'HEAD', '--')),
      indexSha256: digest(git(root, 'ls-files', '--stage', '-z')),
    },
    selection: selectionIdentity(allNames), files, sourceSha256: digest(files),
  };
}

/** Freeze the declared build-source closure, without historical evidence, host runtimes, or dependency links. */
export async function sealSource({ source, out, allowDirty = false, ref }) {
  source = await realpath(resolve(source)); out = resolve(out);
  if (contained(source, out)) throw new Error('Snapshot output must be outside its source checkout');
  if (ref && allowDirty) throw new Error('--ref and --allow-dirty describe different source identities; choose one');
  let before;
  if (ref) {
    const head = git(source, 'rev-parse', '--verify', ref + '^{commit}').trim();
    const tree = git(source, 'rev-parse', head + '^{tree}').trim();
    await mkdir(out, { recursive: false });
    await mkdir(resolve(out, 'source'));
    const allTreeEntries = git(source, 'ls-tree', '-r', '-z', '--full-tree', head).split('\0').filter(Boolean).map(row => {
      const tab = row.indexOf('\t'), [mode, type, object] = row.slice(0, tab).split(' ');
      return { path: row.slice(tab + 1), mode, type, object };
    });
    const treeEntries = allTreeEntries.filter(entry => selectedSourcePath(entry.path));
    const directories = sourceDirectories.filter(directory => treeEntries.some(entry => entry.path.startsWith(directory + '/')));
    const directFiles = treeEntries.map(entry => entry.path).filter(path => !directories.some(directory => path.startsWith(directory + '/')));
    const archive = resolve(out, 'source.tar');
    git(source, 'archive', '--format=tar', '--output=' + archive, head, '--', ...directFiles, ...directories);
    execFileSync('tar', ['-xf', archive, '-C', resolve(out, 'source')]);
    const files = await inventory(resolve(out, 'source'));
    const expectedNames = treeEntries.map(entry => entry.path).sort();
    if (digest(files.map(file => file.path)) !== digest(expectedNames)) throw new Error('Git archive omitted selected tracked files (export-ignore or submodule); the complete declared build-source closure is required');
    const fileMap = new Map(files.map(file => [file.path, file]));
    for (const entry of treeEntries) {
      const file = fileMap.get(entry.path);
      const hash = createHash(entry.object.length === 40 ? 'sha1' : 'sha256');
      if (file.type === 'symlink') hash.update(`blob ${Buffer.byteLength(file.target)}\0`).update(file.target);
      else {
        hash.update(`blob ${file.bytes}\0`);
        for await (const chunk of createReadStream(resolve(out, 'source', entry.path))) hash.update(chunk);
      }
      const object = hash.digest('hex');
      if (entry.type !== 'blob' || object !== entry.object || (entry.mode === '100755') !== Boolean(file.executable)) throw new Error('Git archive changed exact committed bytes or executable mode: ' + entry.path);
    }
    before = { git: { head, tree, requestedRef: ref, dirty: false, status: '', archiveSha256: await digestFile(archive) }, selection: selectionIdentity(allTreeEntries.map(entry => entry.path)), files, sourceSha256: digest(files) };
  } else {
    before = await sourceState(source, allowDirty);
    await mkdir(out, { recursive: false });
    await copyInventory(source, resolve(out, 'source'), before.files);
    const after = await sourceState(source, allowDirty);
    if (digest(before) !== digest(after)) throw new Error('Source changed while sealing; incomplete snapshot retained for diagnosis');
    const copied = await inventory(resolve(out, 'source'));
    if (digest(copied) !== before.sourceSha256) throw new Error('Copied source differs from the exact captured checkout');
  }
  const lock = before.files.find(file => file.path === 'package-lock.json');
  const performanceLock = before.files.find(file => file.path === 'showcases/performance/package-lock.json');
  if (!lock || !performanceLock) throw new Error('Both root and performance exact locks are required');
  const seal = {
    schemaVersion: 1, kind: 'en-reve-lazy-delivery-source', sealedAt: new Date().toISOString(),
    origin: source, ...before,
    rootLockSha256: lock.sha256, performanceLockSha256: performanceLock.sha256,
    policy: ref ? 'Explicit Git commit archive of the declared build-source closure; no worktree overlay, historical compatibility patch, generated install or host runtime.' : 'Git tracked and non-ignored untracked files in the declared build-source closure, including recorded candidate edits. Historical evidence, ignored installs, build outputs, caches and private runtimes are excluded.',
  };
  seal.sealSha256 = digest(seal);
  await writeJSON(resolve(out, 'source-seal.json'), seal);
  return { out, sealSha256: seal.sealSha256, sourceSha256: seal.sourceSha256, git: seal.git };
}

export async function verifySource(snapshot, { reference = false } = {}) {
  snapshot = await realpath(resolve(snapshot));
  const seal = await json(resolve(snapshot, 'source-seal.json'));
  const { sealSha256, ...payload } = seal;
  if (seal.schemaVersion !== 1 || seal.kind !== 'en-reve-lazy-delivery-source' || digest(payload) !== sealSha256) throw new Error('Missing or invalid source seal: ' + snapshot);
  if (seal.selection?.id !== 'en-reve-production-build-source-v1' || seal.files.some(file => !selectedSourcePath(file.path))) throw new Error('Missing or incompatible declared build-source selection');
  if (reference && seal.git.dirty) throw new Error('The accepted reference must be captured from a clean checkout');
  if (!/^[a-f0-9]{40,64}$/.test(seal.git.head) || !/^[a-f0-9]{40,64}$/.test(seal.git.tree)) throw new Error('Source seal lacks exact Git identities');
  const source = resolve(snapshot, 'source'), actual = await inventory(source);
  if (digest(actual) !== seal.sourceSha256 || digest(seal.files) !== seal.sourceSha256) throw new Error('Sealed source changed, has extra files, or is incomplete: ' + snapshot);
  for (const [path, expected] of [['package-lock.json', seal.rootLockSha256], ['showcases/performance/package-lock.json', seal.performanceLockSha256]]) {
    if (actual.find(file => file.path === path)?.sha256 !== expected) throw new Error('Sealed lock identity mismatch: ' + path);
  }
  return { snapshot, source, seal };
}

export async function sealCLI() {
  const options = new Map(process.argv.slice(2).map(arg => { const at = arg.indexOf('='); return at < 0 ? [arg, true] : [arg.slice(0, at), arg.slice(at + 1)]; }));
  if ([...options.keys()].some(key => !['--source', '--ref', '--out', '--allow-dirty'].includes(key)) || !options.get('--source') || !options.get('--out')) {
    throw new Error('Usage: node seal.mjs --source=/checkout --out=/new-snapshot [--ref=<exact-commit> | --allow-dirty]');
  }
  console.log(JSON.stringify(await sealSource({ source: options.get('--source'), out: options.get('--out'), ref: options.get('--ref'), allowDirty: options.has('--allow-dirty') })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await sealCLI();
