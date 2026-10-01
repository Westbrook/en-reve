import ts from '@typescript/typescript6';
import {createRequire} from 'node:module';
import {readFileSync, realpathSync, readdirSync, lstatSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {createHash} from 'node:crypto';

const require = createRequire(import.meta.url);
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
function distributionDigest(directory) {
  const entries = [];
  function visit(relative) {
    for (const name of readdirSync(join(directory, relative)).sort()) {
      const path = relative + '/' + name, absolute = join(directory, path), info = lstatSync(absolute);
      if (info.isSymbolicLink()) throw new Error('Generator distribution must not contain symlinks: ' + path);
      if (info.isDirectory()) visit(path);
      else if (info.isFile()) entries.push([path, sha(readFileSync(absolute))]);
      else throw new Error('Unsupported generator distribution entry: ' + path);
    }
  }
  visit('dist');
  if (!entries.length) throw new Error('Empty generator distribution');
  return sha(JSON.stringify(entries));
}
const required = ['createProgram', 'createCompilerHost', 'createSourceFile', 'readConfigFile', 'parseJsonConfigFileContent'];
if (!/^6\./.test(ts.version) || !ts.sys || required.some(name => typeof ts[name] !== 'function')) {
  throw new Error('Metadata requires the explicit TypeScript 6 JavaScript API; no root-compiler fallback is supported.');
}

/** One shared API object: dependency tracing and every checker must observe this exact instance. */
export {ts};

export function resolveCompilerPackage(name, from = require) {
  const entry = realpathSync(from.resolve(name));
  let directory = dirname(entry);
  for (;;) {
    const file = join(directory, 'package.json');
    try {
      const bytes = readFileSync(file), metadata = JSON.parse(bytes);
      if (metadata.name === name || (name === '@typescript/old' && metadata.name === 'typescript')) {
        return {entry, packagePath: file, metadata, identity: {
          name: metadata.name, version: metadata.version, packageDigest: sha(bytes), entryDigest: sha(readFileSync(entry)),
          ...(metadata.name.startsWith('@wc-toolkit/cem-generator') ? {distributionDigest: distributionDigest(directory)} : {}),
        }};
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Cannot locate compiler package metadata for ' + name);
    directory = parent;
  }
}

/** Stable across checkout relocation; absolute resolution paths are exposed separately for receipts. */
export function compilerIdentity() {
  const wrapper = resolveCompilerPackage('@typescript/typescript6');
  const effective = resolveCompilerPackage('@typescript/old', createRequire(wrapper.entry));
  if (createRequire(wrapper.entry)('@typescript/old') !== ts || effective.metadata.version !== ts.version) {
    throw new Error('Compiler wrapper and effective TypeScript API disagree.');
  }
  return {version: 1, apiVersion: ts.version, wrapper: wrapper.identity, effective: effective.identity,
    boundaryDigest: sha(readFileSync(new URL(import.meta.url)))};
}

export function compilerResolution() {
  const wrapper = resolveCompilerPackage('@typescript/typescript6');
  const effective = resolveCompilerPackage('@typescript/old', createRequire(wrapper.entry));
  return {identity: compilerIdentity(), wrapperEntry: wrapper.entry, effectiveEntry: effective.entry,
    wrapperPackage: wrapper.packagePath, effectivePackage: effective.packagePath};
}

/** No AST/checker crosses compiler installations even when their version strings happen to match. */
export function assertGeneratorCompilerOwners() {
  const owners = ['@wc-toolkit/cem-generator', '@wc-toolkit/cem-generator-lit', '@wc-toolkit/cem-generator-utils'];
  const core = resolveCompilerPackage('@wc-toolkit/cem-generator'), utils = resolveCompilerPackage('@wc-toolkit/cem-generator-utils');
  return Object.fromEntries(owners.map(name => {
    const owner = resolveCompilerPackage(name), from = createRequire(owner.entry);
    if (from('@typescript/typescript6') !== ts) throw new Error('Separate compiler API instance in ' + name);
    if (name === '@wc-toolkit/cem-generator-lit' && realpathSync(from.resolve('@wc-toolkit/cem-generator')) !== core.entry) throw new Error('Separate generator core in Lit plugin');
    if (name !== '@wc-toolkit/cem-generator-utils' && realpathSync(from.resolve('@wc-toolkit/cem-generator-utils')) !== utils.entry) throw new Error('Separate generator utilities in ' + name);
    return [name, owner.identity];
  }));
}
