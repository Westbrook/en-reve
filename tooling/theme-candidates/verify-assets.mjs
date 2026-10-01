import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { candidateIds } from './catalogue.mjs';
import { selectAssetCandidates, assertAssetCases, assetAppearances } from './asset-selection.mjs';

// Exercise the already-built local documentation server.
// Candidate files enter through the same native picker as a human review. This
// script never injects theme CSS, reaches into the workspace model, or publishes.
const argument = name => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
const repo = resolve(argument('--repo') ?? process.env.EN_CANDIDATE_REPO ?? process.cwd());
const directory = resolve(argument('--candidates') ?? process.env.EN_CANDIDATES ?? resolve(repo, 'artifacts/theme-candidates/paired-appearances'));
const output = resolve(argument('--output') ?? process.env.EN_THEME_ASSETS_OUTPUT ?? process.env.EN_CANDIDATE_OUTPUT ?? resolve(repo, 'node_modules/.cache/en-theme-assets'));
const origin = new URL(argument('--origin') ?? process.env.EN_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:4431').origin;
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname), 'Use the existing local documentation server.');
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const { chromium, expect } = await import(pathToFileURL(resolve(repo, 'node_modules/@playwright/test/index.mjs')).href);
const { positionFramedTarget } = await import(pathToFileURL(resolve(repo, 'tooling/theme-candidates/capture.mjs')).href);
const motionIds = ['duration.enter', 'duration.exit', 'ease.enter', 'ease.exit', 'motion.surface-offset', 'motion.surface-scale'];
const assetNames = ['Sparkle mark', 'Direction arrow', 'Approval check', 'Search symbol', 'Information symbol', 'Warning symbol', 'Campaign brief', 'Review checklist', 'Usage notes'];
await mkdir(output, { recursive: true });
const receipt = {
	schemaVersion: 1, createdAt: new Date().toISOString(), status: 'running', origin, inputDirectory: directory,
	scriptHash: hash(await readFile(new URL(import.meta.url))), engine: 'chromium',
	scope: `${candidateIds.length} exported theme pairs, each light and dark, reopened through native Theme Review file intake. Exact build and source identity, applied brand paint, nine native asset choices, retained layout nodes, Preview focus return, captured insertion and baseline isolation. Installed Chromium only; no physical-device, manual AT, visual equivalence or prior-version claim.`,
	motionScope: 'Candidate JSON pins, resolved values and computed root CSS are recorded. Popup animation behavior is not exercised by this asset workflow. Interaction context requests reduced motion.',
	screenshotScope: 'One actual candidate iframe viewport per theme and appearance, positioned at the selected asset card. The crop is a visible portion of the nine-item collection, not a full-collection screenshot or visual-diff approval.',
	cases: [],
};
const save = () => writeFile(resolve(output, 'verification.json'), `${JSON.stringify(receipt, null, 2)}\n`);
await save();

function motionEvidence(bundle, mode) {
	const resolved = Object.fromEntries(motionIds.map(id => {
		const token = bundle.resolvedTokens[mode][id];
		assert.ok(token?.cssName, `${mode} resolves ${id}`);
		return [id, token];
	}));
	return { authoredEdits: bundle.draft.branches[mode].edits.filter(edit => motionIds.includes(edit.id)), resolved };
}

