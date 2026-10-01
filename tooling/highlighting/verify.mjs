import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4284/';
const mode = process.env.EN_REVE_HIGHLIGHT_MODE ?? 'development';
const fixture = await readFile(new URL('./fixture.txt', import.meta.url), 'utf8');
const results = [];
const html = mode === 'production' ? Buffer.from(await (await fetch(baseURL)).arrayBuffer()) : null;
const artifact = html ? { bytes: html.length, sha256: createHash('sha256').update(html).digest('hex') } : undefined;
const directory = evidenceDirectory(import.meta.url, new URL('./results/', import.meta.url));
await mkdir(directory, { recursive: true });
const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (first, second) => (Math.max(luminance(first), luminance(second)) + 0.05) / (Math.min(luminance(first), luminance(second)) + 0.05);

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
	const browser = await engine.launch();
	const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
	const errors = [];
	page.on('pageerror', error => errors.push(error.message));
	try {
		await page.goto(baseURL);
		const resourcesBefore = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
		assert.ok(resourcesBefore.every(url => !(url.includes('microlighter/') && !url.includes('.css')) && !url.includes('lit-typescript')), 'Grammar and highlighter remain deferred.');
		const tabs = page.locator('[data-specimen=tabs] .code-disclosure');
		const tabsCode = tabs.locator('pre > code');
		const tabsSource = await tabsCode.textContent();
		await tabs.locator(':scope > summary').click();
		await expect(tabs).toHaveAttribute('data-highlighted', 'true');
		const readRanges = locator => locator.evaluate(code => [...CSS.highlights].flatMap(([category, ranges]) => [...ranges].filter(range => code.contains(range.startContainer)).map(range => ({ category, text: range.toString(), start: range.startOffset, end: range.endOffset }))));
		const tabsRanges = await readRanges(tabsCode);
		assert.ok(tabsRanges.some(range => range.category === 'tag' && range.text === 'en-tabs'));
		assert.ok(tabsRanges.some(range => range.category === 'attribute-name' && range.text === 'aria-controls'));
		assert.ok(tabsRanges.some(range => range.category === 'attribute-value' && range.text === 'Inspector sections'));
		assert.equal(await tabsCode.textContent(), tabsSource);
		assert.equal(await tabsCode.locator('*').count(), 0);
		const codeColors = [];
		const pre = tabs.locator('pre');
		for (const theme of ['light', 'dark']) {
			await page.locator('en-segmented-control').getByText(theme === 'light' ? 'Light' : 'Dark', { exact: true }).click();
			await expect.poll(() => pre.evaluate(element => getComputedStyle(element).colorScheme)).toBe(theme);
			const colors = await pre.evaluate((element, categories) => ({
				background: getComputedStyle(element).backgroundColor,
				foreground: getComputedStyle(element).color,
				tokens: Object.fromEntries(categories.map(category => [category, getComputedStyle(element, `::highlight(${category})`).color])),
			}), [...new Set(tabsRanges.map(range => range.category))]);
			for (const [category, color] of Object.entries({ foreground: colors.foreground, ...colors.tokens })) {
				assert.ok(contrast(color, colors.background) >= 4.5, `${theme} ${category} text needs 4.5:1 contrast.`);
			}
			await pre.scrollIntoViewIfNeeded();
			const screenshot = `${engineName}-tabs-${theme}.png`;
			await pre.screenshot({ path: new URL(screenshot, directory).pathname });
			codeColors.push({ theme, ...colors, screenshot });
		}
		assert.ok(luminance(codeColors[1].background) < luminance(codeColors[0].background), 'Dark selection uses the dark code background.');
		assert.notEqual(codeColors[0].tokens.tag, codeColors[1].tokens.tag, 'Tag highlight colors follow the selected theme.');
		await page.locator('en-segmented-control').getByText('Light', { exact: true }).click();

		const opacity = page.locator('[data-specimen=opacity] .code-disclosure');
		await opacity.locator(':scope > summary').click();
		await expect(opacity).toHaveAttribute('data-highlighted', 'true');
		const opacityRanges = await readRanges(opacity.locator('pre > code'));
		assert.ok(opacityRanges.some(range => range.category === 'attribute-name' && range.text === '@en-change'));
		assert.ok(opacityRanges.some(range => range.category === 'storage' && range.text === 'const'));
		assert.ok((await readRanges(tabsCode)).some(range => range.category === 'tag' && range.text === 'en-tab-panel'), 'Opening another panel retains earlier highlighting.');

		await tabs.locator(':scope > summary').click();
		await tabsCode.evaluate((code, source) => {
			code.textContent = source;
			globalThis.__sourceNode = code.firstChild;
		}, fixture);
		await tabs.locator(':scope > summary').click();
		await expect.poll(async () => (await readRanges(tabsCode)).some(range => range.category === 'tag' && range.text === 'strong')).toBe(true);
		const ranges = await readRanges(tabsCode);
		const has = (category, text) => ranges.some(range => range.category === category && range.text === text);
		for (const tag of ['en-card', 'strong', 'span', 'em', 'path', 'textarea', 'script']) assert.ok(has('tag', tag), `HTML tag ${tag}`);
		for (const attribute of ['.value', '?hidden', '@click', 'label', 'data-items', 'disabled', 'role', 'data-id']) assert.ok(has('attribute-name', attribute), `Lit/HTML attribute ${attribute}`);
		for (const keyword of ['return', 'if']) assert.ok(has('keyword', keyword), `TypeScript keyword ${keyword}`);
		assert.ok(has('property', 'max'));
		assert.ok(has('numeric', '5'));
		assert.ok(has('boolean', 'true'));
		assert.ok(has('string', '"}"'));
		assert.ok(has('string', "'}'"));
		assert.ok(has('regexp', '/[}]/'));
		assert.ok(has('character-entity', '&amp;'));
		assert.ok(ranges.some(range => range.category === 'comment' && range.text.startsWith('// html')));
		const commentColors = [];
		for (const theme of ['light', 'dark']) {
			await page.locator('en-segmented-control').getByText(theme === 'light' ? 'Light' : 'Dark', { exact: true }).click();
			await expect.poll(() => pre.evaluate(element => getComputedStyle(element).colorScheme)).toBe(theme);
			const colors = await pre.evaluate(element => {
				const background = getComputedStyle(element).backgroundColor;
				const comment = getComputedStyle(element, '::highlight(comment)').color;
				// Canvas resolves modern token colors (including oklch) to sRGB pixels.
				const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
				const rgb = value => {
					context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1);
					return `rgb(${[...context.getImageData(0, 0, 1, 1).data].slice(0, 3).join(', ')})`;
				};
				return { background, comment, backgroundRGB: rgb(background), commentRGB: rgb(comment) };
			});
			assert.ok(contrast(colors.commentRGB, colors.backgroundRGB) >= 4.5, `${theme} actual comment text needs 4.5:1 contrast.`);
			commentColors.push({ theme, ...colors });
		}
		for (const text of ['fake-template', 'fake-string', 'fake-comment', 'fake-raw']) assert.ok(!has('tag', text), `Do not reinterpret ${text} as markup.`);
		assert.ok(!has('attribute-name', 'untouched'));
		const nodeState = await tabsCode.evaluate(code => ({ source: code.textContent, sameNode: code.firstChild === globalThis.__sourceNode, childCount: code.childNodes.length, elementCount: code.children.length, executed: globalThis.__highlightExecuted === true }));
		assert.deepEqual(nodeState, { source: fixture, sameNode: true, childCount: 1, elementCount: 0, executed: false });
		const rangePositions = values => values.map(({ category, start, end }) => ({ category, start, end })).sort((a, b) => a.start - b.start || a.end - b.end || a.category.localeCompare(b.category));
		const beforeReopen = rangePositions(ranges);
		await tabs.locator(':scope > summary').click();
		await tabs.locator(':scope > summary').click();
		await expect.poll(async () => (await readRanges(tabsCode)).length).toBe(ranges.length);
		assert.deepEqual(rangePositions(await readRanges(tabsCode)), beforeReopen, 'Reopening does not duplicate registered ranges.');
		assert.deepEqual(errors, []);
		results.push({ engine: engineName, passed: true, actualTabsRanges: tabsRanges.length, actualExpressionRanges: opacityRanges.length, nestedFixtureRanges: ranges.length, codeColors, commentColors, checks: ['lazy-load', 'actual-tab-markup', 'selected-light-and-dark-code-theme', 'token-foreground-contrast', 'actual-comment-contrast', 'actual-event-expression', 'multiple-open-panels', 'nested-templates-and-braces', 'Lit-binding-attributes', 'quoted-attribute-interpolation', 'ordinary-strings-comments-and-raw-text', 'unchanged-single-text-node', 'no-source-execution', 'repeat-highlight'] });
	} finally {
		await browser.close();
	}
}
await writeFile(new URL(`${mode}.json`, directory), JSON.stringify({ mode, baseURL, artifact, generatedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(JSON.stringify({ mode, results }, null, 2));
