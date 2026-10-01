import {ts, compilerIdentity} from './compiler-api.mjs';
import { join, resolve } from 'node:path';
import { digestJson, digestBytes } from '../evidence/identity.ts';
const methods = ['readFile', 'fileExists', 'directoryExists', 'getDirectories', 'readDirectory', 'realpath'];
const encodedArgs = (args: any[]) => JSON.stringify(args, (_key, value) => value === undefined ? { __undefined: true } : value);
const observation = (method: string, value: any) => method === 'readFile' && typeof value === 'string' ? digestBytes(value) : digestJson(value === undefined ? null : value);

/** Re-resolve the compiler's inputs before reuse, including external configs and failed lookup probes. */
export function typeDependencyIdentity(packageRoot: string) {
  const compiler = compilerIdentity();
  const observations: Record<string, string> = {};
  const originals = new Map<string, (...args: any[]) => any>();
  // This phase is synchronous. Restore the shared compiler host before yielding to another consumer.
  for (const name of methods) {
    const original = ts.sys[name];
    if (typeof original !== 'function') continue;
    originals.set(name, original);
    ts.sys[name] = (...args: any[]) => {
      const value = original.apply(ts.sys, args);
      const key = name + ':' + encodedArgs(args);
      observations[key] = observation(name, value);
      return value;
    };
  }
  try {
    packageRoot = resolve(packageRoot);
    const config = ts.readConfigFile(join(packageRoot, 'tsconfig.json'), ts.sys.readFile);
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot);
    const options = { ...parsed.options, composite: false, incremental: false, declaration: true, emitDeclarationOnly: true, declarationMap: false, noEmit: false };
    const program = ts.createProgram(parsed.fileNames, options);
    const diagnostics = [...parsed.errors, ...program.getOptionsDiagnostics(), ...program.getSyntacticDiagnostics()];
    if (diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (file: string) => file, getCurrentDirectory: () => packageRoot, getNewLine: () => '\n',
    }));
    if (digestJson(compiler) !== digestJson(compilerIdentity())) throw new Error('Compiler changed during dependency collection');
    return { schemaVersion: 2, compiler, files: [...program.getSourceFiles()].map((file: any) => resolve(file.fileName)).sort(), observations };
  } finally {
    for (const [name, original] of originals) ts.sys[name] = original;
  }
}

/** Replay the complete observed filesystem query set without constructing another compiler program.
 * Failed lookups and directory listings detect additions/deletions that may change resolution.
 * A changed query requires fresh resolution, never reuse of the old dependency list.
 */
export function revalidateTypeDependencyIdentity(trace: ReturnType<typeof typeDependencyIdentity>): boolean {
  if (trace?.schemaVersion !== 2 || !Array.isArray(trace.files) || !trace.files.length || !trace.observations || !Object.keys(trace.observations).length) return false;
  try {
    if (digestJson(trace.compiler) !== digestJson(compilerIdentity())) return false;
    for (const [query, expected] of Object.entries(trace.observations)) {
      const boundary = query.indexOf(':'), method = query.slice(0, boundary);
      if (!methods.includes(method) || typeof ts.sys[method] !== 'function') return false;
      const decode = (value: any): any => Array.isArray(value) ? value.map(decode) : value && typeof value === 'object' && value.__undefined === true && Object.keys(value).length === 1 ? undefined : value;
      const args = decode(JSON.parse(query.slice(boundary + 1)));
      if (!Array.isArray(args) || typeof args[0] !== 'string') return false;
      if (observation(method, ts.sys[method](...args)) !== expected) return false;
    }
    return true;
  } catch { return false; }
}

let captureActive = false;
/** Run only in an isolated producer process: captures both declaration programs and late emit queries. */
export async function captureTypeDependencyQueries<T>(producer: () => Promise<T>) {
  if (captureActive) throw new Error('Overlapping compiler dependency capture');
  const identity = compilerIdentity();
  captureActive = true;
  const observations: Record<string, string> = {}, files = new Set<string>();
  const originals = new Map<string, (...args: any[]) => any>();
  try {
    for (const name of methods) {
      const original = ts.sys[name];
      if (typeof original !== 'function') continue;
      originals.set(name, original);
      ts.sys[name] = (...args: any[]) => {
        const value = original.apply(ts.sys, args);
        const key = name + ':' + encodedArgs(args), digest = observation(name, value);
        if (observations[key] && observations[key] !== digest) throw new Error('Compiler input changed during snapshot generation: ' + args[0]);
        observations[key] = digest;
        if (name === 'readFile' && typeof value === 'string') files.add(resolve(args[0]));
        return value;
      };
    }
    const result = await producer();
    if (digestJson(identity) !== digestJson(compilerIdentity())) throw new Error('Compiler changed during snapshot generation');
    return { result, compiler: { schemaVersion: 2, compiler: identity, files: [...files].sort(), observations } };
  } finally {
    for (const [name, original] of originals) ts.sys[name] = original;
    captureActive = false;
  }
}
