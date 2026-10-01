import {preparedPackages} from '../../tooling/evidence/packed-setup.mjs';
import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, mkdtemp, readdir, symlink, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, process.env.EN_LAZY_DELIVERY_EDITOR_OUT ?? 'artifacts/lazy-delivery-editor/packed');
await mkdir(dirname(out), {recursive: true}); await mkdir(out);
const stage = await mkdtemp(resolve(tmpdir(), 'en-delivery-editor-packed-'));
const archives = await preparedPackages(['elements', 'primitives', 'styles', 'tokens', 'ssr'], stage);
for (const archive of archives) {
  const destination = resolve(stage, 'node_modules', archive.name); await mkdir(destination, {recursive: true});
  execFileSync('tar', ['-xzf', resolve(stage, archive.filename), '-C', destination, '--strip-components=1']);
}
for (const name of await readdir(resolve(root, 'node_modules'))) if (name !== '@en-reve' && !name.startsWith('.')) await symlink(resolve(root, 'node_modules', name), resolve(stage, 'node_modules', name));
await writeFile(resolve(stage, 'package.json'), JSON.stringify({type: 'module'}));
for (const name of ['consumer.types.ts', 'fixture.ts', 'ssr-editor-module.ts', 'ssr-toolbar-module.ts', 'ssr-boot.ts', 'ssr-render.mjs']) await cp(resolve(import.meta.dirname, name), resolve(stage, name));
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--strict', '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--skipLibCheck', 'consumer.types.ts'], {cwd: stage, stdio: 'inherit'});
const browserOptions = {absWorkingDir: stage, bundle: true, splitting: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, metafile: true, chunkNames: 'chunks/[name]-[hash]'};
// Keep CSR's static component imports out of SSR's ordered hydration bootstrap.
const browser = await build({...browserOptions, entryPoints: ['fixture.ts'], outdir: resolve(out, 'csr')});
const hydration = await build({...browserOptions, entryPoints: ['ssr-boot.ts'], outdir: out});
const initial = new Set();
const visit = file => {if (initial.has(file)) return; initial.add(file); for (const imported of hydration.metafile.outputs[file].imports) if (!imported.external && imported.kind !== 'dynamic-import') visit(imported.path);};
const hydrationEntry = Object.keys(hydration.metafile.outputs).find(file => hydration.metafile.outputs[file].entryPoint === 'ssr-boot.ts');
if (!hydrationEntry) throw Error('Missing SSR bootstrap entry');
visit(hydrationEntry);
const initialInputs = [...new Set([...initial].flatMap(file => Object.keys(hydration.metafile.outputs[file].inputs)))];
if (initialInputs.some(input => /(?:lit-element|@en-reve\/elements\/dist\/(?:rich-text-editor|editor-toolbar)(?:\/|\.js))/.test(input))) throw Error('SSR bootstrap evaluated component code before hydration support');
const inputs = [...new Set([...Object.keys(browser.metafile.inputs), ...Object.keys(hydration.metafile.inputs)])];
const libraryInputs = inputs.filter(input => input.includes('@en-reve/'));
if (!libraryInputs.length || libraryInputs.some(input => !resolve(stage, input).startsWith(resolve(stage, 'node_modules/@en-reve') + '/'))) throw Error('Editor fixture must use extracted public library packages, never workspace aliases');
if (inputs.some(input => /\/packages\/(elements|primitives|styles|tokens|ssr)\/(src|dist)\//.test(input))) throw Error('Workspace library input escaped the packed stage');
if (!inputs.some(input => /prosemirror-view/.test(input))) throw Error('Fixture omitted the production rich editor backend');
await writeFile(resolve(out, 'metafile.json'), JSON.stringify(browser.metafile, null, 2) + '\n');
await writeFile(resolve(out, 'ssr-metafile.json'), JSON.stringify(hydration.metafile, null, 2) + '\n');
for (const name of ['ssr-editor-module', 'ssr-toolbar-module']) await build({absWorkingDir: stage, entryPoints: [`${name}.ts`], outfile: resolve(stage, `${name}.mjs`), bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022'});
execFileSync(process.execPath, ['ssr-render.mjs', out], {cwd: stage, stdio: 'inherit'});
await writeFile(resolve(out, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packed editor delivery</title><style>body{font-family:system-ui;margin:24px}#editors{display:grid;gap:120px;max-width:580px}section{display:block;min-width:0}iframe{display:block;width:700px;height:600px}</style></head><body><h1>Packed editor delivery</h1><label>Essential draft<input id="essential" value="Native fallback"></label><main id="editors"></main><script type="module" src="./csr/fixture.js"></script></body></html>');
const assets = {};
async function hashDirectory(directory) {for (const entry of await readdir(directory, {withFileTypes: true})) {const path = resolve(directory, entry.name); if (entry.isDirectory()) await hashDirectory(path); else {const bytes = await readFile(path); assets[relative(out, path)] = {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};}}}
await hashDirectory(out);
await writeFile(resolve(out, 'receipt.json'), JSON.stringify({schemaVersion: 1, kind: 'packed-editor-correctness', packages: archives.map(({name, integrity, shasum, setup}) => ({name, integrity, shasum, setup})), inputs, ssrInitialInputs: initialInputs, assets, limits: ['Correctness only; not performance or retention evidence.', 'Synthetic composition verifies guards, not physical IME.', 'Essential editor hydration may replace readonly SSR control; toolbar must not remount the live editor.']}, null, 2) + '\n');
console.log(JSON.stringify({out, assets: Object.keys(assets).length}));
