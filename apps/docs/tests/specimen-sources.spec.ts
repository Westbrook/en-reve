import { preparedPackages, type PreparedArchive } from '../../../tooling/evidence/packed-setup.mjs';
import { setupEnvironment, setupEnvironmentInputs } from '../../../tooling/evidence/setup-environment.mjs';
import { immutableSetup } from '../../../tooling/evidence/immutable-setup.mjs';
import { contentInventory, inventoryDigest } from '../../../tooling/evidence/setup.mjs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, realpath, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTooltipWarmup } from './copied-navigation-content-scenarios.js';
import { copiedAPIScenarios } from './copied-api-scenarios.js';
import { copiedGalleryScenarios, pendingGalleryExamples } from './copied-gallery-scenarios.js';

test.beforeEach(async ({ browser }, info) => {
 info.annotations.push({ type: 'browser-version', description: browser.version() });
});

test('displayed examples compile without unused code, retain highlighting, and load encapsulated components and native styles without a bundler', async ({ page }, testInfo) => {
	test.setTimeout(60_000);
	const output = await prepareCopiedExamples(page, testInfo);
	await verifyNativeConsumption(page, output, testInfo);
});

test('remaining complete API copies execute their application journeys against native packed modules', async ({ page }, testInfo) => {
	test.setTimeout(60_000);
	const output = await prepareCopiedExamples(page, testInfo);
	await verifyNativeConsumption(page, output, testInfo, true);
});

for (let offset = 0; offset < copiedGalleryScenarios.length; offset += 7) {
 const scenarios = copiedGalleryScenarios.slice(offset, offset + 7);
 test(`gallery consumer journeys: ${scenarios.map(item => item.id).join(', ')}`, async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const output = await prepareCopiedExamples(page, testInfo);
  await verifyNativeConsumption(page, output, testInfo, scenarios.map(item => item.id));
 });
}