// Canvas normalizes browser computed CSS and the exported structured sRGB token
// to the same byte representation. This checks declared paint, not glyph pixels.
async function brandPaint(frame, expectedToken, expectedTextToken) {
	assert.equal(expectedToken.type, 'color');
	assert.equal(expectedToken.value.colorSpace, 'srgb', 'This fixture expects its exported sRGB brand values.');
	assert.equal(expectedTextToken.type, 'color');
	assert.equal(expectedTextToken.value.colorSpace, 'srgb');
	const expectedCSS = `color(srgb ${expectedToken.value.components.join(' ')} / ${expectedToken.value.alpha ?? 1})`;
	const expectedTextCSS = `color(srgb ${expectedTextToken.value.components.join(' ')} / ${expectedTextToken.value.alpha ?? 1})`;
	const measured = await frame.locator('.wordmark').evaluate((wordmark, input) => {
		const doc = wordmark.ownerDocument, view = doc.defaultView;
		const canvas = doc.createElement('canvas'); canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
		const rgba = color => {
			if (!view.CSS.supports('color', color)) throw new Error(`Invalid measured CSS color: ${color}`);
			// Canvas may accept CSS.supports() syntax yet ignore an unresolved light-dark()
			// assignment. Resolve it in this actual theme/appearance before conversion.
			const probe = doc.createElement('span');
			probe.style.cssText = 'display:none'; probe.style.color = color;
			wordmark.append(probe);
			const resolved = view.getComputedStyle(probe).color;
			probe.remove();
			context.fillStyle = '#010203'; context.fillStyle = resolved;
			const first = context.fillStyle;
			context.fillStyle = '#040506'; context.fillStyle = resolved;
			if (context.fillStyle !== first) throw new Error(`Canvas rejected resolved color: ${resolved}`);
			context.clearRect(0, 0, 1, 1); context.fillRect(0, 0, 1, 1);
			return [...context.getImageData(0, 0, 1, 1).data];
		};
		const text = wordmark.querySelector('span:last-child');
		const mark = wordmark.querySelector('.mark');
		if (!text || !mark) throw new Error('The actual themed wordmark is missing.');
		const tokenCSS = view.getComputedStyle(doc.documentElement).getPropertyValue(input.cssName).trim();
		const textCSS = view.getComputedStyle(text).color, markCSS = view.getComputedStyle(mark).backgroundColor;
		const describe = node => {
			if (!node) return null;
			const style = view.getComputedStyle(node);
			return { element: node.localName, colorScheme: style.colorScheme, color: style.color,
				brand: style.getPropertyValue(input.cssName).trim(), transitionProperty: style.transitionProperty,
				transitionDuration: style.transitionDuration };
		};
		return { cssName: input.cssName, expectedCSS: input.expectedCSS, expectedTextCSS: input.expectedTextCSS, textTokenCSSName: input.textCSSName, tokenCSS, textCSS, markCSS,
			cascade: { root: describe(doc.documentElement), body: describe(doc.body), app: describe(wordmark.closest('en-workflows-app')),
				header: describe(wordmark.closest('.site-header')), wordmark: describe(wordmark), text: describe(text), mark: describe(mark) },
			expectedRGBA: rgba(input.expectedCSS), expectedTextRGBA: rgba(input.expectedTextCSS), textTokenRGBA: rgba(view.getComputedStyle(doc.documentElement).getPropertyValue(input.textCSSName).trim()), tokenRGBA: rgba(tokenCSS), textRGBA: rgba(textCSS), markRGBA: rgba(markCSS) };
	}, { cssName: expectedToken.cssName, expectedCSS, textCSSName: expectedTextToken.cssName, expectedTextCSS });
	return measured;
}

