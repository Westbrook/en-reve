import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setupEnvironment, setupEnvironmentInputs } from '../evidence/setup-environment.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { typeDependencyIdentity, revalidateTypeDependencyIdentity } from './type-dependencies.ts';
import { generateTypeSnapshot, type TypeSnapshot } from './type-snapshot.ts';
import { canonicalJson, digestJson } from '../evidence/identity.ts';
import { contentInventory, inventoryDigest, immutable, atomicJSON } from '../evidence/setup.mjs';
import { immutableSetup } from '../evidence/immutable-setup.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const packageRoot = resolve(root, 'packages/elements');
const excluded = (name: string) => /^apps(?:\/|$)/.test(name) || /^packages\/(?!elements(?:\/|$)|tokens(?:\/|$)|primitives(?:\/|$)|styles(?:\/|$))/.test(name) || /(^|\/)(\.cache|\.vite|\.vite-temp|artifacts|results|test-results|playwright-report)(\/|$)/.test(name) || name.endsWith('.tsbuildinfo') || /^packages\/elements\/(public-types\.json|public-api\.json|custom-elements\.json(?:\.receipt\.json)?)$/.test(name);
/** Full repository/compiler bytes are verified; arbitrary fixture roots retain uncached extraction. */
export async function preparedTypeSnapshot(directory: string): Promise<TypeSnapshot> {
  directory = resolve(directory);
  if (directory !== packageRoot || process.env.EN_SETUP_CACHE === 'off') return generateTypeSnapshot(directory);
  const compilerEnvironment = () => setupEnvironment();
  let freshSnapshot: TypeSnapshot | undefined;
  async function captureSnapshot() {
    const { stdout } = await promisify(execFile)(process.execPath, [resolve(root,'tooling/metadata/type-snapshot-producer.ts'),directory], {cwd:process.cwd(),env:compilerEnvironment(),maxBuffer:64*1024*1024});
    return JSON.parse(stdout);
  }
  const identity = async () => {
    const base = {environment: inventoryDigest(Object.fromEntries(Object.entries(setupEnvironmentInputs(compilerEnvironment())).filter(([key]) => !key.startsWith('npm_') && !['SHLVL','_','PWD','OLDPWD','INIT_CWD'].includes(key)))), cwd: process.cwd(), files: await contentInventory(root, ['packages/elements','packages/tokens','packages/primitives','packages/styles','tooling','node_modules','package.json','package-lock.json','tsconfig.base.json',process.execPath], excluded), node:process.version, platform:process.platform, arch:process.arch};
    const baseDigest = inventoryDigest(base), traceFile = resolve(root,'node_modules/.cache/type-snapshots',`trace-${baseDigest.slice(7)}.json`);
    let compiler: ReturnType<typeof typeDependencyIdentity> | undefined;
    try {
      const { integrity, ...saved } = JSON.parse(await readFile(traceFile,'utf8'));
      if (saved.baseDigest === baseDigest && integrity === inventoryDigest(saved) && revalidateTypeDependencyIdentity(saved.compiler)) compiler = saved.compiler;
    } catch (error) { if ((error as NodeJS.ErrnoException).code && (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    if (!compiler) {
      const captured = await captureSnapshot();
      compiler = captured.compiler;
      freshSnapshot = captured.result;
      if (!compiler || !revalidateTypeDependencyIdentity(compiler)) throw new Error('Compiler inputs changed before publishing dependency trace');
      const saved = { baseDigest, compiler };
      await atomicJSON(traceFile, {...saved,integrity:inventoryDigest(saved)});
    }
    return {...base,compiler};
  };
  const started = performance.now(), inputs = await identity();
  const prepared = await immutableSetup({cache:resolve(root,'node_modules/.cache/type-snapshots'),inputs,verifyInputs:identity,produce:async output => {
    if (!freshSnapshot) {
      const captured = await captureSnapshot();
      if (inventoryDigest(captured.compiler) !== inventoryDigest(inputs.compiler) || !revalidateTypeDependencyIdentity(captured.compiler)) throw new Error('Compiler input queries changed while repairing the prepared snapshot');
      freshSnapshot = captured.result;
    }
    const snapshot = freshSnapshot!;
    if (snapshot.gaps.length) throw new Error(`Type snapshot has unresolved contracts:\n${snapshot.gaps.join('\n')}`);
    await writeFile(join(output,'snapshot.json'),JSON.stringify(snapshot));
  }});
  console.error(`Type snapshot: ${prepared.reused ? 'verified reuse' : 'produced'} (${Math.round(performance.now()-started)}ms); producer ${prepared.originatingProducer}`);
  return immutable(JSON.parse(await readFile(join(prepared.directory,'snapshot.json'),'utf8')));
}
export async function verifyTypeSnapshot(directory: string) {
  const retained = JSON.parse(await readFile(join(directory,'public-types.json'),'utf8'));
  const current = await preparedTypeSnapshot(directory);
  if(current.gaps.length || canonicalJson(retained)!==canonicalJson(current)) throw new Error('Stale or incomplete public-types.json. Run npm run metadata:types.');
  return {snapshot:current,digest:digestJson(current)};
}
export async function writeTypeSnapshot(directory: string) {
  const snapshot = await preparedTypeSnapshot(directory);
  if(snapshot.gaps.length) throw new Error(`Type snapshot has unresolved contracts:\n${snapshot.gaps.join('\n')}`);
  const file=join(directory,'public-types.json'),text=JSON.stringify(snapshot,null,2)+'\n';
  if(await readFile(file,'utf8').catch(()=>null)!==text) {
    await mkdir(dirname(file),{recursive:true});const temp=`${file}.${randomUUID()}.tmp`;await writeFile(temp,text);await rename(temp,file);
  }
  return snapshot;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  await (process.argv.includes('--check') ? verifyTypeSnapshot(packageRoot) : writeTypeSnapshot(packageRoot));
  console.log('Public TypeScript snapshot verified.');
}
