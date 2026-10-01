import test from 'node:test';
import { generateAPIExamples } from '../scripts/generate-api-examples.mjs';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm, mkdir, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exportsClass, generateAPIReference, resolvePublicImport } from '../scripts/generate-api-reference.mjs';
import { readAuthoredSpecimens } from '../scripts/authored-specimen-sources.mjs';

test('public paths honor exact export exclusions and wildcard mappings', () => {
	const exports = { './*.js': { import: './dist/*.js', types: './dist/*.d.ts' }, './private.js': null };
	assert.equal(resolvePublicImport(exports, './button.js'), './dist/button.js');
	assert.equal(resolvePublicImport(exports, './define/button.js'), './dist/define/button.js');
	assert.throws(() => resolvePublicImport(exports, './private.js'), /No public ESM export/);
	assert.throws(() => resolvePublicImport(exports, './button.css'), /No public ESM export/);
});
test('CEM class identity follows aliases and both relative and package-root references; cycles terminate', () => {
	const modules = [
		{ path: 'src/public.ts', exports: [{ kind: 'js', name: 'PublicClass', declaration: { name: 'InternalClass', module: './nested/barrel.js' } }] },
		{ path: 'src/nested/barrel.ts', exports: [{ kind: 'js', name: 'InternalClass', declaration: { name: 'InternalClass', module: 'src/nested/element.ts' } }] },
		{ path: 'src/nested/element.ts', declarations: [{ name: 'InternalClass' }] },
		{ path: 'src/cycle.ts', exports: [{ kind: 'js', name: 'Cycle', declaration: { name: 'Cycle', module: './cycle.js' } }] },
	];
	assert.equal(exportsClass({ modules }, 'src/public.ts', 'PublicClass', 'src/nested/element.ts', 'InternalClass'), true);
	assert.equal(exportsClass({ modules }, 'src/public.ts', 'Missing', 'src/nested/element.ts', 'InternalClass'), false);
	assert.equal(exportsClass({ modules }, 'src/cycle.ts', 'Cycle', 'src/nested/element.ts', 'InternalClass'), false);
});
test('current verified package generates deterministic public references and linked authored examples', async () => {
	const workspaceRoot = process.env.API_REFERENCE_WORKSPACE_ROOT ?? resolve(fileURLToPath(new URL('../../../', import.meta.url)));
	const outputRoot = await mkdtemp(join(tmpdir(), 'en-api-reference-test-'));
	try {
		const first = await generateAPIReference({ workspaceRoot, outputRoot });
		const second = await generateAPIReference({ workspaceRoot, outputRoot });
		assert.equal(first.components, second.components);
		assert.ok(first.components > 0);
		assert.deepEqual(second.changedFiles, []);
		const module = await import(new URL(`file://${join(outputRoot, 'api-reference.js')}`));
		const reference = module.default;
		const receipt = JSON.parse(await readFile(join(workspaceRoot, 'packages/elements/custom-elements.json.receipt.json'), 'utf8'));
		assert.equal(reference.manifestDigest, receipt.manifestDigest);
		const nav = reference.components.find(component => component.tagName === 'en-navigation');
		assert.equal(nav.classImport, '@en-reve/elements/navigation.js');
		assert.equal(nav.definitionImport, '@en-reve/elements/define/navigation.js');
		assert.equal(nav.sections.properties.some(row => row.name === 'items'), false);
		assert.ok(nav.sections.slots.some(row => row.name === ''));
		assert.equal(nav.example.href, '/#specimen-navigation-sidebar');
		const picker = reference.components.find(component => component.tagName === 'en-combobox');
		assert.ok(picker.sections.properties.some(row => row.name === 'items'));
		assert.ok(picker.sections.properties.some(row => row.name === 'size' && row.inheritedFrom === 'EnElement'));
		assert.equal(picker.sections.methods.some(row => row.name === 'formResetCallback'), false);
	} finally { await rm(outputRoot, { recursive: true, force: true }); }
});

