import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createDocumentStylesInliner } from '../../apps/docs/scripts/document-styles.mjs';

const document = '<!doctype html><html><head><link rel="stylesheet" href="/styles/document.css" media="screen"></head><body><p>Unchanged content</p></body></html>';
const fontFace = url => `@font-face { font-family: Fixture; src: url('${url}') format('woff2'); font-display: swap; }`;

async function fixture(t, css) {
	const directory = await mkdtemp(join(tmpdir(), 'en-document-styles-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const outputRoot = join(directory, 'dist');
	for (const path of ['styles', 'images', 'fonts/theme-references']) await mkdir(join(outputRoot, path), { recursive: true });
	await writeFile(join(outputRoot, 'styles/document.css'), css);
	// Existing disallowed targets ensure rejection is about URL policy rather
	// than an incidental missing-file error when resolving a dependency.
	for (const path of ['styles/family.woff2', 'images/foo.png', 'fonts/escape.woff2', 'fonts/theme-references/family.woff2']) {
		await writeFile(join(outputRoot, path), 'fixture asset');
	}
	await writeFile(join(outputRoot, 'fonts/theme-references/import.css'), '.imported { color: red; }');
	return { directory, outputRoot, inline: createDocumentStylesInliner({ outputRoot }) };
}

test('inlines self-hosted theme-reference fonts without rewriting the root-relative font URL', async t => {
	const css = `${fontFace('/fonts/theme-references/family.woff2')}\nbody { font-family: Fixture; }`;
	const { inline } = await fixture(t, css);
	const output = await inline(document);
	assert.ok(output.includes(`<style media="screen">${css}</style>`));
	assert.ok(output.includes("url('/fonts/theme-references/family.woff2')"));
	assert.ok(!output.includes('<link'));
	assert.ok(output.includes('<body><p>Unchanged content</p></body>'));
});

test('continues to inline dependency-free document styles exactly', async t => {
	const css = '/* preserve authored CSS */\n:root { color: #123456; }';
	const { inline } = await fixture(t, css);
	assert.equal(await inline(document), document.replace('<link rel="stylesheet" href="/styles/document.css" media="screen">', `<style media="screen">${css}</style>`));
});

for (const [label, css] of [
	['another root prefix', "body { background-image: url('/images/foo.png'); }"],
	['external fonts', fontFace('https://example.com/fonts/family.woff2')],
	['relative fonts', fontFace('family.woff2')],
	['imports even inside the allowed font directory', "@import url('/fonts/theme-references/import.css'); body { color: red; }"],
	['literal traversal out of the font directory', fontFace('/fonts/theme-references/../escape.woff2')],
	['encoded traversal out of the font directory', fontFace('/fonts/theme-references/%2e%2e/escape.woff2')],
	['encoded traversal including the path separator', fontFace('/fonts/theme-references/%2E%2E%2Fescape.woff2')],
]) {
	test(`rejects ${label}`, async t => {
		const { inline } = await fixture(t, css);
		await assert.rejects(() => inline(document));
	});
}

test('rejects a font symlink escaping the build output', async t => {
	const { directory, outputRoot, inline } = await fixture(t, fontFace('/fonts/theme-references/escaped.woff2'));
	const outsideFont = join(directory, 'outside.woff2');
	await writeFile(outsideFont, 'font outside distribution');
	await symlink(outsideFont, join(outputRoot, 'fonts/theme-references/escaped.woff2'));
	await assert.rejects(() => inline(document));
});