async function prepareCopiedExamples(page: Page, testInfo: TestInfo): Promise<string> {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/?progress-report#navigation');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	for (const id of ['native-navigation', 'breadcrumbs', 'rhythm', 'split-view-vertical', 'command-surfaces']) {
		const disclosure = page.locator(`[data-specimen="${id}"] details`);
		const summary = disclosure.locator('summary');
		await summary.focus();
		await summary.press('Enter');
		await expect(disclosure).toHaveAttribute('open', '');
		await expect(disclosure).toHaveAttribute('data-highlighted', 'true');
		const code = disclosure.locator('pre > code');
		await expect(code).toBeVisible();
		expect(await code.evaluate(element => [...CSS.highlights.values()].some(highlight =>
			[...highlight].some(range => element.contains(range.startContainer))))).toBe(true);
		await summary.press('Enter');
	}
	// Compile the actual text a reader copies, including the maintained copy helper.
	// The compiler detects both missing dependencies and unused local bindings.
	const samples = await page.locator('[data-specimen]').evaluateAll(elements => elements.map(element => ({
		id: element.getAttribute('data-specimen')!,
		source: element.querySelector(':scope > .specimen-tools > .code-disclosure > pre > code')!.textContent!,
	})));
	const originalGallery = ['native-navigation', 'breadcrumbs', 'typography', 'card', 'combobox', 'command-surfaces'];
	expect(samples.map(sample => sample.id).sort()).toEqual([...originalGallery, ...copiedGalleryScenarios.map(item => item.id), ...pendingGalleryExamples].sort());
	await testInfo.attach('gallery-journey-inventory', { body: JSON.stringify({ qualified: [...originalGallery, ...copiedGalleryScenarios.map(item => item.id)], pending: pendingGalleryExamples }), contentType: 'application/json' });
	// Check every complete copied API module, not just its gallery snippet.
	// Comparing the rendered text with the generated source keeps the actual
	// copy surface and its registration/helper prelude inside this boundary.
	const generatedRoot = join(repository, 'apps/docs/src/generated');
	const copiedModules = (await readdir(generatedRoot)).filter(file => file.endsWith('-source.js')).sort();
	// New complete copies must acquire a consumer journey rather than silently
	// becoming compile-only examples under the existing qualification claim.
	expect(copiedModules.map(file => file.slice(0, -'-source.js'.length))).toEqual(
		['composable-chat', 'tooltip-warmup', ...copiedAPIScenarios.map(item => item.id.slice('api-'.length))].sort());
	for (const file of copiedModules) {
		const id = file.slice(0, -'-source.js'.length);
		await page.goto(`/api-examples/${id}.html?progress-report`);
		const code = page.locator('.api-example-source pre > code');
		await expect(code).toHaveCount(1);
		const source = (await code.textContent())!;
		const generated = await readFile(join(generatedRoot, file), 'utf8');
		expect(source).toBe(JSON.parse(generated.split('export default ')[1]!.trim().replace(/;$/u, '')));
		samples.push({ id: id === 'composable-chat' ? id : `api-${id}`, source });
	}
	const composable = samples.find(sample => sample.id === 'composable-chat')!;
	for (const name of ['color-picker', 'swatch', 'tab', 'tab-panel', 'tabs']) {
		expect(composable.source).toContain(`import '@en-reve/elements/define/${name}.js';`);
	}
	expect(composable.source).not.toContain('composableChatColorLoaders');
	expect(composable.source).not.toContain('composableChatColorOwnership');
	expect(composable.source).not.toContain('prepareColorControls');
	// Keep copied API modules alongside gallery samples without overwriting either.
	expect(new Set(samples.map(sample => sample.id)).size).toBe(samples.length);
	const compilerEnvironment = () => setupEnvironment();
	const archiveDirectory = testInfo.outputPath('native-package-archives');
	await mkdir(archiveDirectory, { recursive: true });
	const archives = await preparedPackages(['tokens', 'styles', 'primitives', 'elements'], archiveDirectory);
	const archiveIdentity = archives.map(({ name, integrity, shasum, setup }) => ({ name, integrity, shasum, setupKey: setup.key }));
	const identity = async () => ({ samples, archives: archiveIdentity, runtime: process.version, platform: process.platform, arch: process.arch,
		environment: inventoryDigest(setupEnvironmentInputs(compilerEnvironment())),
		files: await contentInventory(repository, ['packages', 'node_modules', 'apps/docs/tests/specimen-sources.spec.ts', 'apps/docs/tests/copied-api-scenarios.ts', 'apps/docs/tests/copied-gallery-scenarios.ts', 'apps/docs/tests/copied-presentation-scenarios.ts', 'apps/docs/tests/copied-navigation-content-scenarios.ts', 'tooling/evidence', process.execPath], (name: string) => /(^|\/)(\.cache|\.vite|artifacts|results|test-results)(\/|$)/.test(name) || name.endsWith('.tsbuildinfo')) });
	const inputs = await identity();
	const prepared = await immutableSetup({ cache: join(repository, 'node_modules/.cache/specimen-consumers'), inputs, verifyInputs: identity,
		produce: async (output: string) => {
	await mkdir(output, { recursive: true });
	await prepareNativeConsumption(output, archives, archiveDirectory);
	await mkdir(join(output, 'node_modules/@en-reve'), { recursive: true });
	for (const name of ['tokens', 'styles', 'primitives', 'elements']) {
		await symlink(join(output, 'public/packages', name), join(output, 'node_modules/@en-reve', name), 'dir');
	}
	// Only third-party dependencies may refer to the locked installation. A
	// whole-node_modules link silently substitutes workspace declarations.
	for (const name of await readdir(join(repository, 'node_modules'))) {
		if (name !== '@en-reve' && !name.startsWith('.')) await symlink(join(repository, 'node_modules', name), join(output, 'node_modules', name), 'dir');
	}
	await Promise.all(samples.map(sample => writeFile(join(output, `${sample.id}.ts`), sample.source)));
	await writeFile(join(output, 'package.json'), JSON.stringify({ type: 'module' }));
	await writeFile(join(output, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
		target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
		lib: ['ES2022', 'DOM', 'DOM.Iterable'], types: [], strict: true,
		outDir: './public/samples', noUnusedLocals: true, noUnusedParameters: true,
		noUncheckedSideEffectImports: true,
		verbatimModuleSyntax: true, skipLibCheck: true,
	}, include: ['*.ts'] }));
	let typeFiles: string;
	try {
		typeFiles = execFileSync(process.execPath, [fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url)),
			'-p', join(output, 'tsconfig.json'), '--pretty', 'false', '--listFiles'], { encoding: 'utf8', timeout: 15_000, env: compilerEnvironment() });
	} catch (error) {
		const failure = error as Error & { stdout?: string; stderr?: string };
		await testInfo.attach('copied-source-compiler-failure', { body: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}`, contentType: 'text/plain' });
		throw error;
	}
	const resolvedFiles = await Promise.all(typeFiles.trim().split('\n').map(file => realpath(file)));
	expect(resolvedFiles.some(file => file.startsWith(join(repository, 'packages') + sep))).toBe(false);
	const packedDeclarations = resolvedFiles.filter(file => file.startsWith(join(output, 'public/packages') + sep));
	expect(packedDeclarations.length).toBeGreaterThan(0);
	await writeFile(join(output, 'type-resolution.json'), JSON.stringify({ workspaceDeclarations: false,
		packedDeclarations: packedDeclarations.map(file => relative(output, file)), samples: samples.map(sample => sample.id) }));
		},
	});
	const output = prepared.directory;
	await testInfo.attach('preparation-identity', { body: JSON.stringify({ key: prepared.key, reused: prepared.reused, originatingProducer: prepared.originatingProducer, extractedSamplesDigest: inventoryDigest(samples), archives }), contentType: 'application/json' });
	await testInfo.attach('compiled-examples', { body: JSON.stringify({ count: samples.length, ids: samples.map(sample => sample.id) }), contentType: 'application/json' });
	await testInfo.attach('packed-type-resolution', { body: await readFile(join(output, 'type-resolution.json')), contentType: 'application/json' });
	await testInfo.attach('native-dependencies', { body: await readFile(join(output, 'native-dependencies.json')), contentType: 'application/json' });
	expect(errors).toEqual([]);
	return output;
}

const repository = fileURLToPath(new URL('../../../', import.meta.url));

async function filesBelow(directory: string, prefix = ''): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const name = `${prefix}${entry.name}`;
		if (entry.isDirectory()) files.push(...await filesBelow(join(directory, entry.name), `${name}/`));
		else if (entry.isFile()) files.push(`./${name}`);
	}
	return files;
}

function browserTarget(value: unknown): string | undefined {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return value.map(browserTarget).find(Boolean);
	if (!value || typeof value !== 'object') return undefined;
	for (const condition of ['browser', 'import', 'default']) {
		const target = browserTarget((value as Record<string, unknown>)[condition]);
		if (target) return target;
	}
	return undefined;
}

// Resolve only the packages' published browser exports. The native server never
// rewrites imports, transforms JS/CSS, or aliases a source TypeScript directory.
async function mapPackage(directory: string, urlRoot: string, imports: Record<string, string>) {
	const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
	const entries: Record<string, unknown> = manifest.exports && typeof manifest.exports === 'object'
		&& Object.keys(manifest.exports).some(key => key.startsWith('.'))
		? manifest.exports : { '.': manifest.exports ?? manifest.module ?? manifest.main };
	const files = await filesBelow(directory);
	for (const [key, conditions] of Object.entries(entries)) {
		const target = browserTarget(conditions);
		if (!target) continue;
		const normalized = target.startsWith('./') ? target : `./${target}`;
		const star = normalized.indexOf('*');
		if (star === -1) {
			expect(files, `${manifest.name} ${key} exists in the built package`).toContain(normalized);
			imports[key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`] = `${urlRoot}${normalized.slice(2)}`;
		} else {
			const prefix = normalized.slice(0, star);
			const suffix = normalized.slice(star + 1);
			for (const file of files) {
				if (!file.startsWith(prefix) || !file.endsWith(suffix)) continue;
				const match = file.slice(prefix.length, suffix.length ? -suffix.length : undefined);
				imports[`${manifest.name}/${key.slice(2).replace('*', match)}`] = `${urlRoot}${file.slice(2)}`;
			}
		}
	}
	return manifest;
}

