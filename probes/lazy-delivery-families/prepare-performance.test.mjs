import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import test from 'node:test';
import { parse } from 'parse5';
import { acceptedReferenceHead, activeFamilies, assertActiveFamilies, assertSourceSubjects, applyRoutePolicies, historicalRouteSubjects, policyOverlay, routeEntryAssets, routeSubjects } from './route-build-contract.mjs';
import { packedBuild } from './packed-vite-build.mjs';

const target = { id: 'media', tag: 'en-media-viewer', identity: ['id', 'viewer'] };

test('only the exact authored route target changes before rendering', () => {
  const source = '<en-media-viewer data-id="viewer"></en-media-viewer><en-media-viewer-other id="viewer"></en-media-viewer-other><en-media-viewer id="viewer" .items=${media}></en-media-viewer>';
  const deferred = policyOverlay(source, target, 'on-demand');
  assert.equal(deferred.source, source.replace('<en-media-viewer id="viewer"', '<en-media-viewer content-rendering="on-demand" id="viewer"'));
  const rollback = policyOverlay(deferred.source, target, 'eager');
  assert.equal(rollback.source, deferred.source.replace('content-rendering="on-demand"', 'content-rendering="eager"'));
  assert.equal(policyOverlay(source, target, 'eager', { reference: true }).source, source);
  assert.throws(() => policyOverlay('<en-media-viewer data-id="viewer">', target, 'on-demand'), /found 0/);
  assert.throws(() => policyOverlay(source + '<en-media-viewer id="viewer">', target, 'on-demand'), /found 2/);
  assert.throws(() => policyOverlay(deferred.source, target, 'eager', { reference: true }), /already opts in/);
  assert.throws(() => policyOverlay(source, target, 'unexpected'), /Unsupported production route policy/);
  assert.throws(() => policyOverlay('<en-media-viewer id="viewer" content-rendering=${policy}>', target, 'on-demand'), /literal authored attribute/);
  assert.throws(() => policyOverlay('<en-media-viewer id="viewer" .contentRendering=${policy}>', target, 'on-demand'), /literal authored attribute/);
});

test('accepted reference identity and exact source locks cannot be substituted', () => {
  const subject = (head, rootLockSha256 = 'same') => ({ seal: { git: { head, dirty: false, status: '' }, rootLockSha256, performanceLockSha256: 'same-performance' } });
  assert.doesNotThrow(() => assertSourceSubjects({ reference: subject(acceptedReferenceHead), candidate: subject('candidate') }));
  assert.throws(() => assertSourceSubjects({ reference: subject('fba5ec19b58606cf1776df44862a38a3898f4c72'), candidate: subject('candidate') }), /frozen accepted Git commit/, 'retired accepted reference cannot supply a successor acquisition');
  assert.throws(() => assertSourceSubjects({ reference: subject('different-clean-commit'), candidate: subject('candidate') }), /frozen accepted Git commit/);
  assert.throws(() => assertSourceSubjects({ reference: subject(acceptedReferenceHead), candidate: subject('candidate', 'changed') }), /same exact dependency lock/);
  const candidate = subject('candidate'); candidate.seal.git.status = ' M packages/elements/src/media-viewer.ts';
  assert.throws(() => assertSourceSubjects({ reference: subject(acceptedReferenceHead), candidate }), /clean committed source seals/);
  const mismatched = subject('candidate'); mismatched.seal.performanceLockSha256 = 'different';
  assert.throws(() => assertSourceSubjects({ reference: subject(acceptedReferenceHead), candidate: mismatched }), /same exact performance lock/);
});