async function checkPreviewIdentity(page, frame, baseline, manifest, candidate, mode) {
	await expect.poll(() => page.evaluate(() => {
		const value = window.themeAssetsReceipt;
		return value ? { sourceHash: value.sourceHash, buildFingerprint: value.buildFingerprint, appearance: value.appearance, effectiveMode: value.effectiveMode, pageId: value.pageId } : null;
	}), { timeout: 30_000 }).toEqual({ sourceHash: candidate.bundle.draft.pairSourceHash, buildFingerprint: manifest.buildFingerprint, appearance: mode, effectiveMode: mode, pageId: 'assets' });
	const handshake = await page.evaluate(() => window.themeAssetsReceipt);
	assert.ok(handshake.caseIds.includes('assets'), 'The acknowledged rendered case is the asset workflow.');
	for (const preview of [frame, baseline]) {
		await expect(preview.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
		await expect(preview.locator('html')).toHaveAttribute('data-en-appearance', mode);
		await expect(preview.locator('meta[name="en-review-build"]')).toHaveAttribute('content', manifest.buildFingerprint);
		await expect(preview.locator('[data-workflow]')).toHaveCount(1);
		await expect(preview.locator('[data-workflow="assets"]')).toBeVisible();
	}
	return handshake;
}

async function assetJourney({ page, frame, iframe, baseline, item }) {
	const scene = frame.locator('[data-workflow="assets"]');
	const group = scene.getByRole('group', { name: 'Choose one asset', exact: true });
	const collection = group.getByRole('list', { name: 'Available assets', exact: true });
	const radio = group.getByRole('radio', { name: 'Campaign brief', exact: true });
	const button = name => scene.getByRole('button', { name, exact: true });
	// Reset via the workflow's public command between appearances; switching the
	// candidate alone must not be mistaken for resetting this application state.
	const reset = frame.getByRole('button', { name: 'Reset asset browser workflow', exact: true });
	await reset.click();
	await expect(collection.getByRole('listitem')).toHaveCount(9);
	await expect(group.getByRole('radio')).toHaveCount(9);
	await expect(group.getByRole('radio', { checked: true })).toHaveCount(0);
	for (const name of assetNames) await expect(group.getByRole('radio', { name, exact: true })).toBeVisible();
	await positionFramedTarget(page, iframe, radio);
	await radio.focus(); await radio.press('Space'); await expect(radio).toBeChecked();
	await expect(scene.locator('[data-assets-selected]')).toHaveText('Campaign brief · campaign-brief');
	const original = await radio.evaluateHandle(node => ({ radio: node, card: node.closest('.en-file-card'), item: node.closest('li'), list: node.closest('ul'), document: node.ownerDocument }));
	try {
		const view = scene.locator('en-segmented-control[label="View"]');
		for (const name of ['List', 'Grid']) {
			const option = view.getByRole('radio', { name, exact: true });
			await option.focus(); await option.press('Space'); await expect(option).toBeChecked();
			await expect(collection).toHaveAttribute('data-layout', name.toLowerCase());
			await expect(radio).toBeChecked();
			assert.equal(await radio.evaluate((node, initial) => node === initial.radio && node.closest('.en-file-card') === initial.card && node.closest('li') === initial.item && node.closest('ul') === initial.list && node.ownerDocument === initial.document, original), true, `${name} retains native radio, card, list item, list and document.`);
		}
		const opener = button('Preview Campaign brief');
		await positionFramedTarget(page, iframe, opener); await opener.click();
		await expect(scene.getByRole('heading', { name: 'Preview: Campaign brief', exact: true })).toBeFocused();
		await expect(scene.locator('aside')).toBeVisible();
		await expect(scene.locator('aside')).toHaveAccessibleName('Preview: Campaign brief');
		await button('Close preview').click();
		await expect(opener).toBeFocused(); await expect(scene.locator('aside')).toBeHidden();
		await button('Insert selected asset').click();
		await expect(scene.locator('[data-assets-receipt]')).toHaveText('Insertion 1: Campaign brief · campaign-brief', { timeout: 10_000 });
		await expect(scene.locator('[data-assets-status]')).toHaveText('Campaign brief inserted locally. Insertion 1.');
		await expect(radio).toBeChecked();
		await expect(baseline.getByRole('group', { name: 'Choose one asset', exact: true }).getByRole('radio', { checked: true })).toHaveCount(0);
		await expect(baseline.locator('[data-assets-receipt]')).toHaveText('No asset inserted.');
		await expect(baseline.getByRole('list', { name: 'Available assets', exact: true }).getByRole('listitem')).toHaveCount(9);
		item.journey = { assetCount: 9, selectedId: await radio.inputValue(), layouts: ['list', 'grid'], nativeNodesRetained: true, previewFocusedHeading: true, closeRestoredOpener: true, insertion: await scene.locator('[data-assets-receipt]').innerText(), baselineUnselected: true, baselineInsertionAbsent: true };
		const card = radio.locator('xpath=ancestor::li[1]');
		await positionFramedTarget(page, iframe, card);
		const screenshot = resolve(output, `${item.candidate}-${item.appearance}-assets-viewport.png`);
		await iframe.screenshot({ path: screenshot, animations: 'disabled' });
		item.screenshot = { path: screenshot, sha256: hash(await readFile(screenshot)), scope: 'Candidate iframe viewport, positioned at selected Campaign brief card', iframe: await iframe.boundingBox(), nativeCard: await card.boundingBox() };
		item.geometry = await scene.evaluate(node => ({ viewport: node.ownerDocument.documentElement.clientWidth, content: node.ownerDocument.documentElement.scrollWidth }));
		assert.ok(item.geometry.content <= item.geometry.viewport + 1, 'The themed asset page has no horizontal overflow in its actual review iframe.');
	} finally { await original.dispose(); }
}

let browser;
try {
	const manifestBytes = await readFile(resolve(directory, 'manifest.json'));
	const manifest = JSON.parse(manifestBytes);
	receipt.buildFingerprint = manifest.buildFingerprint;
	receipt.candidateManifestHash = hash(manifestBytes);
	const selected = selectAssetCandidates(manifest.candidates, candidateIds, argument('--ids') ?? process.env.EN_CANDIDATE_IDS);
	receipt.selection = selected.map(candidate => candidate.id);
	receipt.scope = receipt.scope.replace(`${candidateIds.length} exported`, `${selected.length} selected exported`);
	receipt.expectedCases = selected.length * assetAppearances.length;
	const candidates = [];
	for (const entry of selected) {
		const file = resolve(directory, entry.file);
		assert.ok(file.startsWith(directory + sep), 'Candidate paths stay in the prepared artifact directory.');
		const bytes = await readFile(file), bundle = JSON.parse(bytes);
		assert.equal(hash(bytes), entry.fileHash, `${entry.id} candidate file hash`);
		assert.equal(bundle.schema, 'en-reve/local-theme-review'); assert.equal(bundle.schemaVersion, 2);
		assert.equal(bundle.draft.schema, 'en-reve/theme-review-pair'); assert.equal(bundle.draft.schemaVersion, 1);
		assert.equal(bundle.build.fingerprint, manifest.buildFingerprint);
		assert.equal(bundle.draft.pairSourceHash, entry.pairSourceHash);
		for (const mode of assetAppearances) {
			assert.equal(bundle.draft.branches[mode].candidate.theme.mode, mode);
			assert.equal(bundle.draft.branches[mode].candidate.candidateSourceHash, entry.branches[mode].sourceHash);
		}
		candidates.push({ ...entry, file, bundle });
	}
	const executablePath = process.env.EN_CANDIDATE_CHROMIUM_EXECUTABLE;
	browser = await chromium.launch(executablePath ? { executablePath } : {});
	receipt.browser = browser.version();
	const buildContext = await browser.newContext();
	try {
		const response = await buildContext.request.get(`${origin}/review-build.json`);
		assert.equal(response.ok(), true, 'The current build manifest is served.');
		const bytes = await response.body(), served = JSON.parse(bytes);
		assert.equal(hash(bytes), manifest.buildManifestHash, 'The served review-build bytes match the candidate preparation manifest.');
		assert.equal(served.fingerprint, manifest.buildFingerprint, 'The served build is exactly the candidate build.');
		assert.ok(served.pages.some(page => page.id === 'assets' && page.caseIds.includes('assets')), 'The exact build registers the assets review page.');
		receipt.servedBuild = { fingerprint: served.fingerprint, manifestHash: hash(bytes), assetsPage: served.pages.find(page => page.id === 'assets') };
	} finally { await buildContext.close(); }
	for (const candidate of candidates) {
		const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, colorScheme: 'light', reducedMotion: 'reduce' });
		const page = await context.newPage();
		page.setDefaultTimeout(12_000); page.setDefaultNavigationTimeout(30_000);
		const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
		let setupError;
		try {
			await page.addInitScript(() => window.addEventListener('message', event => {
				const iframe = document.querySelector('iframe[title="Candidate preview"]');
				if (event.origin === location.origin && event.source === iframe?.contentWindow && event.data?.type === 'en-theme-preview-ready') window.themeAssetsReceipt = event.data;
			}));
			await page.goto(`${origin}/theme-review?progress-report`);
			await expect(page.locator('meta[name="en-review-build"]')).toHaveAttribute('content', manifest.buildFingerprint);
			await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
			await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles(candidate.file);
			await expect(page.getByRole('textbox', { name: 'Candidate title', exact: true })).toHaveValue(candidate.bundle.draft.title);
			await page.getByRole('combobox', { name: 'Preview page', exact: true }).selectOption('assets');
			await page.getByRole('combobox', { name: 'Preview appearance', exact: true }).selectOption('editing');
			await page.getByRole('button', { name: 'Load previews', exact: true }).click();
		} catch (error) { setupError = error; }
		try {
			const iframe = page.locator('iframe[title="Candidate preview"]');
			const frame = page.frameLocator('iframe[title="Candidate preview"]');
			const baseline = page.frameLocator('iframe[title="Baseline preview"]');
			for (const mode of assetAppearances) {
				const item = { candidate: candidate.id, appearance: mode, file: basename(candidate.file), fileHash: candidate.fileHash, pairSourceHash: candidate.bundle.draft.pairSourceHash, branchSourceHash: candidate.branches[mode].sourceHash, status: 'failed', motion: motionEvidence(candidate.bundle, mode) };
				try {
					if (setupError) throw setupError;
					await page.getByRole('combobox', { name: 'Editing appearance', exact: true }).selectOption(mode);
					item.previewReceipt = await checkPreviewIdentity(page, frame, baseline, manifest, candidate, mode);
					item.brand = await brandPaint(frame, candidate.bundle.resolvedTokens[mode]['color.brand'], candidate.bundle.resolvedTokens[mode]['color.action-text']);
					// Keep the measured cascade in the receipt even if an assertion fails.
					for (const key of ['tokenRGBA', 'markRGBA']) {
						assert.ok(item.brand[key].every((value, index) => Math.abs(value - item.brand.expectedRGBA[index]) <= 1), `${key} must paint the candidate's exported brand color.`);
					}
					// The brand mark and accessible wordmark link intentionally use different tokens.
					for (const key of ['textTokenRGBA', 'textRGBA']) assert.ok(item.brand[key].every((value, index) => Math.abs(value - item.brand.expectedTextRGBA[index]) <= 1), `${key} must paint the candidate's exported action-text color.`);
					item.motion.computedCSS = await frame.locator('html').evaluate((root, entries) => Object.fromEntries(entries.map(([id, token]) => [id, getComputedStyle(root).getPropertyValue(token.cssName).trim()])), Object.entries(item.motion.resolved));
					await assetJourney({ page, frame, iframe, baseline, item });
					assert.deepEqual(pageErrors, [], 'No uncaught runtime error occurred in the imported-pair journey.');
					item.status = 'passed';
				} catch (error) {
					item.error = error?.stack ?? String(error); item.pageErrors = [...pageErrors];
					await page.screenshot({ path: resolve(output, `${candidate.id}-${mode}-failure.png`) }).catch(() => {});
				}
				receipt.cases.push(item); await save();
				console.log(`${candidate.id} ${mode}: ${item.status}`);
			}
		} finally { await context.close(); }
	}
	assertAssetCases(receipt.cases, candidates);
	receipt.status = 'passed';
} catch (error) {
	receipt.status = 'failed'; receipt.error = error?.stack ?? String(error);
} finally {
	await browser?.close(); receipt.completedAt = new Date().toISOString(); await save();
}
console.log(`${receipt.status}: ${receipt.cases.filter(item => item.status === 'passed').length}/${receipt.expectedCases ?? 0} theme/appearance journeys; ${resolve(output, 'verification.json')}`);
if (receipt.status !== 'passed') process.exitCode = 1;
