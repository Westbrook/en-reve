import { expect, type Frame, type Page, type Route } from '@playwright/test';

/** Hold the real optional controller entry, without replacing code or calling app internals. */
export async function holdThemeController(page: Page, options: {
	matchesFrame?: (frame: Frame) => boolean | Promise<boolean>;
} = {}) {
	// Resolve the current optional entry through its source-mapped implementation.
	// No baked-in content hash or browser-side module import is needed.
	const manifestResponse = await page.request.get('/review-build.json');
	expect(manifestResponse.ok()).toBe(true);
	const manifest = await manifestResponse.json() as { schemaVersion: number; fingerprint: string; assets: { path: string }[] };
	expect(manifest.schemaVersion).toBe(1);
	await expect(page.locator('meta[name="en-review-build"]')).toHaveAttribute('content', manifest.fingerprint);
	const modules = manifest.assets.filter(asset => /^assets\/document-theme-[^/]+\.js$/.test(asset.path));
	const assetURLs = new Set(manifest.assets.map(asset => new URL('/' + asset.path, page.url()).href));
	const implementations: string[] = [];
	const candidates: { url: string; source: string }[] = [];
	try {
		for (const module of modules) {
			const candidateURL = new URL('/' + module.path, page.url()).href;
			const response = await page.request.get(candidateURL);
			try {
				expect(response.ok()).toBe(true);
				const source = await response.text();
				candidates.push({ url: candidateURL, source });
				const reference = /\/\/# sourceMappingURL=(\S+)/.exec(source)?.[1];
				// The optional entry may be an unmapped facade. Its implementation
				// is identified below by authored source, not the shared basename.
				if (!reference) continue;
				const mapURL = new URL(reference, candidateURL);
				expect(mapURL.origin).toBe(new URL(candidateURL).origin);
				expect(assetURLs.has(mapURL.href), 'The controller map belongs to the current build manifest').toBe(true);
				const mapResponse = await page.request.get(mapURL.href);
				try {
					expect(mapResponse.ok()).toBe(true);
					const map = await mapResponse.json() as { sources: string[] };
					if (map.sources.some(path => path.replaceAll('\\', '/').endsWith('/src/theme-review/document-theme.ts'))) implementations.push(candidateURL);
				} finally { await mapResponse.dispose(); }
			} finally { await response.dispose(); }
		}
	} finally { await manifestResponse.dispose(); }
	expect(implementations, 'The current build has one source-mapped document theme implementation').toHaveLength(1);
	const implementationURL = implementations[0]!;
	// The parent review page already imports the shared implementation. Hold the
	// optional facade awaited by preview/API documents, rather than that dependency.
	const entries = candidates.filter(candidate => {
		if (candidate.url === implementationURL) return false;
		const imports = [...candidate.source.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*(['"])([^'"]+)\2/g)]
			.filter(match => new URL(match[3]!, candidate.url).href === implementationURL)
			.flatMap(match => match[1]!.split(',').map(binding => binding.trim().split(/\s+as\s+/).at(-1)));
		return [...candidate.source.matchAll(/\bexport\s*\{([^}]+)\}(?!\s*from\b)/g)].some(match =>
			match[1]!.split(',').some(binding => {
				const [local, exported = local] = binding.trim().split(/\s+as\s+/);
				return exported === 'attachDocumentTheme' && imports.includes(local);
			}));
	});
	expect(entries, 'The current build has one optional entry forwarding the mapped document theme controller').toHaveLength(1);
	const moduleURL = entries[0]!.url;

	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	const pending = new Set<Promise<void>>();
	const failures: unknown[] = [];
	let captured = 0;
	let returned = 0;
	const pattern = moduleURL;
	const healthy = () => {
		if (failures.length) throw new AggregateError(failures, 'Theme controller transport interception failed.');
	};
	const intercept = async (route: Route) => {
		const frame = route.request().frame();
		const matches = options.matchesFrame ? await options.matchesFrame(frame) : frame === page.mainFrame();
		if (!matches) { await route.continue(); return; }
		const response = await route.fetch();
		captured++;
		await gate;
		// Preserve the served status, headers and body; only transport timing changes.
		await route.fulfill({ response });
		returned++;
	};
	const handler = (route: Route) => {
		const operation = intercept(route).catch(async error => {
			failures.push(error);
			await route.abort('failed').catch(() => {});
		}).finally(() => { pending.delete(operation); });
		pending.add(operation);
		return operation;
	};
	await page.route(pattern, handler);
	return {
		async waitForCaptured() {
			await expect.poll(() => { healthy(); return captured; }, { message: 'The target document requested its real theme controller' }).toBe(1);
		},
		release,
		async waitForReturned() {
			await expect.poll(() => { healthy(); return returned; }, { message: 'The held original controller response was returned' }).toBe(1);
		},
		async cleanup() {
			release();
			try { await page.unroute(pattern, handler); } catch (error) { failures.push(error); }
			// Drain released handlers even if an earlier interception failed.
			try {
				await expect.poll(() => pending.size, { message: 'All theme controller interceptions finished' }).toBe(0);
			} catch (error) { failures.push(error); }
			healthy();
		},
	};
}
