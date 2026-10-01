import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, mkdtemp, readdir, symlink, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, process.env.EN_LAZY_DELIVERY_OUT ?? 'artifacts/lazy-delivery/packed');
await mkdir(dirname(out), {recursive: true});
await mkdir(out); // Every outer run owns a fresh directory; retain failed attempts.
const stage = await mkdtemp(resolve(tmpdir(), 'en-delivery-packed-'));
const archives = await preparedPackages(['elements', 'primitives', 'styles', 'tokens', 'ssr'], stage);
for (const archive of archives) {
  const destination = resolve(stage, 'node_modules', archive.name);
  await mkdir(destination, {recursive: true});
  execFileSync('tar', ['-xzf', resolve(stage, archive.filename), '-C', destination, '--strip-components=1']);
}
for (const name of await readdir(resolve(root, 'node_modules'))) if (name !== '@en-reve' && !name.startsWith('.')) await symlink(resolve(root, 'node_modules', name), resolve(stage, 'node_modules', name));
await writeFile(resolve(stage, 'package.json'), JSON.stringify({type: 'module'}));
for (const name of ['consumer.types.ts', 'contract.test.mjs', 'fixture.ts', 'inert.ts', 'selective.ts', 'full.ts', 'eager.ts', 'shell.ts', 'ssr-module.ts', 'ssr-boot.ts', 'ssr-render.mjs']) await cp(resolve(import.meta.dirname, name), resolve(stage, name));
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--strict', '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--skipLibCheck', 'consumer.types.ts'], {cwd: stage, stdio: 'inherit'});
execFileSync(process.execPath, ['--test', '--test-reporter=tap', 'contract.test.mjs'], {cwd: stage, stdio: 'inherit'});
const graphs = {};
const common = {absWorkingDir: stage, bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, metafile: true, chunkNames: 'chunks/[name]-[hash]'};
function inspect(name, metafile, entry) {
  const inputs = Object.keys(metafile.inputs);
  const local = inputs.filter(input => input.includes('@en-reve/'));
  if (!local.length) throw Error(`${name}: no packed library inputs`);
  if (local.some(input => !resolve(stage, input).startsWith(resolve(stage, 'node_modules/@en-reve') + '/'))) throw Error(`${name}: workspace alias escaped the packed package stage`);
  if (inputs.some(input => /\/packages\/(elements|primitives|styles|tokens|ssr)\/(src|dist)\//.test(input))) throw Error(`${name}: workspace library input`);
  const entryFile = Object.keys(metafile.outputs).find(file => metafile.outputs[file].entryPoint === entry);
  if (!entryFile) throw Error(`${name}: missing bundle entry`);
  const visited = new Set();
  const visit = file => {if (visited.has(file)) return; visited.add(file); for (const imported of metafile.outputs[file].imports) if (!imported.external && imported.kind !== 'dynamic-import') visit(imported.path);};
  visit(entryFile);
  return {entry: relative(out, resolve(stage, entryFile)), startup: {files: [...visited].map(file => relative(out, resolve(stage, file))), bytes: [...visited].reduce((sum, file) => sum + metafile.outputs[file].bytes, 0), inputs: [...new Set([...visited].flatMap(file => Object.keys(metafile.outputs[file].inputs)))]}, inputs};
}
for (const name of ['inert', 'selective', 'full', 'eager', 'shell']) {
  const result = await build({...common, entryPoints: [`${name}.ts`], outdir: resolve(out, name)});
  graphs[name] = inspect(name, result.metafile, `${name}.ts`);
  await writeFile(resolve(out, `${name}-metafile.json`), JSON.stringify(result.metafile, null, 2) + '\n');
}
const componentInput = input => /@en-reve\/elements\/dist\/(?:definitions\/|date-picker(?:\/|\.js)|calendar(?:\/|\.js)|button(?:\/|\.js)|dialog(?:\/|\.js))/.test(input);
for (const name of ['inert', 'selective', 'full']) if (graphs[name].startup.inputs.some(componentInput)) throw Error(`${name}: profile/discovery import evaluated component code`);
if (graphs.inert.inputs.some(input => /lazy-manifest|delivery-profiles|delivery-date-picker/.test(input))) throw Error('Inert discovery unexpectedly includes executable profile bindings');
if (graphs.selective.inputs.some(input => /(?:lazy-manifest|delivery-catalog|delivery-profiles)\.js$/.test(input))) throw Error('Selective entry reached the full catalog or manifest');
const calendarInput = input => /@en-reve\/elements\/dist\/(?:definitions\/calendar\.js|calendar\/)/.test(input);
if (graphs.shell.startup.inputs.some(calendarInput)) throw Error('Shell static import includes calendar code');
if (!graphs.eager.startup.inputs.some(calendarInput)) throw Error('Canonical eager import omitted calendar code');
const browser = await build({...common, entryPoints: ['fixture.ts', 'ssr-boot.ts'], outdir: out});
inspect('fixture', browser.metafile, 'fixture.ts');
inspect('ssr-boot', browser.metafile, 'ssr-boot.ts');
await writeFile(resolve(out, 'metafile.json'), JSON.stringify(browser.metafile, null, 2) + '\n');
await build({absWorkingDir: stage, entryPoints: ['ssr-module.ts'], outfile: resolve(stage, 'ssr-module.mjs'), bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022'});
execFileSync(process.execPath, ['ssr-render.mjs', out], {cwd: stage, stdio: 'inherit'});
await writeFile(resolve(out, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packed delivery contracts</title></head><body><h1>Packed delivery contracts</h1><form><label>Essential draft<input name="draft" value="Preserved draft" required></label><button>Native save</button></form><main id="islands"></main><script type="module" src="./fixture.js"></script></body></html>');
const assets = {};
async function hashDirectory(directory) {for (const entry of await readdir(directory, {withFileTypes: true})) {const path = resolve(directory, entry.name); if (entry.isDirectory()) await hashDirectory(path); else {const bytes = await readFile(path); assets[relative(out, path)] = {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};}}}
await hashDirectory(out);
await writeFile(resolve(out, 'receipt.json'), JSON.stringify({schemaVersion: 1, kind: 'packed-correctness', packages: archives.map(({name, integrity, shasum, setup}) => ({name, integrity, shasum, setup})), graphs, assets, note: 'Correctness and production import graph evidence only. No timing, retained-heap or consumer benefit claim.'}, null, 2) + '\n');
console.log(JSON.stringify({out, entries: Object.keys(graphs), assets: Object.keys(assets).length}));
