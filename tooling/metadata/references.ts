import {posix} from 'node:path';

/** One cycle-safe CEM resolver for extraction, docs and release review. */
export function createReferenceResolver(manifest: any) {
  const modules = new Map<string, any>(manifest.modules.map((module: any) => [module.path, module]));
  function resolve(reference: any, from: string, visited = new Set<string>()): {declaration: any; modulePath: string} | undefined {
    if (!reference?.name || reference.package) return undefined;
    const target = reference.module ?? from;
    const candidates = [target, target.replace(/\.js$/, '.ts'), posix.normalize(posix.join(posix.dirname(from), target)), posix.normalize(posix.join(posix.dirname(from), target)).replace(/\.js$/, '.ts')];
    for (const path of [...new Set(candidates)]) {
      const module = modules.get(path), key = `${path}#${reference.name}`;
      if (!module || visited.has(key)) continue;
      const declaration = module.declarations?.find((item: any) => item.name === reference.name);
      if (declaration) return {declaration, modulePath: path};
      const next = new Set(visited).add(key);
      for (const entry of module.exports ?? []) {
        if (entry.kind !== 'js' || entry.name !== reference.name) continue;
        const result = resolve(entry.declaration, path, next);
        if (result) return result;
      }
    }
    return undefined;
  }
  return resolve;
}
