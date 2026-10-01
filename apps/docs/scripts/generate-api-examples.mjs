import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
async function writeChanged(file, content) {
	if (await readFile(file, 'utf8').catch(() => null) === content) return false;
	await mkdir(dirname(file), { recursive: true }); await writeFile(file, content); return true;
}
async function generatedData(file) {
	const source = await readFile(file, 'utf8'); const marker = 'export default ';
	const offset = source.indexOf(marker);
	if (offset < 0) throw new Error(`Expected generated JSON module: ${file}`);
	return JSON.parse(source.slice(offset + marker.length).trim().replace(/;$/u, ''));
}
/** Call after fresh CEM/API-reference and authored specimen-source generation. */
export async function generateAPIExamples({ workspaceRoot, docsRoot = resolve(workspaceRoot, 'apps/docs') }) {
	const generatedRoot = resolve(docsRoot, 'src/generated');
	const [reference, snippets, { resolveTheme, emitThemeCSS, createThemePair, emitThemePairCSS }] = await Promise.all([
		generatedData(resolve(generatedRoot, 'api-reference.js')),
		generatedData(resolve(generatedRoot, 'specimens.js')),
		import(pathToFileURL(resolve(workspaceRoot, 'packages/tokens/dist/index.js')).href),
	]);
	const components = new Map(reference.components.map(component => [component.tagName, component]));
	const examples = new Map(reference.components.filter(component => component.example).map(component => [component.example.id, component.example]));
	// Cross-component reviews reuse the same isolated SSR/example machinery.
	examples.set('composable-chat', { id: 'composable-chat', title: 'Composable editor extensions' });
	examples.set('focus-motion', { id: 'focus-motion', title: 'Focus and motion' });
	examples.set('popup-motion', { id: 'popup-motion', title: 'Popup entry and exit' });
	examples.set('virtual-collection', { id: 'virtual-collection', title: 'Large collection review' });
	examples.set('tree-view', { id: 'tree-view', title: 'Project hierarchy' });
	examples.set('tree-data', { id: 'tree-data', title: 'Large data hierarchy' });
	examples.set('mixed-toolbar', { id: 'mixed-toolbar', title: 'Mixed editing controls' });
	examples.set('menu-choices', { id: 'menu-choices', title: 'Menu choices and submenus' });
	examples.set('content-recipes', { id: 'content-recipes', title: 'Content recipes' });
	const pages = []; const changedFiles = []; const pendingWrites = [];
	// Validate the complete catalog and registration closure before emitting any output.
	const write = async (file, value) => { pendingWrites.push({ file, value }); };
	for (const example of [...examples.values()].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
		if (!/^[a-z][a-z0-9-]*$/u.test(example.id) || typeof snippets[example.id] !== 'string') throw new Error(`Invalid authored example ${example.id}.`);
		// Conservative literal-tag closure includes conditional templates and local helpers.
		// It does not evaluate source strings or assume every component shares registration.
		const tags = [...new Set([...snippets[example.id].matchAll(/<(en-[a-z0-9-]+)(?=[\s>])/gu)].map(match => match[1]))].sort();
		// Shared tableHeader renders these library controls inside native headers.
		if (['virtual-collection','data-table'].includes(example.id)) for (const tag of ['en-button', 'en-icon']) if (!tags.includes(tag)) tags.push(tag);
		if (example.id === 'color-picker') for (const tag of ['en-token-editor', 'en-rich-text-editor', 'en-color-wheel', 'en-checkbox']) if (!tags.includes(tag)) tags.push(tag);
		// The public contentPlaceholder helper owns this tag outside the authored snippet.
		if (example.id === 'content-recipes' && !tags.includes('en-skeleton')) tags.push('en-skeleton');
		const definitions = tags.map(tag => {
			if (['en-color-spaces-demo', 'en-color-wheel-demo'].includes(tag) && example.id === 'color-picker') return '../color-spaces-demo.js';
			if (tag === 'en-sidebar-drawer-demo' && example.id === 'navigation-sidebar') return '../examples.js';
			if (tag === 'en-tooltip-position-demo' && example.id === 'tooltip-warmup') return '../examples.js';
			if (tag === 'en-virtual-collection-demo' && example.id === 'virtual-collection') return '../define-virtual-collection-demo.js';
			if (tag === 'en-composable-chat-demo' && ['chat-patterns','composable-chat'].includes(example.id)) return '../composable-chat-demo.js';
			const component = components.get(tag);
			if (!component) throw new Error(`No verified registration entry for ${tag} in ${example.id}.`);
			return component.definitionImport;
		});
		if (['virtual-collection', 'tree-data', 'calendar', 'multi-step', 'toast', 'chat-patterns', 'composable-chat', 'presence-activity', 'rich-text', 'carousel'].includes(example.id)) {
			const imports = definitions.filter(specifier => !specifier.startsWith('../')).map(specifier => `import '${specifier}';`).join('\n');
			const source = imports + '\n' + snippets[example.id];
			await write(resolve(generatedRoot, `${example.id}-source.js`), `// Generated from the live authored example and its verified registration closure.\nexport default ${JSON.stringify(source)};\n`);
			await write(resolve(generatedRoot, `${example.id}-source.d.ts`), 'declare const source: string;\nexport default source;\n');
		}
		const file = `api-examples/${example.id}.html`;
		const contentStylesheets = ['authored-table','data-table'].includes(example.id) ? '<link rel="stylesheet" href="/styles/table.css"><link rel="stylesheet" href="/styles/radio.css">' : '';
		pages.push({ id: example.id, title: example.title, file, path: `/${file}`, tags, definitions });
		await write(resolve(docsRoot, file), `<!doctype html>\n<!-- Generated by generate-api-examples.mjs; edit the authored specimen. -->\n<html lang="en" data-example-mode="auto" data-en-appearance="auto" data-example-density="comfortable"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escapeHTML(example.title)} · en-reve live example</title>\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"><link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">\n<link rel="stylesheet" href="/styles/api-example-themes.css"><link rel="stylesheet" href="/styles/navigation.css"><link rel="stylesheet" href="/styles/typography.css">${contentStylesheets}<link rel="stylesheet" href="/src/site.css"><link rel="stylesheet" href="/src/api-example/styles.css">\n</head><body data-example-id="${example.id}"><en-api-example-app></en-api-example-app><script type="module" src="/src/api-example/main.ts"></script></body></html>\n`);
	}
	await write(resolve(generatedRoot, 'api-example-definitions.js'), '// Generated verified selective definitions. No definitions are loaded until a case is selected.\nexport const exampleDefinitions = {\n' + pages.map(page => `\t${JSON.stringify(page.id)}: () => Promise.all([${page.definitions.map(specifier => `import(${JSON.stringify(specifier)})`).join(', ')}]),`).join('\n') + '\n};\n');
	await write(resolve(generatedRoot, 'api-example-definitions.d.ts'), 'export const exampleDefinitions: Record<string, () => Promise<unknown[]>>;\n');
	await write(resolve(generatedRoot, 'api-example-pages.js'), `// Generated authored example routes.\nexport default ${JSON.stringify(pages)};\n`);
	await write(resolve(generatedRoot, 'api-example-pages.d.ts'), 'declare const pages: Array<{id:string;title:string;file:string;path:string;tags:string[];definitions:string[]}>;\nexport default pages;\n');
	const links = [...pages].sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'))
		.map(page => `\t<li><a href="${escapeHTML(page.path)}">${escapeHTML(page.title)}<span>${escapeHTML(page.id)}</span></a></li>`).join('\n');
	await write(resolve(docsRoot, 'api-examples.html'), `<!doctype html>
<!-- Generated by generate-api-examples.mjs from the complete example catalog. -->
<html lang="en" data-en-appearance="auto" data-example-density="comfortable">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark">
<title>API examples · en-reve</title>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"><link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">
<link rel="stylesheet" href="/styles/api-example-themes.css"><link rel="stylesheet" href="/src/site.css"><link rel="stylesheet" href="/src/api-example/index.css">
</head><body class="api-examples-index">
<a class="examples-skip" href="#examples">Skip to examples</a>
<header class="site-header"><a class="wordmark" href="/">en-reve</a>
<nav class="header-context" aria-label="Documentation pages"><a href="/">Sticker sheet</a><a href="/showcase">Showcase</a><a href="/workflows">Workflows</a><a href="/theme-review">Theme Review</a><a href="/api-reference">API reference</a><a href="/api-examples" aria-current="page">API examples</a></nav></header>
<main id="examples" tabindex="-1"><div class="page-heading"><div><h1>API examples</h1><p class="lede">${pages.length} live examples, listed alphabetically.</p></div></div>
<ul class="examples-list">${links}</ul></main>
<footer class="site-footer"><span>en-reve · A working design system</span><a href="#examples">Back to top ↑</a></footer>
<a class="progress-return" href="http://127.0.0.1:4177" hidden>Progress Report</a>
<script type="module" src="/src/api-example/index.ts"></script></body></html>\n`);
	const themes = [];
	// Pair machinery owns Auto media rules and native color-scheme. The finite
	// bridge writes the preference, never a JavaScript-resolved system mode.
	for (const density of ['compact', 'comfortable', 'spacious']) {
		const selector = `html[data-example-density="${density}"]`;
		const pair = createThemePair({ name: `api-example-${density}`,
			light: resolveTheme({ mode: 'light', density }), dark: resolveTheme({ mode: 'dark', density }) });
		themes.push(emitThemePairCSS(pair, { selector }));
		// The authored inverse specimen is intentionally opposite its parent.
		// Explicit modes and Auto media rules use the same two resolved branches.
		const inverse = ` [data-en-theme="inverse"]`;
		const inverseDark = resolveTheme({ name: 'inverse', mode: 'dark', density });
		const inverseLight = resolveTheme({ name: 'inverse', mode: 'light', density });
		const branch = (theme, boundary) => emitThemeCSS(theme, { selector: boundary, colorScheme: true });
		themes.push(branch(inverseDark, selector + inverse));
		themes.push(branch(inverseLight, selector + '[data-en-appearance="dark"]' + inverse));
		const auto = selector + ':not([data-en-appearance="light"], [data-en-appearance="dark"])' + inverse;
		themes.push(`@media (prefers-color-scheme: dark) {\n${branch(inverseLight, auto)}\n}`);
	}
	await write(resolve(docsRoot, 'public/styles/api-example-themes.css'), themes.join('\n'));
	for (const { file, value } of pendingWrites) if (await writeChanged(file, value)) changedFiles.push(file);
	return { pages, changedFiles };
}
