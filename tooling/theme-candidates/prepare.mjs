import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createReviewDraft, createThemePair, emitThemePairCSS, stableStringify } from '@en-reve/tokens';
import { exportReviewBundle, reopenReviewBundle } from '../../apps/docs/src/theme-review/bundle.ts';
import { validateCandidateDefinitions } from './catalogue.mjs';

const { values } = parseArgs({ options: {
	'build-fingerprint': { type: 'string' },
	output: { type: 'string' },
	help: { type: 'boolean' },
} });
if (values.help) {
	console.log('node tooling/theme-candidates/prepare.mjs --build-fingerprint sha256:<reviewed-build> --output <directory>');
	process.exit(0);
}
const expectedBuild = values['build-fingerprint'];
assert.match(expectedBuild ?? '', /^sha256:[a-f0-9]{64}$/, 'Pass --build-fingerprint from the reviewed dist/review-build.json.');
assert.ok(values.output?.trim(), 'Pass --output explicitly; canonical inputs are never the default destination.');

const directory = dirname(fileURLToPath(import.meta.url));
const repository = resolve(directory, '../..');
const dist = await realpath(resolve(repository, 'dist'));
const output = resolve(process.cwd(), values.output);
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const inside = (parent, child) => {
	const path = relative(parent, child);
	return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
};
assert.ok(!inside(dist, output), '--output must be outside the distribution whose bytes bind the candidate.');

function object(value, message) {
	assert.ok(value && typeof value === 'object' && !Array.isArray(value), message);
	return value;
}
function strings(value, label) {
	assert.ok(Array.isArray(value) && value.length > 0, `${label} must be nonempty.`);
	assert.ok(value.every(item => typeof item === 'string' && item.length > 0), `${label} must contain strings.`);
	assert.equal(new Set(value).size, value.length, `${label} must not contain duplicates.`);
}
function safeRelative(path, label) {
	assert.ok(typeof path === 'string' && path.length > 0 && !path.includes('\\') && !path.includes('\0')
		&& !isAbsolute(path) && !path.startsWith('../') && path !== '..' && path !== '.' && posix.normalize(path) === path,
	`${label} must be a normalized relative path.`);
	return path;
}
const buildText = await readFile(resolve(dist, 'review-build.json'), 'utf8');
const build = object(JSON.parse(buildText), 'Invalid build manifest.');
assert.equal(build.schemaVersion, 1);
assert.equal(build.fingerprint, expectedBuild, 'The requested fingerprint must match the current distribution.');
assert.ok(Array.isArray(build.assets) && build.assets.length > 0, 'The build needs hashed assets.');
strings(build.caseIds, 'Build case IDs');
assert.ok(Array.isArray(build.pages) && build.pages.length > 0, 'The build needs review pages.');
const pageIds = new Set();
for (const page of build.pages) {
	object(page, 'Invalid review page.');
	assert.ok(typeof page.id === 'string' && page.id.length > 0 && !pageIds.has(page.id), 'Review page IDs must be unique.');
	pageIds.add(page.id);
	assert.ok(typeof page.path === 'string' && page.path.startsWith('/'), 'Review page paths must be absolute site paths.');
	strings(page.caseIds, `${page.id} case IDs`);
}
async function verifyDistribution() {
	assert.equal(await readFile(resolve(dist, 'review-build.json'), 'utf8'), buildText, 'The build manifest changed during preparation.');
	const paths = new Set();
	for (const asset of build.assets) {
		object(asset, 'Invalid distribution asset.');
		const name = safeRelative(asset.path, 'Asset path');
		assert.ok(!paths.has(name), `Repeated asset: ${name}`);
		paths.add(name);
		assert.match(asset.sha256 ?? '', /^sha256:[a-f0-9]{64}$/, `Invalid asset hash: ${name}`);
		const path = await realpath(resolve(dist, name));
		assert.ok(inside(dist, path), `Asset must remain inside dist: ${name}`);
		assert.equal(hash(await readFile(path)), asset.sha256, `Distribution asset changed: ${name}`);
	}
}
// The fingerprint precedes HTML metadata injection; final asset hashes are transport
// hashes. Do not compare fingerprint with a rehash of this final asset list.
await verifyDistribution();