test('pagination changes six declared targets atomically while both eager controls and adjacent specimens remain untouched', () => {
  const pagination = historicalRouteSubjects.find(subject => subject.id === 'pagination');
  const outside = '<en-pagination id="api-pagination" label="Unrelated fixture"></en-pagination>';
  const before = [
    outside, '// example-start:pagination',
    '<en-pagination id="api-pagination" .page=${this.page} @en-change=${(event) => this.change(event)}></en-pagination>',
    '<en-pagination id="api-pagination-intermediate"></en-pagination>',
    '<en-pagination id="api-pagination-mobile"></en-pagination>',
    '<en-pagination class="pagination-start"></en-pagination>',
    '<en-pagination class="pagination-distributed"></en-pagination>',
    '<en-pagination id="api-pagination-slotted"><en-icon slot="previous"></en-icon></en-pagination>',
    '<en-pagination label="Text slot example pages"><span slot="previous">Previous</span></en-pagination>',
    '<en-pagination id="api-pagination-unknown" .pageCount=${0}></en-pagination>',
    '// example-end:pagination', outside,
  ].join('\n');
  const applied = policyOverlay(before, pagination, 'on-demand');
  assert.equal(applied.targets.length, 6);
  assert.equal(applied.unmodifiedControls.length, 2);
  assert.equal(applied.source.match(/content-rendering="on-demand"/g).length, 6);
  assert.ok(applied.targets[0].before.endsWith('this.change(event)}>'));
  assert.ok(applied.source.startsWith(outside + '\n'));
  assert.ok(applied.source.endsWith('\n' + outside));
  for (const control of applied.unmodifiedControls) {
    assert.equal(control.before, control.after);
    assert.ok(applied.source.includes(control.before));
  }
  const rollback = policyOverlay(applied.source, pagination, 'eager');
  assert.equal(rollback.source.match(/content-rendering="eager"/g).length, 6);
  assert.equal(rollback.source.includes('content-rendering="on-demand"'), false);
  assert.equal(policyOverlay(before, pagination, 'eager', { reference: true }).source, before);
  assert.throws(() => policyOverlay(before.replace('id="api-pagination-slotted"', 'id="api-pagination-slotted" content-rendering="on-demand"'), pagination, 'on-demand'), /already opts in/);
  assert.throws(() => policyOverlay(before, { ...pagination, targets: [...pagination.targets, pagination.targets[0]] }, 'on-demand'), /must be distinct/);
  assert.throws(() => policyOverlay(before.replace('// example-end:pagination', '// absent'), pagination, 'on-demand'), /exact authored source region/);
  assert.throws(() => policyOverlay(before.replace('// example-end:pagination', '<en-pagination id="extra"></en-pagination>\n// example-end:pagination'), pagination, 'on-demand'), /frozen workload/);
});

test('policy attributes after arrow expressions are inspected, and actual route SSR endpoints stay distinct', () => {
  const source = '<en-media-viewer id="viewer" @open=${(event) => handler(event, "content-rendering=ignored")} content-rendering="eager"></en-media-viewer>';
  const applied = policyOverlay(source, target, 'on-demand');
  assert.equal(applied.source, source.replace('content-rendering="eager"', 'content-rendering="on-demand"'));
  const quotedPolicy = '<en-media-viewer id="viewer" .note=${\' content-rendering="eager"\'} content-rendering="eager"></en-media-viewer>';
  assert.equal(policyOverlay(quotedPolicy, target, 'on-demand').source, '<en-media-viewer id="viewer" .note=${\' content-rendering="eager"\'} content-rendering="on-demand"></en-media-viewer>');
  assert.throws(() => policyOverlay(source.replace('content-rendering="eager"', 'content-rendering="eager" .contentRendering=${override}'), target, 'on-demand'), /literal authored attribute/);
  const byId = Object.fromEntries(historicalRouteSubjects.map(subject => [subject.id, subject]));
  assert.deepEqual(byId.command.ssr.args, ['settings']);
  assert.equal(byId.command.ssr.exportName, 'renderWorkflows');
  assert.deepEqual(byId.pagination.ssr.args, ['pagination']);
  assert.equal(byId.pagination.ssr.exportName, 'renderAPIExample');
  assert.deepEqual(byId.combobox.ssr.args, ['selection']);
  assert.equal(byId.media.ssr.supported, false);
});

