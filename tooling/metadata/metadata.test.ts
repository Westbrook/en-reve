import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import {ts} from './compiler-api.mjs';
import { generateCem } from './generate.ts';
import { digestJson } from '../evidence/identity.ts';
import { snapshotCem } from '../releases/cem-diff.ts';
import { discoverElementSources, readCatalogDefinitions, generateElements, verifyGeneratedElements } from './generate-elements.ts';
import { readEventContracts } from './event-contracts.ts';
import { readDefinitionGraph } from './definition-graph.ts';
import { deliveryMetadataOutputs } from './delivery-metadata.ts';
import { deliveryPolicy } from './delivery-policy.ts';

test('the installed WC Toolkit generator extracts actual Lit source without running the custom element', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-cem-test-'));
  try {
    await symlink(fileURLToPath(new URL('../../node_modules', import.meta.url)), join(directory, 'node_modules'), 'dir');
    const packageFile = JSON.stringify({ name: 'sample-only', private: true });
    await writeFile(join(directory, 'package.json'), packageFile);
    await writeFile(join(directory, 'sample.ts'), `
      import { LitElement } from 'lit';
      /**
       * Synthetic analyzer fixture, not an implemented library control.
       * @tag en-sample-metadata
       * @slot - User supplied label
       * @csspart control - Control surface
       * @cssprop --en-sample-color - Foreground color
       */
      export class SampleMetadata extends LitElement {
        static properties = { value: { type: String, reflect: true } };
        value = '';
      }
      customElements.define('en-sample-metadata', SampleMetadata);
    `);
    const { manifest, receipt } = await generateCem({ sourceRoot: directory, sources: ['sample.ts'] });
    const component = snapshotCem(manifest).elements.get('en-sample-metadata')!;
    assert.equal(component.tagName, 'en-sample-metadata');
    assert.equal(component.surfaces.has('attribute:value'), true);
    assert.equal(component.surfaces.has('css-part:control'), true);
    assert.equal(component.surfaces.has('css-property:--en-sample-color'), true);
    assert.equal(receipt.analyzer.name, '@wc-toolkit/cem-generator');
    assert.equal(manifest.schemaVersion, '2.1.0');
    assert.equal(receipt.kind, 'cem-generation');
    assert.equal(receipt.schemaVersion, 2);
    assert.match(receipt.parserVersion, /^6\./);
    assert.deepEqual(receipt.policy.validation, {invariants:'error',exportTypes:'error'});
    assert.equal(receipt.manifestDigest, digestJson(manifest));
    assert.equal(Object.keys(receipt.sources).length, 1);
    assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), packageFile);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('missing, invalid, escaping and empty sources fail instead of fabricating metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-cem-test-'));
  try {
    await assert.rejects(() => generateCem({ sourceRoot: directory, sources: [] }));
    await assert.rejects(() => generateCem({ sourceRoot: directory, sources: ['missing.ts'] }));
    await assert.rejects(() => generateCem({ sourceRoot: directory, sources: ['../escape.ts'] }));
    await writeFile(join(directory, 'broken.ts'), 'export class {');
    await assert.rejects(() => generateCem({ sourceRoot: directory, sources: ['broken.ts'] }));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('inferred import types retain source-relative meaning across relocated source trees', async () => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'en-cem-relocation-')));
  try {
    const results = [];
    for (const name of ['first', 'second']) {
      const root = join(directory, name);
      await mkdir(join(root, 'components'), { recursive: true });
      await mkdir(join(root, 'node_modules/sample-dependency'), { recursive: true });
      await writeFile(join(root, 'node_modules/sample-dependency/package.json'), JSON.stringify({
        name: 'sample-dependency', types: './index.d.ts',
      }));
      await writeFile(join(root, 'node_modules/sample-dependency/index.d.ts'), `
        export interface DependencyValue { name: string }
        export function createDependency(): DependencyValue;
      `);
      await writeFile(join(root, 'model.ts'), `
        export interface Value { count: number }
        export function createValue(): Value { return { count: 1 }; }
      `);
      for (const folder of ['.generated', '..shared']) {
        await mkdir(join(root, 'components', folder), { recursive: true });
        await writeFile(join(root, 'components', folder, 'model.ts'), `
          export interface Value { count: number }
          export function createValue(): Value { return { count: 1 }; }
        `);
      }
      await writeFile(join(root, 'components/sample.ts'), `
        import { createValue } from '../model.js';
        import { createValue as createGenerated } from './.generated/model.js';
        import { createValue as createShared } from './..shared/model.js';
        import { createDependency } from 'sample-dependency';
        /** @fires {CustomEvent<ReturnType<typeof createValue>>} en-change */
        export class Sample {
          get value() { return createValue(); }
          get nested() { return { value: createValue(), values: [createValue()] }; }
          get authored(): import('../model.js').Value { return createValue(); }
          get text() { return 'import("/not-a-module")' as const; }
          get dependency(): import('sample-dependency').DependencyValue { return createDependency(); }
          get generated() { return createGenerated(); }
          get shared() { return createShared(); }
        }
      `);
      const result = {
        ...await generateCem({ sourceRoot: root, sources: ['components/sample.ts', 'model.ts'] }),
        events: await readEventContracts(root, ['components/sample.ts', 'model.ts']),
      };
      results.push(result);
      const sample = result.manifest.modules.find((module: any) => module.path === 'components/sample.ts').declarations[0];
      const targets = new Map([
        ['value', ['model.ts']], ['nested', ['model.ts', 'model.ts']], ['authored', ['model.ts']],
        ['generated', ['components/.generated/model.ts']], ['shared', ['components/..shared/model.ts']],
        ['dependency', ['node_modules/sample-dependency/index.d.ts']],
      ]);
      const verification = join(root, 'components/type-contract.ts');
      await writeFile(verification, [...targets.keys()].map(name => 'type Check_' + name + ' = ' + sample.members.find((member: any) => member.name === name).type.text + ';').join('\n'));
      const program = ts.createProgram([verification], {target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true, skipLibCheck: true});
      const source = program.getSourceFile(verification)!, checker = program.getTypeChecker();
      assert.deepEqual(program.getSyntacticDiagnostics(source), []);
      assert.deepEqual(program.getSemanticDiagnostics(source), []);
      for (const statement of source.statements) {
        assert(ts.isTypeAliasDeclaration(statement));
        const expected = targets.get(statement.name.text.replace('Check_', ''))!;
        const resolved: string[] = [];
        const visit = (node: any) => {
          if (ts.isImportTypeNode(node)) {
            const symbol = checker.getTypeFromTypeNode(node).getSymbol();assert(symbol);
            const declarations = symbol.declarations;assert.equal(declarations.length, 1);
            const owner = declarations[0].getSourceFile();assert.equal(program.getSourceFile(owner.fileName), owner);
            resolved.push(owner.fileName);
          }
          ts.forEachChild(node, visit);
        };
        visit(statement.type);assert.deepEqual(resolved, expected.map(path => join(root, path)));
      }
    }
    assert.deepEqual(results[0], results[1]);
    const declaration = results[0].manifest.modules.find((module: any) => module.path === 'components/sample.ts').declarations[0];
    const type = (name: string) => declaration.members.find((member: any) => member.name === name).type.text;
    assert.equal(type('value'), 'import("../model.js").Value');
    assert.equal(type('nested'), '{ value: import("../model.js").Value; values: import("../model.js").Value[]; }');
    assert.equal(type('authored'), "import('../model.js').Value");
    assert.equal(type('text'), '"import(\\"/not-a-module\\")"');
    assert.equal(type('dependency'), "import('sample-dependency').DependencyValue");
    assert.equal(type('generated'), 'import("./.generated/model.js").Value');
    assert.equal(type('shared'), 'import("./..shared/model.js").Value');
    assert.equal(results[0].events[0].detail, 'import("../model.js").Value');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('the source adapter preserves Lit state encapsulation and public concrete overrides', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-cem-test-'));
  try {
    await symlink(fileURLToPath(new URL('../../node_modules', import.meta.url)), join(directory, 'node_modules'), 'dir');
    await writeFile(join(directory, 'base.ts'), `
      import { LitElement } from 'lit';
      export class Base extends LitElement {
        static properties = { internal: { state: true }, applicationValue: { attribute: false }, coordination: { attribute: 'internal-state' } };
        private internal = true;
        /** @internal Coordination across library classes only. */
        coordination = 'closed';
        /** @internal Owned child callback. */
        coordinate() {}
        applicationValue = 'value';
        protected get placement(): string { return 'end'; }
      }
    `);
    await writeFile(join(directory, 'child.ts'), `
      import { Base } from './base.js';
      /** @tag en-sample-child */
      export class Child extends Base {
        static properties = { ...Base.properties, placement: { type: String, reflect: true, noAccessor: true } };
        override get placement(): 'start' | 'end' { return 'end'; }
        override set placement(value: 'start' | 'end') {}
      }
    `);
    const result = await generateCem({ sourceRoot: directory, sources: ['base.ts', 'child.ts'] });
    const snapshot = snapshotCem(result.manifest);
    const child = snapshot.elements.get('en-sample-child')!;
    assert.equal(child.surfaces.has('attribute:internal'), false);
    assert.equal(child.surfaces.has('attribute:applicationValue'), false);
    assert.equal(child.surfaces.has('property:internal'), false);
    assert.equal(child.surfaces.has('attribute:internal-state'), false);
    assert.equal(child.surfaces.has('property:coordination'), false);
    assert.equal(child.surfaces.has('method:coordinate'), false);
    const placement = child.surfaces.get('property:placement')!.value as any;
    assert.equal(placement.privacy, 'public');
    assert.equal(placement.type.text, "'start' | 'end'");
    assert.equal(placement.readonly, undefined);
    const declaration = result.manifest.modules.find((module: any) => module.path === 'child.ts').declarations[0];
    assert.equal(declaration.superclass.module, 'base.ts');
    assert.equal(result.receipt.corrections.length > 0, true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('package source selection excludes tests, fixtures, declarations, config and generated outputs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-cem-selection-'));
  try {
    const files = ['src/item/element.ts', 'src/item/template.ts', 'src/catalog.ts', 'src/tests/test.ts', 'src/fixtures/fixture.ts',
      'src/item.test.ts', 'src/item.browser.spec.ts', 'src/item-fixture.ts', 'src/item.config.ts', 'src/item.d.ts', 'dist/item.ts'];
    for (const file of files) { await mkdir(join(directory, file, '..'), { recursive: true }); await writeFile(join(directory, file), ''); }
    assert.deepEqual(await discoverElementSources(directory), ['src/catalog.ts', 'src/item/element.ts', 'src/item/template.ts']);
    await writeFile(join(directory, 'src/catalog.ts'), "export const definitions = [{ tagName: 'en-sample', elementClass: Sample }] as const;");
    assert.deepEqual(await readCatalogDefinitions(directory), [{ tagName: 'en-sample', className: 'Sample' }]);
    await writeFile(join(directory, 'src/catalog.ts'), 'export const definitions = computeDefinitions();');
    await assert.rejects(() => readCatalogDefinitions(directory));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('the actual package CEM includes every intended catalog tag from production sources', async () => {
  const root = new URL('../../packages/elements/', import.meta.url).pathname;
  const result = await generateElements(root);
  const coverage = result.receipt.coverage;
  assert.equal(coverage.emittedTagCount, coverage.intendedTagCount);
  assert.equal(coverage.intendedTagCount > 0, true);
  assert.deepEqual(coverage.missingTags, []);
  assert.deepEqual(coverage.unexpectedTags, []);
  assert.deepEqual(coverage.mismatchedClasses, []);
  assert.equal(result.receipt.manifestDigest, digestJson(result.manifest));
  assert.equal(snapshotCem(result.manifest).elements.size, coverage.intendedTagCount);
});

test('painted controls inherit medium-default size metadata while selection descriptors leave sizing to their parent', async () => {
  const result = await generateElements(new URL('../../packages/elements/', import.meta.url).pathname);
  const size = result.receipt.coverage.sharedContracts.size!;
  assert.equal(size.baseClass, 'EnElement');
  assert.equal(JSON.parse(size.default), 'medium');
  assert.equal(size.elements.length, result.receipt.coverage.intendedTagCount);
  for (const element of size.elements) {
    if (['en-select-option', 'en-segmented-item', 'en-progress-step', 'en-choice-option'].includes(element.tagName)) {
      assert.equal(element.property, false, element.tagName);
      assert.equal(element.attribute, false, element.tagName);
      continue;
    }
    assert.equal(element.property, true, element.tagName);
    assert.equal(element.attribute, true, element.tagName);
    assert.equal(element.inheritsBase, true, element.tagName);
    assert.equal(element.documented, true, element.tagName);
    assert.equal(element.matchesBaseType, true, element.tagName);
    assert.equal(element.matchesBaseDefault, true, element.tagName);
  }
  const alias = result.receipt.literalTypeAliases.find((alias: any) => alias.name === 'ElementSize' && alias.module === size.source);
  assert.deepEqual(alias.values, ['inherit', 'small', 'medium', 'large']);
  assert.equal(alias.exported, true);
  const labels = result.receipt.coverage.sharedContracts.namedLabelSlotTags;
  assert.deepEqual(labels, [
    'en-accordion-item', 'en-badge', 'en-button', 'en-checkbox', 'en-color-field', 'en-color-slider', 'en-combobox', 'en-command-palette', 'en-date-input', 'en-date-picker', 'en-dialog',
    'en-drawer', 'en-file-upload', 'en-hover-card', 'en-media-viewer', 'en-number-field', 'en-otp-field', 'en-popover', 'en-radio', 'en-radio-group', 'en-rating', 'en-rich-text-editor', 'en-search-input',
    'en-segmented-control', 'en-select', 'en-sheet', 'en-slider', 'en-swatch', 'en-switch', 'en-text-field', 'en-textarea', 'en-time-field', 'en-toggle-button', 'en-token-editor', 'en-tree-item',
  ]);
});

test('retained CEM verification rejects changed sources and mismatched evidence without rewriting', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-cem-receipt-'));
  try {
    await mkdir(join(directory, 'src'));
    const source = "/** @tag en-sample */ export class Sample extends HTMLElement {}";
    await writeFile(join(directory, 'src/sample.ts'), source);
    await writeFile(join(directory, 'src/catalog.ts'), "import { Sample } from './sample.js'; export const definitions = [{ tagName: 'en-sample', elementClass: Sample }] as const;");
    const result = await generateElements(directory, {checkTagTypes:false});
    const output = join(directory, 'custom-elements.json');
    await writeFile(output, JSON.stringify(result.manifest));
    await writeFile(`${output}.receipt.json`, JSON.stringify(result.receipt));
    assert.equal((await verifyGeneratedElements(directory)).emittedTags, 1);
    // Identical source/CEM bytes must not make an incomplete or altered compiler
    // receipt reusable. Each mutation is independently restored before the next.
    for (const alter of [
      (receipt: any) => { receipt.schemaVersion = 1; },
      (receipt: any) => { receipt.kind = 'cem-generation-candidate'; },
      (receipt: any) => { delete receipt.compiler; },
      (receipt: any) => { receipt.compiler.effective.version = '0.0.0'; },
      (receipt: any) => { receipt.packages['@wc-toolkit/cem-generator'].distributionDigest = 'sha256:altered'; },
      (receipt: any) => { receipt.policy.validation.exportTypes = 'off'; },
      (receipt: any) => { receipt.lit = false; },
      (receipt: any) => { receipt.parserVersion = '0.0.0'; },
      (receipt: any) => { receipt.analyzer.name = '@custom-elements-manifest/analyzer'; },
      (receipt: any) => { receipt.analyzer.version = '0.0.0'; },
    ]) {
      const receipt = structuredClone(result.receipt); alter(receipt);
      const bytes = JSON.stringify(receipt);
      await writeFile(`${output}.receipt.json`, bytes);
      await assert.rejects(() => verifyGeneratedElements(directory));
      assert.equal(await readFile(output, 'utf8'), JSON.stringify(result.manifest));
      assert.equal(await readFile(`${output}.receipt.json`, 'utf8'), bytes);
    }
    // An unchanged manifest must still authenticate the complete enrichment receipt.
    const alteredEnrichment = structuredClone(result.receipt);
    alteredEnrichment.customization.enrichment.inputManifestDigest = 'sha256:altered';
    const alteredEnrichmentBytes = JSON.stringify(alteredEnrichment);
    await writeFile(`${output}.receipt.json`, alteredEnrichmentBytes);
    await assert.rejects(() => verifyGeneratedElements(directory), /^Error: CEM customization enrichment receipt changed; regenerate the CEM\.$/);
    assert.equal(await readFile(output, 'utf8'), JSON.stringify(result.manifest));
    assert.equal(await readFile(`${output}.receipt.json`, 'utf8'), alteredEnrichmentBytes);
    await writeFile(`${output}.receipt.json`, JSON.stringify(result.receipt));
    await writeFile(`${output}.receipt.json`, JSON.stringify({ ...result.receipt, customization: { ...result.receipt.customization, registryDigest: 'stale-registry' } }));
    await assert.rejects(() => verifyGeneratedElements(directory), /customization contract metadata is stale/);
    await writeFile(`${output}.receipt.json`, JSON.stringify(result.receipt));
    await writeFile(join(directory, 'src/sample.ts'), `${source}\nexport const changed = true;`);
    await assert.rejects(() => verifyGeneratedElements(directory));
    await writeFile(join(directory, 'src/sample.ts'), source);
    await writeFile(output, JSON.stringify({ ...result.manifest, readme: 'Changed after generation' }));
    await assert.rejects(() => verifyGeneratedElements(directory));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('source-authored internal event visibility preserves public event types', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'en-event-metadata-'));
  try {
    await symlink(fileURLToPath(new URL('../../node_modules', import.meta.url)), join(directory, 'node_modules'), 'dir');
    await writeFile(join(directory, 'package.json'), JSON.stringify({name:'event-metadata',private:true}));
    await writeFile(join(directory, 'sample.ts'), `
      import { LitElement } from 'lit';
      /**
       * @tag en-event-metadata
       * @internalEvent en-private-coordination
       * @fires {CustomEvent<{status: string}>} en-status - Noncancelable status.
       */
      export class EventMetadata extends LitElement {
        notify() {
          this.dispatchEvent(new Event('en-private-coordination'));
          this.dispatchEvent(new CustomEvent('en-status', {detail: {status:'loaded'}}));
        }
      }
    `);
    const {manifest} = await generateCem({sourceRoot: directory, sources:['sample.ts']});
    const declaration = manifest.modules.flatMap((module:any) => module.declarations ?? []).find((entry:any) => entry.name === 'EventMetadata');
    assert.equal(declaration.events.find((event:any) => event.name === 'en-private-coordination').privacy, 'private');
    assert.match(declaration.events.find((event:any) => event.name === 'en-status').type.text, /CustomEvent/);
    assert.notEqual(declaration.events.find((event:any) => event.name === 'en-status').privacy, 'private');
  } finally { await rm(directory, {recursive:true,force:true}); }
});


test('API-06 metadata retains slots and publishes canonical surfaces and shared token hooks', async () => {
  const {manifest} = await generateElements(new URL('../../packages/elements/', import.meta.url).pathname);
  const declarations = manifest.modules.flatMap((module:any) => module.declarations ?? []);
  const element = (tag:string):any => declarations.find((declaration:any) => declaration.tagName === tag);
  const names = (tag:string, field:string):string[] => (element(tag)[field] ?? []).map((entry:any) => entry.name).sort();
  assert.deepEqual(names('en-validation-summary','slots'), ['', 'description', 'heading']);
  const description=element('en-validation-summary').members.find((member:any)=>member.name==='description');
  assert.equal(description.type.text,'string');assert.equal(description.default,"''");
  assert.equal(element('en-validation-summary').attributes.some((attribute:any)=>attribute.name==='description'),true);
  for (const [tag,canonical,removed] of [
    ['en-command-palette','surface','base'],['en-card','content','body'],['en-pagination','base','navigation'],
    ['en-accordion-item','control','trigger'],['en-navigation','control','toggle'],
    ['en-navigation-group','control','toggle'],['en-toast-region','base','region'],
    ['en-color-wheel','editor','input'],['en-token-editor','control','editor'],['en-rich-text-editor','control','editor'],
  ]) {assert.ok(names(tag,'cssParts').includes(canonical),tag);assert.ok(!names(tag,'cssParts').includes(removed),tag);}
  const tokenHooks=(tag:string)=>names(tag,'cssProperties').filter(name=>name.startsWith('--en-editor-token-'));
  assert.deepEqual(tokenHooks('en-rich-text-editor'),tokenHooks('en-token-editor'));
  assert.ok(tokenHooks('en-rich-text-editor').includes('--en-editor-token-inline-padding'));
});


for (const mutation of ['declaration-body', 'new-resolution'] as const) test(`retained CEM rejects imported ${mutation} changes with unchanged selected sources`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'en-cem-import-freshness-'));
  try {
    await mkdir(join(root, 'src'));
    const dependency = join(root, 'node_modules', 'sample-modes');
    await mkdir(dependency, {recursive:true});
    await writeFile(join(dependency, 'package.json'), JSON.stringify({name:'sample-modes',version:'1.0.0',type:'module',exports:{'./mode.js':'./mode.js'}}));
    await writeFile(join(dependency, 'mode.d.ts'), "export type Mode = 'small' | 'large';");
    await writeFile(join(root, 'src/sample.ts'), `import type {Mode} from 'sample-modes/mode.js';
      /** @tag en-mode-sample */ export class ModeSample extends HTMLElement { mode: Mode = 'small'; }`);
    await writeFile(join(root, 'src/catalog.ts'), "import {ModeSample} from './sample.js'; export const definitions=[{tagName:'en-mode-sample',elementClass:ModeSample}] as const;");
    const {manifest,receipt} = await generateElements(root, {checkTagTypes:false});
    const output = join(root, 'custom-elements.json'), receiptFile = `${output}.receipt.json`;
    const bytes = JSON.stringify(manifest), receiptBytes = JSON.stringify(receipt);
    await writeFile(output, bytes); await writeFile(receiptFile, receiptBytes);
    await verifyGeneratedElements(root);
    // Keep dependency package version, selected sources and all retained bytes.
    // A new .ts wins a previously failed lookup ahead of the existing .d.ts.
    await writeFile(join(dependency, mutation === 'declaration-body' ? 'mode.d.ts' : 'mode.ts'), "export type Mode = 'small' | 'large' | 'auto';");
    await assert.rejects(() => verifyGeneratedElements(root), /imported declarations or resolution changed/);
    assert.equal(await readFile(output, 'utf8'), bytes);
    assert.equal(await readFile(receiptFile, 'utf8'), receiptBytes);
  } finally {await rm(root, {recursive:true,force:true});}
});

