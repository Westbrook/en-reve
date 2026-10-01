import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run from the repository after its production build. This script only consumes
// generated routes and an already-running server; it never builds or publishes.
const workspace = resolve(process.env.EN_API_SMOKE_WORKSPACE ?? process.cwd());
const baseURL = process.env.EN_API_SMOKE_BASE_URL;
if (!baseURL) throw new Error('Set EN_API_SMOKE_BASE_URL to the existing production fixture server.');
const output = resolve(process.env.EN_API_SMOKE_OUTPUT_DIR ?? resolve(workspace, 'node_modules/.cache/en-reve-api-examples'));
const require = createRequire(resolve(workspace, 'package.json'));
const { chromium, firefox, webkit } = require('playwright');
const { default: cases } = await import(pathToFileURL(resolve(workspace, 'apps/docs/src/generated/api-example-pages.js')).href);
assert.ok(Array.isArray(cases) && cases.length > 0, 'The generated example route inventory must be nonempty.');
assert.equal(new Set(cases.map(example => example.id)).size, cases.length, 'Generated case IDs must be unique.');
await mkdir(output, { recursive: true });

// Observe native browser state rather than inspecting generated HTML strings.
function facts() {
	const app = document.querySelector('en-api-example-app');
	const specimen = app?.querySelector('[data-specimen]');
	const statefulTags = new Set(['en-text-field', 'en-textarea', 'en-search-input', 'en-date-input', 'en-number-field', 'en-select', 'en-combobox', 'en-checkbox', 'en-radio', 'en-switch', 'en-slider', 'en-rating', 'en-segmented-control']);
	const elements = [...(specimen?.querySelectorAll('*') ?? [])].filter(element => element.localName.startsWith('en-'));
	// The select's private empty reset sentinel is not a catalogue choice.
	// Keep every authored option, including disabled/hidden choices with a public Part.
	const privateResetOption = option => option.value === '' && option.disabled && option.hidden && !option.hasAttribute('part');
	const fields = elements.filter(element => statefulTags.has(element.localName)).map(element => ({
		tag: element.localName,
		controls: [...(element.shadowRoot?.querySelectorAll('input,textarea,select') ?? [])].map(control => ({
			tag: control.localName, type: control.type, value: control.value,
			checked: control.localName === 'input' && ['radio', 'checkbox'].includes(control.type) ? control.checked : null,
			disabled: control.disabled,
			options: control.localName === 'select' ? [...control.options].filter(option => !privateResetOption(option)).map(option => ({ value: option.value, label: option.label, disabled: option.disabled })) : null,
		})),
	}));
	return {
		caseId: document.body.dataset.exampleId,
		specimens: [...document.querySelectorAll('[data-specimen]')].map(element => element.dataset.specimen),
		ssr: app?.hasAttribute('data-ssr') ?? null,
		fields,
		privateResetOptions: elements.filter(element => element.localName === 'en-select').map(element => [...(element.shadowRoot?.querySelector('select')?.options ?? [])].filter(privateResetOption).map(option => ({ value: option.value, disabled: option.disabled, hidden: option.hidden, selected: option.selected, controlValue: option.parentElement.value }))),
		upgrades: elements.map(element => ({ tag: element.localName, upgraded: element.constructor === customElements.get(element.localName) })),
		collections: elements.filter(element => ['en-select', 'en-combobox', 'en-segmented-control'].includes(element.localName)).map(element => {
			const childTag = element.localName === 'en-select' ? 'en-select-option' : element.localName === 'en-segmented-control' ? 'en-segmented-item' : null;
			const children = [...element.children].filter(child => child.localName === childTag).map(child => ({
				value: child.getAttribute('value'), label: child.textContent.trim() || child.getAttribute('label') || '',
				disabled: child.hasAttribute('disabled'), selected: child.hasAttribute('selected'), checked: child.hasAttribute('checked'),
			}));
			const nativeChoices = element.localName === 'en-select'
				? [...(element.shadowRoot?.querySelector('select')?.options ?? [])].filter(option => !privateResetOption(option))
				: [...(element.shadowRoot?.querySelectorAll('input[type="radio"]') ?? [])];
			return {
				tag: element.localName, value: element.value,
				items: Array.isArray(element.items) ? element.items.map(item => ({ value: item.value, label: item.label, disabled: Boolean(item.disabled) })) : null,
				children, nativeChoices: nativeChoices.map(choice => ({ value: choice.value, disabled: choice.disabled })),
			};
		}),
		accordion: [...(specimen?.querySelectorAll('en-accordion') ?? [])].map(element => ({ value: element.value, open: [...element.querySelectorAll('en-accordion-item')].filter(item => item.open).map(item => item.value) })),
		radios: [...(specimen?.querySelectorAll('en-radio-group') ?? [])].map(element => ({ value: element.value, checked: [...element.querySelectorAll('en-radio')].filter(item => item.checked).map(item => item.value) })),
	};
}
const results = [];
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
	const browser = await type.launch();
	const offline = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
	const online = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } });
	try {
		for (const example of cases) {
			const row = { browser: name, version: browser.version(), id: example.id, path: example.path, expectedTags: example.tags, passed: false, errors: [] };
			const pages = [];
			const started = performance.now();
			try {
				assert.ok(Array.isArray(example.tags), `${example.id}: expected tags must be generated explicitly.`);
				const server = await offline.newPage(); pages.push(server);
				const serverResponse = await server.goto(example.path, { waitUntil: 'load', timeout: 15000 });
				assert.equal(serverResponse?.status(), 200, `${example.id}: SSR route must return 200.`);
				row.ssr = await server.evaluate(facts);
				assert.equal(row.ssr.caseId, example.id);
				assert.deepEqual(row.ssr.specimens, [example.id]);
				assert.equal(row.ssr.ssr, true, `${example.id}: the exact example must already be server-rendered.`);
				await server.close();

				const client = await online.newPage(); pages.push(client);
				client.on('pageerror', error => row.errors.push(`pageerror: ${error.message}`));
				client.on('console', message => { if (message.type() === 'error') row.errors.push(`console.error: ${message.text()}`); });
				client.on('response', response => { if (response.status() >= 400) row.errors.push(`HTTP ${response.status()}: ${response.url()}`); });
				client.on('requestfailed', request => row.errors.push(`requestfailed: ${request.url()}: ${request.failure()?.errorText}`));
				const clientResponse = await client.goto(example.path, { waitUntil: 'load', timeout: 15000 });
				assert.equal(clientResponse?.status(), 200);
				await client.waitForFunction(tags => {
					const app = document.querySelector('en-api-example-app');
					return app?.hasUpdated === true && !app.hasAttribute('data-ssr') && tags.every(tag => Boolean(customElements.get(tag)));
				}, example.tags, { timeout: 15000 });
				await client.evaluate(async () => {
					const app = document.querySelector('en-api-example-app');
					for (let turn = 0; turn < 4; turn++) {
						await app.updateComplete;
						await Promise.all([...app.querySelectorAll('*')].map(element => element.updateComplete));
						await new Promise(requestAnimationFrame);
					}
				});
				row.hydrated = await client.evaluate(facts);
				assert.equal(row.hydrated.caseId, example.id);
				assert.deepEqual(row.hydrated.specimens, [example.id]);
				assert.equal(row.hydrated.ssr, false);
				assert.ok(row.hydrated.upgrades.every(element => element.upgraded), `${example.id}: every present authored custom element must upgrade.`);
				for (const state of [row.ssr, row.hydrated]) for (const options of state.privateResetOptions) {
					assert.ok(options.length <= 1, `${example.id}: at most one private reset option per select.`);
					for (const option of options) assert.ok(!option.selected || option.controlValue === '', `${example.id}: a reset sentinel cannot replace a nonempty accepted value.`);
				}
				assert.deepEqual(row.hydrated.fields, row.ssr.fields, `${example.id}: native initial form state must survive hydration.`);
				for (const [index, collection] of row.hydrated.collections.entries()) {
					if (collection.children.length) {
						assert.deepEqual(collection.children, row.ssr.collections[index].children, `${example.id}: authored ${collection.tag} descriptors must survive hydration.`);
						assert.ok(collection.children.every(child => typeof child.value === 'string' && typeof child.label === 'string' && !child.selected && !child.checked), `${example.id}: descriptors supply values and labels, not selection state.`);
						assert.deepEqual(collection.nativeChoices, collection.children.map(({ value, disabled }) => ({ value, disabled })), `${example.id}: native ${collection.tag} choices must reflect its authored child values and availability.`);
					} else {
						assert.ok(collection.items?.length > 0, `${example.id}: ${collection.tag} without authored children must receive its property-only items.`);
						assert.ok(collection.items.every(item => typeof item.value === 'string' && typeof item.label === 'string'));
					}
				}
				for (const accordion of row.hydrated.accordion) assert.deepEqual([...accordion.value].sort(), [...accordion.open].sort(), `${example.id}: accordion value must agree with open children.`);
				for (const group of row.hydrated.radios) assert.deepEqual(group.checked, [group.value], `${example.id}: radio-group value must agree with its checked child.`);
				assert.deepEqual(row.errors, [], `${example.id}: browser hydration and asset loading must not report errors.`);
				row.passed = true;
			} catch (error) {
				row.failure = { message: error.message, stack: error.stack };
				const last = pages.at(-1);
				if (last && !last.isClosed()) await last.screenshot({ path: resolve(output, `${name}-${example.id}.png`), fullPage: true }).catch(() => {});
			} finally {
				await Promise.all(pages.filter(page => !page.isClosed()).map(page => page.close()));
				row.durationMs = Math.round(performance.now() - started);
				results.push(row);
				process.stdout.write(`${row.passed ? 'PASS' : 'FAIL'} ${name} ${example.id}${row.failure ? `: ${row.failure.message}` : ''}\n`);
				await writeFile(resolve(output, 'results.json'), JSON.stringify({ baseURL, generatedCases: cases.length, scope: 'Production DOM/SSR/hydration smoke in installed desktop browser engines; not physical device or manual assistive-technology verification.', results }, null, 2));
			}
		}
	} finally { await offline.close(); await online.close(); await browser.close(); }
}
const failed = results.filter(result => !result.passed);
process.stdout.write(`${results.length - failed.length}/${results.length} cases passed across three engines.\n`);
if (failed.length) process.exitCode = 1;