test('route entry bytes use HTML roots and static emitted imports, excluding dynamic payloads', () => {
  const graph = { chunks: [
    { fileName: 'assets/boot.js', imports: ['assets/shared.js'], dynamicImports: ['assets/optional.js'] },
    { fileName: 'assets/shared.js', imports: ['assets/cycle.js'], dynamicImports: [] },
    { fileName: 'assets/cycle.js', imports: ['assets/shared.js'], dynamicImports: [] },
    { fileName: 'assets/preload.js', imports: [], dynamicImports: [] },
    { fileName: 'assets/optional.js', imports: [], dynamicImports: [] },
  ] };
  const receipt = routeEntryAssets('<link rel="modulepreload" href="../assets/preload.js"><script type="module" src="/assets/boot.js"></script>', '/workflows/selection.html', graph, parse);
  assert.deepEqual(receipt.roots, ['assets/boot.js', 'assets/preload.js']);
  assert.deepEqual(receipt.assets, ['assets/boot.js', 'assets/cycle.js', 'assets/preload.js', 'assets/shared.js']);
  assert.throws(() => routeEntryAssets('<script type="module" src="https://external.invalid/a.js"></script>', '/route.html', graph, parse), /external executable entry/);
  assert.throws(() => routeEntryAssets('<script type="module" src="/absent.js"></script>', '/route.html', graph, parse), /Missing emitted JavaScript chunk/);
  assert.throws(() => routeEntryAssets('<script type="module">import "./hidden.js";</script>', '/route.html', graph, parse), /Inline executable/);
  assert.throws(() => routeEntryAssets('<script>start();</script>', '/route.html', graph, parse), /Inline executable/);
  assert.throws(() => routeEntryAssets('<p>No module entry</p>', '/route.html', graph, parse), /No executable production entry/);
});

test('normal Vite package metadata survives while package and symlink escapes fail', async t => {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'en-family-builder-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const context = { sourceRoot: resolve(directory, 'source'), packedRoot: resolve(directory, 'node_modules/@en-reve'), dependencyRoot: resolve(directory, 'node_modules'), evidenceDirectory: resolve(directory, 'graphs') };
  await mkdir(resolve(context.packedRoot, 'elements/dist'), { recursive: true });
  await mkdir(resolve(context.packedRoot, 'ssr/dist'), { recursive: true });
  const element = resolve(context.packedRoot, 'elements/dist/media-viewer.js'), ssr = resolve(context.packedRoot, 'ssr/dist/index.js'), outside = resolve(directory, 'outside.js');
  for (const file of [element, ssr, outside]) await writeFile(file, 'export {};\n');
  const config = await packedBuild(async config => config, { build: {} }, context), plugin = config.plugins.at(-1);
  const resolved = { id: element + '?raw#fragment', moduleSideEffects: false, meta: { preserved: true }, packageJsonPath: resolve(context.packedRoot, 'elements/package.json') };
  let actualRequest;
  const resolver = { resolve: async (id, importer, options) => { actualRequest = { id, importer, options }; return resolved; } };
  assert.equal(await plugin.resolveId.call(resolver, '@en-reve/elements/media-viewer.js?raw#fragment', '/docs/entry.js', { isEntry: false }), resolved);
  assert.equal(actualRequest.id, '@en-reve/elements/media-viewer.js?raw#fragment');
  assert.equal(actualRequest.options.skipSelf, true);
  assert.equal(actualRequest.options.isEntry, false);
  const ssrResult = { id: ssr, moduleSideEffects: null };
  assert.equal(await plugin.resolveId.call({ resolve: async id => { assert.equal(id, '@en-reve/ssr'); return ssrResult; } }, resolve(context.sourceRoot, 'packages/ssr/dist/index.js'), '/docs/render.ts', {}), ssrResult);
  await assert.rejects(plugin.resolveId.call({ resolve: async () => ({ id: outside }) }, '@en-reve/elements/media-viewer.js'), /escaped its archive/);
  await assert.rejects(plugin.resolveId.call({ resolve: async () => ({ id: element, external: true }) }, '@en-reve/elements/media-viewer.js'), /normal bundled resolution/);
  await assert.rejects(plugin.resolveId.call(resolver, '@en-reve/unpacked/entry.js'), /Unpacked production package/);
  await assert.rejects(plugin.resolveId.call(resolver, resolve(context.sourceRoot, 'packages/elements/dist/private.js')), /Undeclared direct workspace/);
  const escape = resolve(context.packedRoot, 'elements/dist/escape.js'); await symlink(outside, escape);
  await assert.rejects(plugin.resolveId.call({ resolve: async () => ({ id: escape }) }, '@en-reve/elements/escape.js'), /escaped its archive/);
});