const definitionsText = await readFile(resolve(directory, 'definitions.json'), 'utf8');
const definitions = validateCandidateDefinitions(JSON.parse(definitionsText));
const usedInputs = new Set();
const prepared = [];
function replay(edits, label, baseOptions) {
	assert.ok(Array.isArray(edits) && edits.length > 0, `${label} needs managed edits.`);
	const draft = createReviewDraft(baseOptions ?? {});
	for (const edit of edits) {
		object(edit, `${label}: invalid edit.`);
		if (edit.type === 'context') {
			const { type, ...context } = edit;
			draft.setContext(context);
		} else if (edit.type === 'token') {
			assert.deepEqual(Object.keys(edit).sort(), ['id', 'type', 'value'], `${label}: token edits require id/type/value.`);
			draft.setToken(edit.id, edit.value);
		} else if (edit.type === 'restore') {
			assert.deepEqual(Object.keys(edit).sort(), ['id', 'type'], `${label}: restore edits require id/type.`);
			draft.restoreToken(edit.id);
		} else throw new Error(`${label}: unexpected edit type ${edit.type}`);
	}
	return draft;
}
for (const definition of definitions) {
	object(definition, 'Invalid candidate definition.');
	assert.ok(typeof definition.title === 'string' && definition.title.trim(), `${definition.id}: title required.`);
	assert.ok(typeof definition.rationale === 'string' && definition.rationale.trim(), `${definition.id}: rationale required.`);
	assert.ok(['compact', 'comfortable', 'spacious'].includes(definition.density), `${definition.id}: expected density required.`);
	object(definition.inputs, `${definition.id}: branch inputs required.`);
	assert.deepEqual(Object.keys(definition.inputs).sort(), ['dark', 'light']);
	const drafts = {}, branches = {};
	for (const mode of ['light', 'dark']) {
		const input = safeRelative(definition.inputs[mode], 'Recipe path');
		assert.ok(!usedInputs.has(input), `Recipe repeated: ${input}`);
		usedInputs.add(input);
		const inputPath = await realpath(resolve(directory, input));
		assert.ok(inside(directory, inputPath), `Recipe leaves tooling/theme-candidates: ${input}`);
		const inputText = await readFile(inputPath, 'utf8');
		const edits = JSON.parse(inputText);
		const draft = replay(edits, `${definition.id}/${mode}`, definition.baseOptions?.[mode]);
		assert.equal(draft.theme.mode, mode, `${definition.id}: incorrect ${mode} recipe mode.`);
		assert.equal(draft.theme.density, definition.density, `${definition.id}/${mode}: incorrect density.`);
		assert.deepEqual(draft.theme.diagnostics, [], `${definition.id}/${mode}: compiler diagnostics require review.`);
		drafts[mode] = draft;
		branches[mode] = {
			mode, density: draft.theme.density, sourceHash: draft.theme.sourceHash, baseSourceHash: draft.base.sourceHash,
			input: { file: input, sha256: hash(inputText) },
			editCount: edits.length, tokenEditCount: edits.filter(edit => edit.type === 'token').length,
			aliasEditCount: edits.filter(edit => edit.type === 'token' && typeof edit.value === 'string' && edit.value.startsWith('{')).length,
			diagnostics: draft.theme.diagnostics,
		};
	}
	const pair = { name: definition.id, light: drafts.light, dark: drafts.dark };
	const resolved = createThemePair({ name: pair.name, light: pair.light.theme, dark: pair.dark.theme });
	const metadata = { title: definition.title, rationale: definition.rationale };
	const content = exportReviewBundle(pair.light, build, metadata, {}, { pair });
	const envelope = JSON.parse(content);
	assert.equal(envelope.schema, 'en-reve/local-theme-review');
	assert.equal(envelope.schemaVersion, 2, 'Paired output must use the v2 local review envelope.');
	assert.equal(envelope.activeAppearance, 'light');
	assert.equal(envelope.draft.pairSourceHash, resolved.sourceHash);
	const css = emitThemePairCSS(resolved);
	assert.equal(envelope.draft.artifacts['theme.css'], css, 'Standalone CSS must equal the reviewed paired artifact.');
	assert.equal(envelope.draft.artifactHashes.css, hash(css));
	const reopened = reopenReviewBundle(content, build);
	assert.ok(reopened.pair, 'Reopen must preserve both independently authored branches.');
	assert.equal(reopened.pair.name, pair.name);
	assert.equal(reopened.draft, reopened.pair.light);
	assert.equal(reopened.title, metadata.title);
	assert.equal(reopened.rationale, metadata.rationale);
	for (const mode of ['light', 'dark']) {
		assert.equal(reopened.pair[mode].theme.sourceHash, drafts[mode].theme.sourceHash);
		assert.equal(stableStringify(reopened.pair[mode].theme.tokens), stableStringify(drafts[mode].theme.tokens));
	}
	const reopenedTheme = createThemePair({ name: reopened.pair.name, light: reopened.pair.light.theme, dark: reopened.pair.dark.theme });
	assert.equal(reopenedTheme.sourceHash, resolved.sourceHash);
	assert.equal(emitThemePairCSS(reopenedTheme), css);
	assert.equal(exportReviewBundle(reopened.draft, build, metadata, {}, { pair: reopened.pair }), content, 'Paired Node export/reopen/export must be byte-identical.');
	prepared.push({ content, css, companion:envelope.companion, record: {
		id: definition.id, title: definition.title, file: `${definition.id}.json`, cssFile: `${definition.id}.css`,
		fileHash: hash(content), bytes: Buffer.byteLength(content), cssHash: hash(css), cssBytes: Buffer.byteLength(css),
		pairSourceHash: resolved.sourceHash, compilerVersion: resolved.compilerVersion, density: resolved.density,
		branches, reference: definition.reference,
        ...(envelope.companion ? {companion:{file:`${definition.id}.companion.css`,sha256:hash(envelope.companion.css),identity:envelope.companion.identity}} : {}),
		validation: { managedEdits: 'passed', noCompilerDiagnostics: 'passed', v2Reopen: 'passed', exactBranchTokens: 'passed', byteIdenticalReexport: 'passed', exactPairedCSS: 'passed' },
	} });
}
// Prepare/reopen every pair before writing. Recheck the bound distribution after
// compilation so a concurrent docs rebuild cannot be mistaken for this checkpoint.
await verifyDistribution();
await mkdir(output, { recursive: true });
assert.ok(!inside(dist, await realpath(output)), '--output must not resolve into dist.');
for (const item of prepared) {
	await writeFile(resolve(output, item.record.file), item.content);
	await writeFile(resolve(output, item.record.cssFile), item.css);
    if (item.companion) await writeFile(resolve(output, item.record.companion.file), item.companion.css);
}
const manifest = {
	schemaVersion: 2, preparedAt: new Date().toISOString(), status: 'prepared', compilerRuntime: 'Node',
	buildFingerprint: expectedBuild, buildManifestHash: hash(buildText),
	generator: { file: 'tooling/theme-candidates/prepare.mjs', sha256: hash(await readFile(fileURLToPath(import.meta.url))),
		catalogue: { file: 'tooling/theme-candidates/catalogue.mjs', sha256: hash(await readFile(resolve(directory, 'catalogue.mjs'))) } },
	definitions: { file: 'tooling/theme-candidates/definitions.json', sha256: hash(definitionsText) },
	inputsRoot: 'tooling/theme-candidates', reviewPath: '/theme-review',
	publication: 'Prepared artifacts are bound to this exact build; no hosted version, browser review or theme adoption is asserted.',
	validation: { distributionAssetHashes: 'passed', managedEdits: 'passed', branchModesAndDensity: 'passed', noCompilerDiagnostics: 'passed', v2RoundTrip: 'passed', pairedCSS: 'passed', browserInteraction: 'not-run', visualComparison: 'not-run', manualAccessibility: 'not-run' },
	candidates: prepared.map(item => item.record),
};
// Manifest is last: readers verify its file/CSS hashes before using a checkpoint.
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');
console.log(JSON.stringify({ output, buildFingerprint: expectedBuild, candidates: manifest.candidates }, null, 2));
