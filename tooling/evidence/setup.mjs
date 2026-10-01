import { readdir, readFile, readlink, lstat, realpath, mkdir, rename, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digestBytes, digestJson } from './identity.ts';

/** Content inventory includes names, additions, deletions and symlink targets, never mtimes. */
export async function contentInventory(root, paths, exclude = () => false, followLinks = true, { includeModes = false, digestFile } = {}) {
  const entries = {};
  // Bound filesystem requests; canonical ordering below is independent of completion order.
  let active = 0;
  const queue = [];
  async function io(operation) {
    await new Promise(resolve => { if (active < 24) { active++; resolve(); } else queue.push(resolve); });
    try { return await operation(); }
    finally { const next = queue.shift(); if (next) next(); else active--; }
  }
  async function visit(path, ancestors = new Set()) {
    const name = relative(root, path).replaceAll('\\', '/');
    if (exclude(name)) return;
    let info;
    try { info = await io(() => lstat(path)); } catch (error) { if (error.code === 'ENOENT') { entries[name] = null; return; } throw error; }
    if (info.isSymbolicLink()) {
      entries[name + '@link'] = await io(() => readlink(path));
      if (!followLinks) return;
      try { return await visit(await io(() => realpath(path)), ancestors); } catch (error) { if (error.code === 'ENOENT') { entries[name] = null; return; } throw error; }
    }
    if (info.isDirectory()) {
      const actual = await io(() => realpath(path));
      if (ancestors.has(actual)) { entries[name + '/'] = { cycle: actual }; return; }
      const next = new Set(ancestors); next.add(actual); entries[name + '/'] = includeModes ? {type:'directory',mode:info.mode & 0o777} : 'directory';
      await Promise.all((await io(() => readdir(path))).sort().map(child => visit(resolve(path, child), next)));
    } else if (info.isFile()) {
      const digest = digestFile ? await io(() => digestFile(path)) : digestBytes(await io(() => readFile(path)));
      entries[name] = includeModes ? {digest,mode:info.mode & 0o777} : digest;
    }
    else throw new Error(`Unsupported setup input: ${name}`);
  }
  for (const path of paths) await visit(resolve(root, path));
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}
export async function atomicJSON(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value) + '\n', { flag: 'wx' });
  await rename(temporary, path);
}
export const inventoryDigest = digestJson;
export function immutable(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(immutable); Object.freeze(value); }
  return value;
}