test('pinned Vite preserves packed ownership with external SSR Lit and bundled client Lit', async t => {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'en-family-build-externals-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const dependencyRoot = await realpath(resolve(import.meta.dirname, '../../node_modules'));
  const sourceRoot = resolve(directory, 'source'), packedRoot = resolve(directory, 'node_modules/@en-reve');
  const entry = resolve(sourceRoot, 'apps/docs/entry.js'), element = resolve(packedRoot, 'elements/dist/example.js');
  await mkdir(dirname(entry), { recursive: true }); await mkdir(dirname(element), { recursive: true });
  await writeFile(resolve(packedRoot, 'elements/package.json'), JSON.stringify({ name: '@en-reve/elements', type: 'module', exports: { './example.js': './dist/example.js' } }));
  await writeFile(element, "import { ifDefined } from 'lit/directives/if-defined.js'; export const example = value => ifDefined(value);\n");
  await writeFile(entry, "export { example } from '@en-reve/elements/example.js';\n");
  await symlink(resolve(directory, 'node_modules'), resolve(sourceRoot, 'node_modules'), 'dir');
  await symlink(dirname(fileURLToPath(import.meta.resolve('lit'))), resolve(directory, 'node_modules/lit'), 'dir');
  for (const phase of ['server', 'client']) {
    await t.test(phase, async () => {
      const context = { sourceRoot, packedRoot, dependencyRoot, evidenceDirectory: resolve(directory, phase + '-graphs') }, output = resolve(directory, phase + '-output');
      await packedBuild(build, {
        root: sourceRoot, configFile: false, logLevel: 'silent',
        ...(phase === 'server' ? { ssr: { noExternal: [/^@en-reve\//], external: ['lit'] } } : {}),
        build: { ...(phase === 'server' ? { ssr: entry } : { lib: { entry, formats: ['es'] } }), outDir: output, minify: false, rolldownOptions: { output: { entryFileNames: 'entry.mjs' } } },
      }, context);
      const graph = JSON.parse(await readFile(resolve(context.evidenceDirectory, phase + '-graph.json'), 'utf8'));
      assert.deepEqual(graph.externals, phase === 'server' ? ['lit/directives/if-defined.js'] : []);
      assert.ok(graph.modules.some(module => module.path === element && module.ownership === 'packed-library'));
      if (phase === 'server') {
        assert.ok(graph.chunks.some(chunk => chunk.imports.includes('lit/directives/if-defined.js')));
        assert.match(await readFile(resolve(output, 'entry.mjs'), 'utf8'), /from ["']lit\/directives\/if-defined\.js["']/);
      } else assert.ok(graph.modules.some(module => module.ownership === 'exact-lock-dependency' && module.path.includes('/lit/directives/if-defined.js')));
    });
  }
});

test('external evidence cannot turn unresolved IDs or packed modules into permitted SSR dependencies', async t => {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'en-family-external-guards-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const context = { sourceRoot: resolve(directory, 'source'), packedRoot: resolve(directory, 'node_modules/@en-reve'), dependencyRoot: resolve(directory, 'node_modules'), evidenceDirectory: resolve(directory, 'graphs') };
  const element = resolve(context.packedRoot, 'elements/dist/example.js');
  await mkdir(dirname(element), { recursive: true }); await writeFile(element, 'export {};\n');
  const external = 'lit/directives/if-defined.js';
  const cases = [
    { label: 'unresolved missing body', id: external, result: null, error: /Unidentified production module/ },
    { label: 'nonexternal missing body', id: external, result: { id: external, external: false }, error: /Unidentified production module/ },
    { label: 'identity substitution', id: external, result: { id: 'different-package', external: true }, error: /changed identity/ },
    { label: 'client external', id: external, result: { id: external, external: true }, client: true, error: /Client build leaves unbound/ },
    { label: 'packed package external', id: '@en-reve/elements/example.js', result: { id: '@en-reve/elements/example.js', external: true }, error: /externalized the packed library/ },
    { label: 'emitted client builtin', id: 'node:module', result: { id: 'node:module', external: true }, client: true, emitted: true, error: /Client build leaves unbound/ },
    { label: 'absolute packed external', id: resolve(context.packedRoot, 'elements/dist/external.js'), result: { id: resolve(context.packedRoot, 'elements/dist/external.js'), external: 'absolute' }, error: /externalized the packed library/ },
  ];
  await t.test('unused synthetic builtin does not become a client external', async () => {
    const config = await packedBuild(async config => config, { build: {} }, context), plugin = config.plugins.at(-1);
    const api = {
      getModuleIds: () => [element, 'node:module'],
      getModuleInfo: id => { assert.equal(id, element); return { code: 'export {};', importedIds: [], dynamicallyImportedIds: [] }; },
      resolve: async () => assert.fail('The unused builtin must not be resolved or classified as an external'),
    };
    await plugin.writeBundle.call(api, {}, {});
    assert.deepEqual(JSON.parse(await readFile(resolve(context.evidenceDirectory, 'client-graph.json'), 'utf8')).externals, []);
  });
  for (const example of cases) {
    await t.test(example.label, async () => {
      const config = await packedBuild(async config => config, { build: { ssr: !example.client } }, context), plugin = config.plugins.at(-1);
      const api = {
        getModuleIds: () => [element, example.id],
        getModuleInfo: id => ({ id, code: id === element ? 'export {};' : null, importers: id === element ? [] : [element], dynamicImporters: [], importedIds: [], dynamicallyImportedIds: [] }),
        resolve: async (id, importer, options) => { assert.equal(id, example.id); assert.equal(importer, element); assert.equal(options.skipSelf, true); return example.result; },
      };
      const bundle = example.emitted ? { 'entry.js': { type: 'chunk', imports: [example.id], dynamicImports: [] } } : {};
      await assert.rejects(plugin.writeBundle.call(api, {}, bundle), example.error);
    });
  }
});


test('fresh acquisition and policy writes reject retired families before reading any route', async () => {
  assert.deepEqual(activeFamilies, ['combobox', 'command']);
  assert.deepEqual(routeSubjects.map(subject => subject.id), activeFamilies);
  assert.doesNotThrow(() => assertActiveFamilies(['combobox', 'command']));
  assert.doesNotThrow(() => assertActiveFamilies(['command']));
  for (const families of [[], ['media'], ['editor'], ['pagination'], ['command', 'media'], ['combobox', 'combobox'], ['unknown']]) {
    assert.throws(() => assertActiveFamilies(families), /Active acquisition permits only/);
    await assert.rejects(applyRoutePolicies('/must-not-be-read', 'on-demand', { families }), /Active acquisition permits only/);
  }
});

test('fresh family preparation is retired before leases, seal reads or output creation', async t => {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'en-family-retired-preparation-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const entry = fileURLToPath(new URL('./prepare-performance.mjs', import.meta.url));
  const args = [`--reference=${resolve(directory, 'reference')}`, `--candidate=${resolve(directory, 'candidate')}`, `--out=${resolve(directory, 'prepared')}`];
  // Block both exact owner modules in this child, including if their call order
  // changes. A regression must never acquire the live checkout's leases.
  const ownerModules = [
    ['machine-owner.mjs', 'withMachineOwner'],
    ['execution-owner.mjs', 'withExecutionOwner'],
  ].map(([name, exported]) => [
    new URL('../../tooling/testing/' + name, import.meta.url).href,
    `export function ${exported}() { throw new Error('${exported} must not be acquired'); }`,
  ]);
  const loader = 'data:text/javascript,' + encodeURIComponent(`
    import { registerHooks } from 'node:module';
    const sources = new Map(${JSON.stringify(ownerModules)});
    registerHooks({load(url, context, next) {
      const source = sources.get(url);
      return source === undefined ? next(url, context) : {format: 'module', source, shortCircuit: true};
    }});
  `);
  const environment = { ...process.env };
  for (const key of ['EN_TEST_MACHINE_OWNER', 'EN_GATE_MACHINE_OWNER', 'EN_TEST_EXECUTION_OWNER', 'NODE_OPTIONS', 'NODE_PATH', 'ESBUILD_BINARY_PATH']) delete environment[key];
  // The missing parent makes an accidentally reached machine lease fail before
  // checkout ownership can be touched. Never target the user's real lease.
  environment.EN_TEST_MACHINE_LOCK = resolve(directory, 'must-not-exist', 'machine.lock');
  environment.EN_GATE_MACHINE_LOCK = environment.EN_TEST_MACHINE_LOCK;
  for (const [label, invocation] of [
    ['no arguments', []],
    ['ordinary preparation', args],
    ['historical color control flag', [...args, '--color-controls']],
  ]) {
    await t.test(label, async () => {
      const result = spawnSync(process.execPath, ['--import', loader, entry, ...invocation], {
        cwd: directory, env: environment, encoding: 'utf8', timeout: 10_000,
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Fresh family preparation is retired: no route-construction candidates remain/);
      assert.deepEqual(await readdir(directory), [], 'retirement must leave no output, installation or lease directories');
    });
  }
});