test('isolated examples eagerly register their complete tag closure and emit complete copied modules', async () => {
 const workspaceRoot = process.env.API_REFERENCE_WORKSPACE_ROOT ?? resolve(fileURLToPath(new URL('../../../', import.meta.url)));
 const docsRoot = await mkdtemp(join(tmpdir(), 'en-api-examples-test-'));
 try {
  const generated = join(docsRoot, 'src/generated');
  await mkdir(generated, { recursive: true });
  await copyFile(join(workspaceRoot, 'apps/docs/src/generated/api-reference.js'), join(generated, 'api-reference.js'));
  const { sources } = await readAuthoredSpecimens(join(workspaceRoot, 'apps/docs'));
  await writeFile(join(generated, 'specimens.js'), `export default ${JSON.stringify(sources)};\n`);
  const { pages } = await generateAPIExamples({ workspaceRoot, docsRoot });
  const recipe = pages.find(page => page.id === 'content-recipes');
  assert.ok(recipe.tags.includes('en-skeleton'));
  assert.ok(recipe.definitions.includes('@en-reve/elements/define/skeleton.js'));
  assert.equal(recipe.tags.filter(tag => tag === 'en-skeleton').length, 1);
  const composable = pages.find(page => page.id === 'composable-chat');
  const colorRoots = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
  assert.equal(composable.delivery, undefined);
  assert.equal(composable.eagerTags, undefined);
  for (const tag of colorRoots) assert.ok(composable.tags.includes(tag), `composable-chat retains ${tag}`);
  const registration = tag => tag === 'en-composable-chat-demo'
   ? '../composable-chat-demo.js' : `@en-reve/elements/define/${tag.slice(3)}.js`;
  assert.deepEqual(composable.definitions, composable.tags.map(registration));
  for (const id of ['chat-patterns', 'color-picker']) {
   const page = pages.find(page => page.id === id);
   assert.equal(page.delivery, undefined);
   assert.equal(page.eagerTags, undefined);
   assert.ok(page.tags.includes('en-color-picker'));
   for (const tag of colorRoots) {
    if (id === 'chat-patterns') assert.ok(page.tags.includes(tag), `${id} retains ${tag}`);
    if (page.tags.includes(tag)) assert.ok(page.definitions.includes(registration(tag)), `${id} eagerly registers ${tag}`);
   }
  }
  const copied = (await import(pathToFileURL(join(generated, 'composable-chat-source.js')).href)).default;
  assert.equal((copied.match(/export class ComposableChatDemo\b/gu) ?? []).length, 1);
  assert.doesNotMatch(copied, /composableChatColor|prepareColorControls|createDeliveryProfile/u);
  assert.match(copied, /export const wideColorExtension\b/u);
  assert.match(copied, /label="Editor color"/u);
  for (const tag of colorRoots) {
   assert.ok(copied.includes(`import '${registration(tag)}';`), `copied source eagerly registers ${tag}`);
   assert.ok(!copied.includes(`import('@en-reve/elements/definitions/${tag.slice(3)}.js')`));
  }
  assert.doesNotMatch(copied, /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]\.\.?\//u);
  assert.doesNotMatch(copied, /import\s*\(\s*['"]\.\.?\//u);
  assert.deepEqual((await generateAPIExamples({ workspaceRoot, docsRoot })).changedFiles, []);

  const invalidRoot = join(docsRoot, 'invalid');
  const invalidGenerated = join(invalidRoot, 'src/generated');
  await mkdir(invalidGenerated, { recursive: true });
  await copyFile(join(generated, 'api-reference.js'), join(invalidGenerated, 'api-reference.js'));
  await writeFile(join(invalidGenerated, 'specimens.js'), `export default ${JSON.stringify({ ...sources,
   'composable-chat': sources['composable-chat'] + '\nconst invalid = `<en-unknown-registration></en-unknown-registration>`;',
  })};\n`);
  await assert.rejects(generateAPIExamples({ workspaceRoot, docsRoot: invalidRoot }), /No verified registration entry for en-unknown-registration in composable-chat\./u);
  assert.deepEqual(await readdir(invalidRoot), ['src']);
  assert.deepEqual((await readdir(invalidGenerated)).sort(), ['api-reference.js', 'specimens.js']);
 } finally { await rm(docsRoot, { recursive: true, force: true }); }
});