test('generated delivery policy records preserve values, deep freezing and aggregate identity', async t => {
  const definitions = await readDefinitionGraph(fileURLToPath(new URL('../../packages/elements/', import.meta.url)));
  const outputs = await deliveryMetadataOutputs(definitions);
  const directory = await mkdtemp(join(tmpdir(), 'en-delivery-policy-records-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await writeFile(join(directory, 'package.json'), JSON.stringify({type: 'module', private: true}));
  // Evaluate only generated inert data with the real freezing helper. No element,
  // profile factory, loader or registry module is imported by this fixture.
  const freezeSource = await readFile(new URL('../../packages/elements/src/internal/delivery-data.ts', import.meta.url), 'utf8');
  await writeFile(join(directory, 'delivery-data.js'), stripTypeScriptTypes(freezeSource));
  await writeFile(join(directory, 'delivery-policy.js'), stripTypeScriptTypes(outputs['src/internal/delivery-policy.ts']!));
  const generated = await import(pathToFileURL(join(directory, 'delivery-policy.js')).href);
  const simpleProfile = (profile: typeof deliveryPolicy.profiles[number]) => ({
    schemaVersion: deliveryPolicy.schemaVersion, id: profile.id, version: profile.version,
    initialProperties: profile.initialProperties,
  });
  assert.deepEqual(generated.deliveryProfiles, {
    eager: simpleProfile(deliveryPolicy.profiles[0]),
    datePickerSingleDeferred: simpleProfile(deliveryPolicy.profiles[1]),
  });
  assert.deepEqual(generated.deliveryFeatures, {
    datePickerCalendar: deliveryPolicy.features[0],
    commandPaletteRoot: deliveryPolicy.features[1],
  });
  for (const [aggregate, members] of [
    [generated.deliveryProfiles, [['eager', 'eagerProfilePolicy'], ['datePickerSingleDeferred', 'datePickerSingleDeferredPolicy']]],
    [generated.deliveryFeatures, [['datePickerCalendar', 'datePickerCalendarFeature'], ['commandPaletteRoot', 'commandPaletteRootFeature']]],
  ] as const) {
    for (const [key, name] of members) assert.equal(aggregate[key], generated[name], 'aggregate and selective export must share the exact record');
    const assertFrozen = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      assert.ok(Object.isFrozen(value), 'every generated nested record and array must remain frozen');
      for (const child of Object.values(value)) assertFrozen(child);
    };
    assertFrozen(aggregate);
  }
  assert.throws(() => { generated.datePickerCalendarFeature.definitionTags.push('en-unrelated'); }, TypeError);
  assert.throws(() => { generated.datePickerSingleDeferredPolicy.initialProperties[0].properties.selection = 'range'; }, TypeError);
});