async function prepareNativeConsumption(output: string, archives: PreparedArchive[], archiveDirectory: string) {
	const publicRoot = join(output, 'public');
	const imports: Record<string, string> = {};
	const dependencies = new Set<string>();
	const manifests: Array<{ name: string; version: string }> = [];
	const addDependencies = (manifest: { name: string; version: string; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }) => {
		manifests.push({ name: manifest.name, version: manifest.version });
		for (const name of Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })) {
			if (!name.startsWith('@en-reve/')) dependencies.add(name);
			else if (!archives.some(archive => archive.name === name)) throw new Error(`Missing packed dependency: ${name}`);
		}
	};
	for (const name of ['tokens', 'styles', 'primitives', 'elements']) {
		const archive = archives.find(item => item.name === `@en-reve/${name}`);
		if (!archive) throw new Error(`Missing prepared archive: ${name}`);
		const destination = join(publicRoot, 'packages', name);
		await mkdir(destination, { recursive: true });
		execFileSync('tar', ['-xzf', join(archiveDirectory, archive.filename), '-C', destination, '--strip-components=1'], { encoding: 'utf8', env: setupEnvironment(process.env, { production: false }) });
		addDependencies(await mapPackage(destination, `/packages/${name}/`, imports));
	}
	// Follow the actual package closure, including the rich editor's ProseMirror
	// dependencies. A handwritten Lit-only map masked unsupported consumers.
	for (const name of dependencies) {
		const destination = join(publicRoot, 'vendor', name);
		await cp(join(repository, 'node_modules', name), destination, { recursive: true, dereference: true });
		addDependencies(await mapPackage(destination, `/vendor/${name}/`, imports));
	}
	await writeFile(join(output, 'native-dependencies.json'), JSON.stringify({ packages: manifests, imports }));
	await mkdir(join(publicRoot, 'styles'), { recursive: true });
	for (const name of ['typography', 'table', 'radio', 'content']) {
		const stylesheet = imports[`@en-reve/styles/${name}.css`];
		if (!stylesheet) throw new Error(`Missing public stylesheet: ${name}`);
		await cp(resolve(publicRoot, `.${stylesheet}`), join(publicRoot, 'styles', `${name}.css`));
	}
	await writeFile(join(publicRoot, 'index.html'), `<!doctype html><html lang="en"><head>
		<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
		<title>Native specimen consumer</title><link rel="icon" href="data:,">
		<link rel="stylesheet" href="${imports['@en-reve/tokens/default.css']}">
		<script type="importmap">${JSON.stringify({ imports })}</script>
		<script type="module" src="/bootstrap.js"></script>
		</head><body><main id="sample"></main><section id="fields">Fields destination</section>
		<section id="sheet">Sticker sheet destination</section></body></html>`);
	await writeFile(join(publicRoot, 'bootstrap.js'), `
		import { html, render } from 'lit';
		const examples = {
			...${JSON.stringify(Object.fromEntries(copiedGalleryScenarios.map(({ id, entry, elements }) => [id, { name: entry, elements }])))},
			...${JSON.stringify(Object.fromEntries(copiedAPIScenarios.map(({ id, entry }) => [id, { name: entry, elements: [] }])))},
			'native-navigation': { name: 'nativeNavigationExample', elements: ['navigation'] },
			breadcrumbs: { name: 'breadcrumbsExample', elements: ['breadcrumbs'] },
			typography: { name: 'typographyExample', elements: ['stack'] },
			card: { name: 'cardExample', elements: ['card', 'stack', 'avatar', 'badge', 'button'] },
			combobox: { name: 'comboboxExample', elements: ['combobox', 'select', 'button'] },
			'command-surfaces': { name: 'commandSurfacesExample', elements: ['stack', 'button', 'toolbar', 'menu', 'menu-item', 'command-palette'] },
			'composable-chat': { name: 'composableChatExample', elements: [] },
			'api-tooltip-warmup': { name: 'tooltipWarmupExample', elements: [] },
		};
		const id = new URL(location.href).searchParams.get('sample');
		const example = examples[id];
		if (!example) throw new Error('Unknown example: ' + id);
		await Promise.all(example.elements.map(name => import('@en-reve/elements/define/' + name + '.js')));
		if (id === 'composable-chat' && new URL(location.href).searchParams.get('scope') === 'auto') {
			// This separate packed-component fixture never imports the copied module:
			// its eager global prelude would contaminate native scoped-registry checks.
			const { createElementScope, elementScopeCapabilities } = await import('@en-reve/elements/element-scope.js');
			const { tokenEditorDefinition } = await import('@en-reve/elements/definitions/token-editor.js');
			const colorDefinitions = await Promise.all([
				import('@en-reve/elements/definitions/color-picker.js').then(module => module.colorPickerDefinition),
				import('@en-reve/elements/definitions/swatch.js').then(module => module.swatchDefinition),
				import('@en-reve/elements/definitions/tab.js').then(module => module.tabDefinition),
				import('@en-reve/elements/definitions/tab-panel.js').then(module => module.tabPanelDefinition),
				import('@en-reve/elements/definitions/tabs.js').then(module => module.tabsDefinition),
			]);
			const scope = createElementScope({ document, registry: 'auto' });
			const closed = new URL(location.href).searchParams.get('closed') === 'true';
			class ClosedTokenEditor extends tokenEditorDefinition.elementClass {
				static shadowRootOptions = { ...tokenEditorDefinition.elementClass.shadowRootOptions, mode: 'closed' };
			}
			const definition = closed ? { ...tokenEditorDefinition, tagName: 'en-eager-closed-editor', elementClass: ClosedTokenEditor } : tokenEditorDefinition;
			scope.register([definition, ...colorDefinitions]);
			const editor = scope.createElement(definition.tagName);
			editor.id = 'scoped-color-editor'; editor.label = 'Scoped structured message';
			document.querySelector('#sample').append(editor);
			await editor.updateComplete;
			editor.registerExtension({ id: 'colors', trigger: '#', label: 'Scoped color picker',
				render: session => html\`<en-color-picker data-picker-focus label="Scoped color" show-hex editable-channels value="#5577cc" @en-change=\${event => event.stopPropagation()}></en-color-picker>
					<button type="button" @click=\${() => session.cancel()}>Cancel scoped color</button>\`,
			});
			const open = document.createElement('button');
			open.textContent = 'Open scoped color'; open.onclick = () => editor.openExtension('colors');
			document.querySelector('#sample').append(open);
			document.body.dataset.registryMode = scope.mode;
			document.body.dataset.nativeRegistry = String(elementScopeCapabilities(document).native);
			document.body.dataset.consumerKind = 'packed-eager-scope';
		} else {
			const source = await import('/samples/' + id + '.js');
			render(source[example.name](), document.querySelector('#sample'));
			document.body.dataset.consumerKind = 'copied-module';
		}
		await Promise.all([...document.querySelectorAll('*')].map(element => element.updateComplete));
		document.body.dataset.ready = id;
	`);

}
async function verifyNativeConsumption(page: Page, output: string, testInfo: TestInfo, remainingAPI: boolean | string[] = false) {
	const publicRoot = join(output, 'public');

	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
			const path = resolve(publicRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
			if (!path.startsWith(publicRoot + sep)) throw new Error('Outside fixture');
			const body = await readFile(path);
			const types: Record<string, string> = {
				'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
				'.css': 'text/css; charset=utf-8', '.json': 'application/json',
			};
			response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
			response.end(body);
		} catch {
			response.writeHead(404);
			response.end('Not found');
		}
	});
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	const errors: string[] = [];
	const stylesheets: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
	page.on('response', response => {
		if (!response.ok()) errors.push(`${response.status()} ${response.url()}`);
		if (response.request().resourceType() === 'stylesheet') {
			if (!response.headers()['content-type']?.includes('text/css')) errors.push(`Incorrect stylesheet MIME type: ${response.url()}`);
			stylesheets.push(new URL(response.url()).pathname);
		}
	});
	const evidence: { id: string; stylesheets: string[]; contract?: string }[] = [];
	try {
		const cases = Array.isArray(remainingAPI) ? remainingAPI : remainingAPI ? copiedAPIScenarios.map(item => item.id)
			: ['native-navigation', 'breadcrumbs', 'typography', 'card', 'combobox', 'command-surfaces', 'composable-chat', 'api-tooltip-warmup'];
		for (const id of cases) await test.step(id, async () => {
			stylesheets.length = 0;
			await page.goto(`${baseURL}/?sample=${id}`);
			await expect(page.locator('body')).toHaveAttribute('data-ready', id);
			if (id === 'typography' || id === 'card') {
				await expect.poll(() => stylesheets).toContain('/styles/typography.css');
			} else {
				await expect(page.locator('link[href="/styles/navigation.css"]')).toHaveCount(0);
			}
			const scenario = [...copiedAPIScenarios, ...copiedGalleryScenarios].find(item => item.id === id);
			if (scenario) {
				await expect(page.locator('body')).toHaveAttribute('data-consumer-kind', 'copied-module');
				await scenario.run(page);
                if (['rhythm', 'theme-scopes', 'family-geometry', 'loading'].includes(id)) await testInfo.attach(`copied-${id}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
			} else if (id === 'native-navigation') {
				const host = page.locator('en-navigation');
				const navigation = host.getByRole('navigation', { name: 'Explore related patterns' });
				expect(await host.evaluate(element => !!element.shadowRoot?.querySelector('nav'))).toBe(true);
				expect(await navigation.evaluate(element => element.localName)).toBe('nav');
				await expect(navigation).toHaveCSS('position', 'static');
				await expect(navigation).toHaveCSS('display', 'flex');
				await expect(navigation).toHaveCSS('flex-wrap', 'wrap');
				const link = host.getByRole('link', { name: 'Fields', exact: true });
				expect(await link.evaluate(element => element.localName)).toBe('a');
				await expect(host.locator(':scope > a')).toHaveCount(3);
				expect(await host.evaluate(element => element.shadowRoot!.querySelectorAll('a').length)).toBe(0);
				// A flex item's inline outer display is blockified by its parent.
				await expect(link).toHaveCSS('display', 'block');
				await link.focus();
				await link.press('Enter');
				await expect(page).toHaveURL(`${baseURL}/?sample=${id}#fields`);
			} else if (id === 'breadcrumbs') {
				const host = page.locator('en-breadcrumbs');
				const navigation = host.getByRole('navigation', { name: 'Pattern location' });
				expect(await host.evaluate(element => !!element.shadowRoot?.querySelector('nav'))).toBe(true);
				expect(await navigation.evaluate(element => element.localName)).toBe('nav');
				expect(await navigation.getByRole('list').evaluate(element => element.localName)).toBe('ol');
				await expect(navigation.getByRole('list')).toHaveCSS('display', 'flex');
				await expect(navigation.getByRole('list')).toHaveCSS('list-style-type', 'none');
				await expect(host.locator(':scope > [aria-current="location"]')).toHaveText('Navigation patterns');
				expect(await host.evaluate(element => element.shadowRoot!.slotAssignment)).toBe('manual');
				await expect(host.locator(':scope > a')).toHaveAttribute('href', '#sheet');
				await host.getByRole('link', { name: 'Sticker sheet' }).click();
				await expect(page).toHaveURL(`${baseURL}/?sample=${id}#sheet`);
			} else if (id === 'typography') {
				await expect(page.locator('.en-heading-large')).toHaveCSS('margin-block-start', '0px');
				await expect(page.locator('.en-heading-large')).toHaveCSS('font-size', '32px');
				await expect(page.locator('.en-body')).toHaveCSS('line-height', '24px');
				expect(await page.locator('en-stack').evaluate(element => !!element.shadowRoot)).toBe(true);
			} else if (id === 'command-surfaces') {
				// Exercise the exact compiled copy through public hosts and native interaction.
				// This consumer has no docs Reset control, example controller or bundler.
				const toolbar = page.locator('#specimen-toolbar');
				const menu = page.locator('#specimen-menu');
				const palette = page.locator('#specimen-command-palette');
				const result = page.locator('[data-command-result]');
				const preview = page.locator('[data-command-preview]');
				expect(await page.evaluate(() =>
					['stack', 'button', 'toolbar', 'menu', 'menu-item', 'command-palette']
						.every(name => Boolean(customElements.get(`en-${name}`))))).toBe(true);
				expect(await page.evaluate(() => customElements.get('en-select') === undefined)).toBe(true);
				await expect(result).toHaveText('Preview layout: Portrait.');
				await expect(toolbar.getByRole('toolbar', { name: 'Study layout actions', exact: true })).toBeVisible();
				// Authored buttons are light-DOM children, so locate them from the host.
				const portrait = toolbar.getByRole('button', { name: 'Portrait', exact: true });
				const landscape = toolbar.getByRole('button', { name: 'Landscape', exact: true });
				await portrait.focus();
				await portrait.press('ArrowRight');
				await expect(landscape).toBeFocused();
				await expect(result).toHaveText('Preview layout: Portrait.');
				await landscape.press('Enter');
				await expect(result).toHaveText('Preview layout: Landscape.');
				await expect(preview).toHaveAttribute('data-layout', 'landscape');

				const menuTrigger = page.getByRole('button', { name: 'More layout actions', exact: true });
				await menuTrigger.click();
				await expect(menu.getByRole('menu', { name: 'Study layout actions', exact: true })).toBeVisible();
				await expect(menu.getByRole('menuitem', { name: 'Publish study', exact: true })).toHaveAttribute('aria-disabled', 'true');
				await menu.getByRole('menuitem', { name: 'Portrait', exact: true }).click();
				await expect(menu).toHaveJSProperty('open', false);
				await expect(result).toHaveText('Preview layout: Portrait.');
				await expect(preview).toHaveAttribute('data-layout', 'portrait');
				await expect(menuTrigger).toBeFocused();

				const searchTrigger = page.getByRole('button', { name: 'Search layout commands', exact: true });
				const dialog = palette.getByRole('dialog', { name: 'Study commands', exact: true });
				const search = palette.getByRole('combobox', { name: 'Find a layout command', exact: true });
				await searchTrigger.click();
				await expect(dialog).toBeVisible();
				await expect(search).toBeFocused();
				await search.fill('publish');
				await expect(palette.getByRole('option', { name: 'Publish study', exact: true })).toHaveAttribute('aria-disabled', 'true');
				await search.press('Enter');
				await expect(dialog).toBeVisible();
				await expect(result).toHaveText('Preview layout: Portrait.');
				await search.fill('not-a-layout');
				await expect(palette.getByText('No matching layout commands.', { exact: true })).toBeVisible();
				await expect(palette.getByRole('option')).toHaveCount(0);
				await search.press('Escape');
				await expect(palette).toHaveJSProperty('open', false);
				await expect(searchTrigger).toBeFocused();
				await expect(result).toHaveText('Preview layout: Portrait.');
				await searchTrigger.click();
				await search.fill('wide');
				await palette.getByRole('option', { name: 'Landscape', exact: true }).click();
				await expect(palette).toHaveJSProperty('open', false);
				await expect(result).toHaveText('Preview layout: Landscape.');
				await expect(preview).toHaveAttribute('data-layout', 'landscape');
				await expect(searchTrigger).toBeFocused();
			} else if (id === 'api-tooltip-warmup') {
				await runTooltipWarmup(page);
			} else if (id === 'composable-chat') {
				const colorTags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
				await expect(page.locator('body')).toHaveAttribute('data-consumer-kind', 'copied-module');
				// The exact copied prelude registers every authored color root before interaction;
				// the editor still constructs popup controls only for an active session.
				expect(await page.evaluate(tags => tags.every(tag => Boolean(customElements.get(tag))), colorTags)).toBe(true);
				await expect(page.locator('en-color-picker')).toHaveCount(0);
				const editor = page.locator('en-token-editor');
				const field = page.getByRole('textbox', { name: 'Structured message', exact: true });
				// Pinned WebKit fill can return without input here; exercise native typing.
				await field.click();
				await expect(field).toBeFocused();
				await field.pressSequentially('Keep this draft');
				await expect(editor).toHaveJSProperty('value', 'Keep this draft');
				await page.getByRole('button', { name: 'Colors', exact: true }).click();
				const hex = page.getByRole('textbox', { name: 'Hex color', exact: true });
				const picker = page.locator('en-color-picker');
				await expect(hex).toBeVisible();
				await hex.fill('#123456');
				await hex.press('Enter');
				await expect(picker).toHaveJSProperty('value', '#123456');
				await hex.fill('#a');
				await hex.press('Enter');
				await expect(hex).toHaveValue('#a');
				await expect(picker).toHaveJSProperty('value', '#123456');
				const draftInput = await hex.elementHandle();
				await page.locator('en-composable-chat-demo').evaluate(async element => {
					type UpdatingElement = HTMLElement & { requestUpdate(): void; updateComplete: Promise<unknown> };
					const demo = element as UpdatingElement;
					const editor = demo.shadowRoot!.querySelector<UpdatingElement>('en-token-editor')!;
					demo.requestUpdate(); editor.requestUpdate();
					await Promise.all([demo.updateComplete, editor.updateComplete]);
				});
				await expect(hex).toHaveValue('#a');
				await expect(hex).toBeFocused();
				expect(await hex.evaluate((input, original) => input === original, draftInput)).toBe(true);
				await draftInput?.dispose();
				await page.getByRole('button', { name: 'Cancel', exact: true }).click();
				await expect(picker).toHaveCount(0);
				await expect(editor).toHaveJSProperty('value', 'Keep this draft');
				await expect(field.locator('[data-token]')).toHaveCount(0);
				await expect(field).toBeFocused();
			} else if (id === 'combobox') {
				const input = page.getByRole('combobox', { name: 'Project', exact: true });
				await input.fill('South');
				await input.press('ArrowDown');
				await expect(input).toHaveAttribute('aria-expanded', 'true');
				await expect(page.getByRole('option', { name: 'Studio South', exact: true })).toBeVisible();
				await input.press('Enter');
				await expect(input).toHaveValue('Studio South');
				await page.getByRole('button', { name: 'Use project', exact: true }).click();
				await expect(page.locator('output')).toHaveText('Submitted project: studio-south');
			} else {
				await expect(page.locator('.en-metadata')).toHaveCSS('margin-block-start', '0px');
				await expect(page.locator('.en-metadata')).toHaveCSS('font-size', '13px');
				await expect(page.getByRole('button', { name: 'Open study' })).toBeVisible();
				expect(await page.locator('en-card').evaluate(element => !!element.shadowRoot)).toBe(true);
			}
			if (id === 'native-navigation' || id === 'breadcrumbs') expect(stylesheets).not.toContain('/styles/navigation.css');
			if (id === 'content-recipes' || id === 'authored-table') {
				expect(stylesheets).toContain('/styles/radio.css');
				expect(stylesheets).toContain(`/styles/${id === 'content-recipes' ? 'content' : 'table'}.css`);
			}
			evidence.push({ id, stylesheets: [...stylesheets], ...(scenario ? { contract: scenario.contract } : {}) });
		});
		// Independently consume pure packed definitions in an eager automatic scope.
		// Record native versus global fallback without emulating it; this fixture does
		// not exercise a copied application directive or optional code acquisition.
		for (const closed of remainingAPI ? [] : [false, true]) {
			await page.goto(`${baseURL}/?sample=composable-chat&scope=auto&closed=${closed}`);
			await expect(page.locator('body')).toHaveAttribute('data-ready', 'composable-chat');
			await expect(page.locator('body')).toHaveAttribute('data-consumer-kind', 'packed-eager-scope');
			const nativeRegistry = await page.locator('body').getAttribute('data-native-registry') === 'true';
			await expect(page.locator('body')).toHaveAttribute('data-registry-mode', nativeRegistry ? 'scoped' : 'global');
			expect(await page.evaluate(() => ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs']
				.every(tag => customElements.get(tag) === undefined))).toBe(nativeRegistry);
			const editor = page.locator('#scoped-color-editor');
			expect(await editor.evaluate(element => {
				const root = (element as HTMLElement & { renderRoot: ShadowRoot & { customElementRegistry?: CustomElementRegistry | null } }).renderRoot;
				const registry = 'customElementRegistry' in root ? root.customElementRegistry : customElements;
				return { allColorRegistered: ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'].every(tag => Boolean(registry?.get(tag))),
					pickerAbsent: root.querySelector('en-color-picker') === null };
			})).toEqual({ allColorRegistered: true, pickerAbsent: true });
			await page.getByRole('button', { name: 'Open scoped color', exact: true }).click();
			await expect.poll(() => editor.evaluate(element => {
				const root = (element as HTMLElement & { renderRoot: ShadowRoot }).renderRoot;
				const picker = root.querySelector<HTMLElement & { renderRoot: ShadowRoot }>('en-color-picker');
				const hexField = picker?.renderRoot?.querySelector<HTMLElement & { renderRoot: ShadowRoot }>('[part~="hex-field"]');
				const input = hexField?.renderRoot?.querySelector<HTMLInputElement>('input[part~="control"]');
				return Boolean(input && !input.disabled && [...(input.labels ?? [])].some(label => label.textContent?.trim() === 'Hex color')
					&& input.checkVisibility({ visibilityProperty: true })
					&& input.getBoundingClientRect().width && input.getBoundingClientRect().height);
			})).toBe(true);
			if (!closed) await expect(page.getByRole('textbox', { name: 'Hex color', exact: true })).toBeVisible();
			const registryUse = await editor.evaluate(element => {
				const root = (element as HTMLElement & { renderRoot: ShadowRoot & { customElementRegistry?: CustomElementRegistry | null } }).renderRoot;
				const registry = 'customElementRegistry' in root ? root.customElementRegistry : customElements;
				const picker = root.querySelector('en-color-picker')!;
				return {
					closedRoot: element.shadowRoot === null && root.mode === 'closed',
					rootHasRegistry: Boolean(registry),
					ownedPicker: picker.constructor === registry?.get('en-color-picker'),
					allColorRegistered: ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'].every(tag => Boolean(registry?.get(tag))),
					globalAbsent: ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'].every(tag => customElements.get(tag) === undefined),
				};
			});
			expect(registryUse).toEqual({ closedRoot: closed, rootHasRegistry: true, ownedPicker: true, allColorRegistered: true, globalAbsent: nativeRegistry });
			await testInfo.attach(`eager-color-registry-${closed ? 'closed' : 'open'}`, { body: JSON.stringify({ consumer: 'packed-eager-definitions', requestedRegistry: 'auto', actualRegistry: nativeRegistry ? 'scoped' : 'global', nativeRegistry, ...registryUse }), contentType: 'application/json' });
		}
		expect(errors).toEqual([]);
		await testInfo.attach('native-consumption', { body: JSON.stringify({ bundler: false, examples: evidence }), contentType: 'application/json' });
	} finally {
		await testInfo.attach('native-consumption-diagnostics', { body: JSON.stringify({ completed: evidence.map(item => item.id), errors }), contentType: 'application/json' });
		await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
	}
}
