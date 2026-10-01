import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, mkdtemp, readdir, symlink, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, process.env.EN_LAZY_DELIVERY_PAGINATION_OUT ?? 'artifacts/lazy-delivery-pagination/packed');
// This must fail on an existing outer-run directory, including an empty one.
await mkdir(dirname(out), {recursive: true}); await mkdir(out);
const stage = await mkdtemp(resolve(tmpdir(), 'en-delivery-pagination-packed-'));
const archives = await preparedPackages(['elements', 'primitives', 'styles', 'tokens', 'ssr'], stage);
const archiveReceipts = [];
for (const archive of archives) {
  const file = resolve(stage, archive.filename), bytes = await readFile(file);
  archiveReceipts.push({name: archive.name, filename: archive.filename, integrity: archive.integrity, shasum: archive.shasum, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), setup: archive.setup});
  const destination = resolve(stage, 'node_modules', archive.name); await mkdir(destination, {recursive: true});
  execFileSync('tar', ['-xzf', file, '-C', destination, '--strip-components=1']);
}
for (const name of await readdir(resolve(root, 'node_modules'))) if (name !== '@en-reve' && !name.startsWith('.')) await symlink(resolve(root, 'node_modules', name), resolve(stage, 'node_modules', name));
await writeFile(resolve(stage, 'package.json'), JSON.stringify({type: 'module'}));
for (const name of ['consumer.types.ts', 'fixture.ts', 'ssr-module.ts', 'ssr-boot.ts', 'ssr-render.mjs']) await cp(resolve(import.meta.dirname, name), resolve(stage, name));
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--strict', '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--skipLibCheck', 'consumer.types.ts'], {cwd: stage, stdio: 'inherit'});
const browserOptions = {absWorkingDir: stage, bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, metafile: true, chunkNames: 'chunks/[name]-[hash]'};
const browser = await build({...browserOptions, entryPoints: ['fixture.ts'], outdir: resolve(out, 'csr')});
const hydration = await build({...browserOptions, entryPoints: ['ssr-boot.ts'], outdir: out});
const initial = new Set();
const visit = file => {if (initial.has(file)) return; initial.add(file); for (const imported of hydration.metafile.outputs[file].imports) if (!imported.external && imported.kind !== 'dynamic-import') visit(imported.path);};
const hydrationEntry = Object.keys(hydration.metafile.outputs).find(file => hydration.metafile.outputs[file].entryPoint === 'ssr-boot.ts');
if (!hydrationEntry) throw Error('Missing SSR bootstrap entry');
visit(hydrationEntry);
const initialInputs = [...new Set([...initial].flatMap(file => Object.keys(hydration.metafile.outputs[file].inputs)))];
if (initialInputs.some(input => /(?:lit-element|@en-reve\/elements\/dist\/pagination(?:\/|\.js))/.test(input))) throw Error('SSR bootstrap evaluated pagination before hydration support');
const inputs = [...new Set([...Object.keys(browser.metafile.inputs), ...Object.keys(hydration.metafile.inputs)])];
const libraryInputs = inputs.filter(input => input.includes('@en-reve/'));
if (!libraryInputs.length || libraryInputs.some(input => !resolve(stage, input).startsWith(resolve(stage, 'node_modules/@en-reve') + '/'))) throw Error('Pagination fixture must use extracted public library packages, never workspace aliases');
if (inputs.some(input => /\/packages\/(elements|primitives|styles|tokens|ssr)\/(src|dist)\//.test(input))) throw Error('Workspace library input escaped the packed stage');
if (!inputs.some(input => /@en-reve\/elements\/dist\/pagination\/element\.js$/.test(input))) throw Error('Fixture omitted the production pagination implementation');
await writeFile(resolve(out, 'metafile.json'), JSON.stringify(browser.metafile, null, 2) + '\n');
await writeFile(resolve(out, 'ssr-metafile.json'), JSON.stringify(hydration.metafile, null, 2) + '\n');
await build({absWorkingDir: stage, entryPoints: ['ssr-module.ts'], outfile: resolve(stage, 'ssr-module.mjs'), bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022'});
execFileSync(process.execPath, ['ssr-render.mjs', out], {cwd: stage, stdio: 'inherit'});
const stageRequire = createRequire(resolve(stage, 'package.json'));
await cp(stageRequire.resolve('@en-reve/tokens/default.css'), resolve(out, 'tokens.css'));
await writeFile(resolve(out, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packed pagination construction</title><link rel="stylesheet" href="./tokens.css"><style>body{font-family:system-ui;margin:24px}#pagers{display:grid;gap:120px;max-width:760px}section{display:block;min-width:0}en-pagination{display:block;margin-block:24px}iframe{display:block;width:820px;height:700px}</style></head><body><h1>Packed pagination construction</h1><label>Essential search<input id="essential" value="Native fallback"></label><main id="pagers"></main><script type="module" src="./csr/fixture.js"></script></body></html>');
const assets = {};
async function hashDirectory(directory) {for (const entry of await readdir(directory, {withFileTypes: true})) {const path = resolve(directory, entry.name); if (entry.isDirectory()) await hashDirectory(path); else {const bytes = await readFile(path); assets[relative(out, path)] = {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};}}}
await hashDirectory(out);
await writeFile(resolve(out, 'receipt.json'), JSON.stringify({schemaVersion: 1, kind: 'packed-pagination-correctness', packages: archiveReceipts, inputs, ssrInitialInputs: initialInputs, assets, limits: ['Correctness only; not performance or retention evidence.', 'Pagination defers native chooser construction only; there is no optional code split or generated custom-element registration.', 'Auto scope records real native support or global fallback in each engine.', 'No-JavaScript semantics and consumer fallback navigation do not claim a functional component chooser.']}, null, 2) + '\n');
console.log(JSON.stringify({out, assets: Object.keys(assets).length}));

