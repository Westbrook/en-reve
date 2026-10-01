import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

const names = ['tokens', 'styles', 'primitives', 'elements', 'ssr'];
const inside = (root, path) => { const name = relative(root, path); return name === '' || (name !== '..' && !name.startsWith('..' + sep) && !isAbsolute(name)); };
const hash = value => createHash('sha256').update(value).digest('hex');

export async function packedBuild(build, options, context) {
  // The existing SSR renderer uses this direct build-output import. Resolve it
  // through the same public export and normal Vite package metadata as consumers.
  const directEntries = new Map([[resolve(context.sourceRoot, 'packages/ssr/dist/index.js'), '@en-reve/ssr']]);
  const phase = options.build?.ssr ? 'server' : 'client';
  const plugin = {
    name: 'en-reve-packed-production-aliases-and-evidence', enforce: 'pre',
    async resolveId(id, importer, resolveOptions) {
      const at = id.search(/[?#]/), clean = at < 0 ? id : id.slice(0, at), suffix = at < 0 ? '' : id.slice(at);
      let specifier = clean.startsWith('@en-reve/') ? id : null;
      if (clean.startsWith('.') || isAbsolute(clean)) {
        const path = isAbsolute(clean) ? clean : importer && resolve(dirname(importer.split(/[?#]/)[0]), clean);
        if (path) for (const name of names) {
          const sourceDist = resolve(context.sourceRoot, 'packages', name, 'dist');
          if (inside(sourceDist, path)) {
            if (!directEntries.has(path)) throw new Error('Undeclared direct workspace build-output import: ' + path);
            specifier = directEntries.get(path) + suffix;
          }
        }
      }
      if (!specifier) return null;
      const name = /^@en-reve\/([^/?#]+)/.exec(specifier)?.[1];
      if (!names.includes(name)) throw new Error('Unpacked production package: ' + specifier);
      const result = await this.resolve(specifier, importer, { ...resolveOptions, skipSelf: true });
      if (!result || result.external || !isAbsolute(result.id)) throw new Error('Production package failed normal bundled resolution: ' + specifier);
      const actual = await realpath(result.id.split(/[?#]/)[0]);
      if (!inside(resolve(context.packedRoot, name), actual)) throw new Error('Production package escaped its archive: ' + specifier + ' -> ' + actual);
      // Keep Vite's conditions, sideEffects and package metadata intact. The
      // tarball extraction occupies the ordinary isolated node_modules path.
      return result;
    },
    // writeBundle observes Vite's final HTML/CSS chunk removal and rewritten imports.
    async writeBundle(_, bundle) {
      const modules = [], externals = [];
      const emittedImports = new Set(Object.values(bundle).filter(chunk => chunk.type === 'chunk').flatMap(chunk => [...chunk.imports, ...chunk.dynamicImports]));
      for (const id of this.getModuleIds()) {
        // Rolldown can list unused synthetic node:module. Only emitted builtin
        // edges count as external dependencies; preserve ignored virtual modules.
        if (id.startsWith('\0') || id.startsWith('vite:') || id.startsWith('node:') && !emittedImports.has(id)) continue;
        const info = this.getModuleInfo(id);
        // Pinned Rolldown has no ModuleInfo.isExternal. A missing body is only
        // a candidate: normal resolution must independently confirm this exact ID.
        if (info?.code === null) {
          const resolved = await this.resolve(id, info.importers[0] ?? info.dynamicImporters[0], { skipSelf: true });
          if (resolved?.external === true || resolved?.external === 'absolute') {
            if (resolved.id !== id) throw new Error('External production module changed identity: ' + id + ' -> ' + resolved.id);
            externals.push(id); continue;
          }
        }
        const path = id.replace(/^\/@fs\//, '/').split(/[?#]/)[0];
        if (!isAbsolute(path)) throw new Error('Unidentified production module: ' + id);
        const actual = await realpath(path);
        const packed = inside(context.packedRoot, actual);
        const ownSource = ['apps/docs', 'tooling'].some(directory => inside(resolve(context.sourceRoot, directory), actual)) || (context.additionalSourceRoots ?? []).some(root => inside(root, actual));
        const dependency = inside(context.dependencyRoot, actual) && !inside(resolve(context.dependencyRoot, '@en-reve'), actual);
        if (!packed && !ownSource && !dependency) throw new Error('Production bundle imported outside packed/source/exact-lock roots: ' + actual);
        modules.push({ id, path: actual, ownership: packed ? 'packed-library' : dependency ? 'exact-lock-dependency' : 'docs-source', imports: info?.importedIds ?? [], dynamicImports: info?.dynamicallyImportedIds ?? [], sha256: hash(await readFile(actual)) });
      }
      if (!modules.some(module => module.ownership === 'packed-library')) throw new Error('Production build has no packed library inputs');
      if (phase === 'client' && externals.length) throw new Error('Client build leaves unbound external inputs: ' + externals.join(', '));
      if (externals.some(id => id.startsWith('@en-reve/') || isAbsolute(id) && inside(context.packedRoot, id))) throw new Error('SSR externalized the packed library closure');
      const chunks = Object.values(bundle).filter(value => value.type === 'chunk').map(value => ({ fileName: value.fileName, isEntry: value.isEntry, facadeModuleId: value.facadeModuleId, imports: value.imports, dynamicImports: value.dynamicImports, moduleIds: Object.keys(value.modules) }));
      await mkdir(context.evidenceDirectory, { recursive: true });
      await writeFile(resolve(context.evidenceDirectory, phase + '-graph.json'), JSON.stringify({ schemaVersion: 1, phase, modules, externals, chunks }, null, 2) + '\n');
    },
  };
  return build({ ...options, plugins: [...(options.plugins ?? []), plugin], resolve: { ...options.resolve, preserveSymlinks: false }, build: { ...options.build, manifest: phase === 'client' } });
}
