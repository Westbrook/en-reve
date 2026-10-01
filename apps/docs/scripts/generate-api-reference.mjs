import { createReferenceResolver } from '../../../tooling/metadata/references.ts';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeAPIReference } from '../src/api-reference/model.ts';
import { createSourceControlTypeResolver, buildAPIElementControls } from './api-control-metadata.mjs';
import { apiControlTargets } from './api-control-targets.mjs';
import { verifyPublicGraph } from '../../../tooling/metadata/public-graph.ts';
import { validateTypeSnapshot, publicTypeContract } from '../../../tooling/releases/type-diff.ts';
import { verifyCandidatePublicArtifacts } from '../../../tooling/metadata/verify-candidate-public.ts';
import { assertCandidateWorkspace, reserveCandidateConsumerOutput } from '../../../tooling/metadata/candidate-workspace.ts';

/** The same barrel/alias resolver used by metadata and release checks. */
export function exportsClass(manifest, from, exportedName, expectedModule, className) {
 const target = createReferenceResolver(manifest)({name: exportedName, module: from}, from);
 return target?.modulePath === expectedModule && target.declaration.name === className;
}
/** Resolve exact or wildcard ESM package exports without evaluating a component. */
export function resolvePublicImport(exports, subpath) {
	let entry = exports[subpath];
	let capture;
	if (entry === undefined) {
		const matches = Object.keys(exports).filter(key => key.includes('*')).sort((a, b) => b.indexOf('*') - a.indexOf('*') || b.length - a.length);
		for (const key of matches) {
			const [prefix, suffix] = key.split('*');
			if (subpath.startsWith(prefix) && subpath.endsWith(suffix)) {
				capture = subpath.slice(prefix.length, subpath.length - suffix.length); entry = exports[key]; break;
			}
		}
	}
	const target = typeof entry === 'string' ? entry : entry?.import;
	if (typeof target !== 'string' || !target.startsWith('./') || target.split('/').includes('..')) throw new Error(`No public ESM export for ${subpath}.`);
	return capture === undefined ? target : target.replaceAll('*', capture);
}
function parse(ts, name, source) {
	const parsed = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
	if (parsed.parseDiagnostics.length) throw new Error(`Invalid TypeScript in ${name}.`);
	return parsed;
}
function unwrap(ts, value) {
	while (value && (ts.isAsExpression(value) || ts.isSatisfiesExpression(value) || ts.isParenthesizedExpression(value))) value = value.expression;
	return value;
}
function specimenRecords(ts, source) {
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'specimens') continue;
			const array = unwrap(ts, declaration.initializer);
			if (!array || !ts.isArrayLiteralExpression(array)) throw new Error('Expected explicit authored specimens.');
			return array.elements.map(element => {
				if (!ts.isObjectLiteralExpression(element)) throw new Error('Expected an authored specimen record.');
				const record = {};
				for (const property of element.properties) if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) record[property.name.text] = property.initializer.text;
				return record;
			});
		}
	}
	return [];
}
async function writeChanged(file, contents) {
	if (await readFile(file, 'utf8').catch(() => null) === contents) return false;
	await mkdir(dirname(file), { recursive: true }); await writeFile(file, contents); return true;
}
/** Build from current source receipts, real package exports and authored examples. */
export async function generateAPIReference({ workspaceRoot, outputRoot = join(workspaceRoot, 'apps/docs/src/generated') }) {
	workspaceRoot = resolve(workspaceRoot);
	const packageRoot = join(workspaceRoot, 'packages/elements');
	const { verifyGeneratedElements } = await import(pathToFileURL(join(workspaceRoot, 'tooling/metadata/generate-elements.ts')).href);
	const graph = await verifyPublicGraph(packageRoot);
	let verified;
	try { verified = await verifyGeneratedElements(packageRoot); }
	catch (error) { throw new Error(`API reference requires fresh component metadata. Run npm run metadata, then rebuild docs. ${error.message}`, { cause: error }); }
	const manifest = JSON.parse(await readFile(join(packageRoot, 'custom-elements.json'), 'utf8'));
	return renderAPIReference({workspaceRoot, outputRoot, publicRoot:join(workspaceRoot,'apps/docs/public'), manifest, graph, manifestDigest:verified.manifestDigest});
}
/** Candidate qualification writes both generated and public assets only to a fresh external directory. */
export async function generateCandidateAPIReference({workspaceRoot, bundleRoot, outputRoot}) {
	workspaceRoot = await assertCandidateWorkspace(workspaceRoot);
	outputRoot = await reserveCandidateConsumerOutput(outputRoot, workspaceRoot);
	const verified = await verifyCandidatePublicArtifacts(bundleRoot, join(workspaceRoot,'packages/elements'));
	return renderAPIReference({workspaceRoot, outputRoot:join(outputRoot,'generated'), publicRoot:join(outputRoot,'public'),
		manifest:verified.manifest, graph:verified.graph, manifestDigest:verified.receipt.manifestDigest});
}
async function renderAPIReference({workspaceRoot, outputRoot, publicRoot, manifest, graph, manifestDigest}) {
	const packageRoot = join(workspaceRoot, 'packages/elements');
	const { ts } = await import(pathToFileURL(join(workspaceRoot, 'tooling/metadata/compiler-api.mjs')).href);
	const { readAuthoredSpecimens } = await import(pathToFileURL(join(workspaceRoot, 'apps/docs/scripts/authored-specimen-sources.mjs')).href);
	const [pkg, { authoredSource: authored, sources: snippets }] = await Promise.all([
		readFile(join(packageRoot, 'package.json'), 'utf8').then(JSON.parse),
		readAuthoredSpecimens(join(workspaceRoot, 'apps/docs')),
	]);
	const specimens = specimenRecords(ts, parse(ts, 'examples.ts', authored));
	const entries = [];
	for (const definition of graph.components) {
		const sourceEntry = graph.types.entrypoints[definition.classImport];
		if (!sourceEntry?.startsWith('src/')) throw new Error(`No explicit component import for ${definition.className}.`);
		const classSubpath = `./${sourceEntry.slice(4).replace(/\.ts$/u, '.js')}`;
		const declarationModule = manifest.modules.find(module => module.declarations?.some(item => item.tagName === definition.tagName && item.name === definition.className))?.path;
		if (!declarationModule || !exportsClass(manifest, sourceEntry, definition.className, declarationModule, definition.className)) throw new Error(`CEM does not verify ${definition.className} through ${classSubpath}.`);
		const classTarget = resolvePublicImport(pkg.exports, classSubpath);
		await access(join(packageRoot, classTarget));
		const defineSubpath = `./define/${definition.tagName.slice(3)}.js`;
		const defineTarget = resolvePublicImport(pkg.exports, defineSubpath);
		await access(join(packageRoot, defineTarget));
		// Authored controls pin their primary example; adding a composition earlier
		// in the sticker sheet must not silently retarget another component's API.
		const authoredCase = apiControlTargets[definition.tagName]?.caseId;
		const containsTag = specimen => snippets[specimen.id]?.includes(`<${definition.tagName}>`) || snippets[specimen.id]?.includes(`<${definition.tagName} `) || snippets[specimen.id]?.includes(`<${definition.tagName}\n`);
		const example = authoredCase
			? specimens.find(specimen => specimen.id === authoredCase && containsTag(specimen))
			: specimens.find(containsTag);
		if (authoredCase && !example) throw new Error(`Authored API example ${authoredCase} does not contain ${definition.tagName}.`);
		entries.push({ tagName: definition.tagName, className: definition.className, classImport: pkg.name + classSubpath.slice(1), definitionImport: pkg.name + defineSubpath.slice(1),
			example: example ? { id: example.id, title: example.title, href: `/#specimen-${example.id}` } : null });
	}
	const verifiedTypes = {snapshot: graph.types, digest: graph.typeDigest};
	validateTypeSnapshot(verifiedTypes.snapshot);
	const publicTypes = Object.entries(verifiedTypes.snapshot.exports).filter(([name]) => name.startsWith(pkg.name + '#')).flatMap(([name, target]) => {
		const node = verifiedTypes.snapshot.declarations[target];
		if (!node || !['InterfaceDeclaration', 'TypeAliasDeclaration'].includes(node.kind)) return [];
		const contract = publicTypeContract(verifiedTypes.snapshot, name);
		return [{ name: name.slice(pkg.name.length + 1), declaration: contract.declarations[target].declaration }];
	});
	const data = normalizeAPIReference({ manifest, manifestDigest, packageName: pkg.name, packageVersion: pkg.version, entries });
	data.typeSnapshotDigest = verifiedTypes.digest;
	data.publicTypes = publicTypes;
	await writeChanged(join(publicRoot, 'public-api.json'), JSON.stringify(graph, null, 2) + '\n');
	await writeChanged(join(publicRoot, 'public-types.json'), JSON.stringify(verifiedTypes.snapshot, null, 2) + '\n');
	const controls = buildAPIElementControls({ reference: data, manifest, targets: apiControlTargets, resolveType: createSourceControlTypeResolver({ ts, manifest, packageRoot }) });
	const changedFiles = [];
	for (const [name, contents] of [
		['api-element-controls.js', `// Generated from source types and authored targets; do not edit.\nexport default ${JSON.stringify(controls)};\n`],
		['api-element-controls.d.ts', "import type { APIElementControls } from '../api-example/controls.js';\ndeclare const controls: Record<string, APIElementControls>;\nexport default controls;\n"],
		['api-reference.js', `// Generated from the verified Custom Elements Manifest; do not edit.\nexport default ${JSON.stringify(data)};\n`],
		['api-reference.d.ts', "import type { APIReferenceData } from '../api-reference/model.js';\ndeclare const reference: APIReferenceData;\nexport default reference;\n"],
	]) if (await writeChanged(join(outputRoot, name), contents)) changedFiles.push(join(outputRoot, name));
	return { components: data.components.length, manifestDigest: data.manifestDigest, changedFiles };
}
