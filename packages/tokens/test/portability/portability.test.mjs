import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	authorFixtures, fixtureNames, reopenFixture, rejectedMutations,
	preciseNumber, preciseDimension, preciseColor,
} from './fixtures.mjs';

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.env.EN_REVE_ROOT ?? process.cwd());
const tokenDir = resolve(process.env.TOKEN_DIST_DIR ?? join(repoRoot, 'packages/tokens/dist'));
const evidenceDir = resolve(process.env.EVIDENCE_DIR ?? join(harnessDir, 'evidence'));
const snapshotDir = join(evidenceDir, 'compiler');
const digest = text => createHash('sha256').update(text).digest('hex');
const issues = [];
const receipt = {
	schema: 'en-reve/compiler-portability-test',
	startedAt: new Date().toISOString(),
	tokenDir,
	fixtureNames,
	runtimes: {},
	authors: [],
	comparisons: [],
	replays: [],
	mutations: [],
	failures: issues,
	limits: ['Tests the package review model in current installed engines; no application UI or previous-browser-version claim.'],
};

function check(condition, detail) {
	if (!condition) issues.push(detail);
	return condition;
}

function precisionSurvives(summary) {
	return summary.precision.literal === preciseNumber
		&& summary.precision.alias === preciseNumber
		&& summary.precision.dimension.value === preciseDimension
		&& summary.precision.dimension.unit === 'rem'
		&& JSON.stringify(summary.precision.color) === JSON.stringify(preciseColor);
}

test('review envelopes are byte-identical and reopen in Node, Chromium, Firefox and WebKit', { timeout: 300_000 }, async () => {
	await mkdir(snapshotDir, { recursive: true });
	const files = {};
	for (const name of (await readdir(tokenDir)).filter(name => name.endsWith('.js')).sort()) {
		const source = await readFile(join(tokenDir, name), 'utf8');
		files[name] = source;
		await writeFile(join(snapshotDir, name), source);
	}
	await writeFile(join(snapshotDir, 'package.json'), '{"type":"module"}\n');
	receipt.compilerFiles = Object.fromEntries(Object.entries(files).map(([name, source]) => [name, digest(source)]));
	receipt.compilerFingerprint = digest(JSON.stringify(receipt.compilerFiles));
	receipt.harnessFiles = Object.fromEntries(await Promise.all(['fixtures.mjs', 'portability.test.mjs'].map(async name => [name, digest(await readFile(join(harnessDir, name)))])));
	const fixtureModule = await readFile(join(harnessDir, 'fixtures.mjs'), 'utf8');
	const server = createServer((request, response) => {
		const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
		response.setHeader('Cache-Control', 'no-store');
		if (pathname === '/') {
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>Token portability</title><body><p>Compiler portability fixture</p></body></html>');
		} else if (pathname === '/fixtures.mjs') {
			response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
			response.end(fixtureModule);
		} else if (pathname.startsWith('/tokens/') && Object.hasOwn(files, pathname.slice('/tokens/'.length))) {
			response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
			response.end(files[pathname.slice('/tokens/'.length)]);
		} else {
			response.writeHead(404).end();
		}
	});
	await new Promise((fulfill, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', fulfill);
	});
	const origin = `http://127.0.0.1:${server.address().port}`;
	const openedBrowsers = [];
	try {
		const api = await import(pathToFileURL(join(snapshotDir, 'index.js')).href);
		const engines = await import(pathToFileURL(join(repoRoot, 'node_modules/playwright/index.mjs')).href);
		const nodeAuthors = authorFixtures(api);
		const runtimes = [{
			name: 'node',
			authored: nodeAuthors,
			reopen: (name, entry) => reopenFixture(api, name, entry.json, entry.baseOptions),
			reject: json => rejectedMutations(api, json),
		}];
		receipt.runtimes.node = { version: process.version, platform: process.platform, architecture: process.arch };
		for (const name of ['chromium', 'firefox', 'webkit']) {
			const browser = await engines[name].launch({ headless: true });
			openedBrowsers.push(browser);
			const page = await browser.newPage();
			await page.goto(origin);
			const authored = await page.evaluate(async () => {
				const api = await import('/tokens/index.js');
				const fixtures = await import('/fixtures.mjs');
				return fixtures.authorFixtures(api);
			});
			receipt.runtimes[name] = { version: browser.version(), userAgent: await page.evaluate(() => navigator.userAgent) };
			runtimes.push({
				name, authored,
				reopen: (fixture, entry) => page.evaluate(async ({ fixture, entry }) => {
					const api = await import('/tokens/index.js');
					const fixtures = await import('/fixtures.mjs');
					return fixtures.reopenFixture(api, fixture, entry.json, entry.baseOptions);
				}, { fixture, entry }),
				reject: json => page.evaluate(async json => {
					const api = await import('/tokens/index.js');
					const fixtures = await import('/fixtures.mjs');
					return fixtures.rejectedMutations(api, json);
				}, json),
			});
		}
		for (const runtime of runtimes) {
			await mkdir(join(evidenceDir, 'authors', runtime.name), { recursive: true });
			for (const name of fixtureNames) {
				const entry = runtime.authored[name];
				await writeFile(join(evidenceDir, 'authors', runtime.name, `${name}.review.json`), entry.json);
				receipt.authors.push({ runtime: runtime.name, fixture: name, sha256: digest(entry.json), ...entry.summary, rawNearThreshold: entry.rawNearThreshold });
				const identical = digest(entry.json) === digest(nodeAuthors[name].json);
				receipt.comparisons.push({ author: runtime.name, fixture: name, byteIdenticalToNode: identical });
				check(identical, `${runtime.name} ${name} author bytes differ from Node.`);
				if (name === 'diagnostics') {
					check(entry.summary.diagnostics.some(diagnostic => diagnostic.measured > 0), `${runtime.name}: missing nonzero contrast measurement.`);
					const thresholdDiagnostic = entry.summary.diagnostics.find(diagnostic => diagnostic.tokens[0] === 'color.text' && diagnostic.tokens[1] === 'color.surface');
					check(entry.rawNearThreshold < 4.5, `${runtime.name}: the fixed near-threshold fixture is no longer below the raw threshold (${entry.rawNearThreshold}).`);
					check(thresholdDiagnostic?.measured === 4.5, `${runtime.name}: a raw ratio just below 4.5 must retain its diagnostic when its reported measurement rounds to 4.5.`);
				}
				if (name === 'authored-precision') check(precisionSurvives(entry.summary), `${runtime.name}: authored literal, alias or pin precision changed.`);
			}
		}
		for (const reader of runtimes) {
			for (const author of runtimes) {
				for (const fixture of fixtureNames) {
					const entry = author.authored[fixture];
					const result = { author: author.name, reader: reader.name, fixture };
					try {
						const reopened = await reader.reopen(fixture, entry);
						result.accepted = true;
						result.byteIdenticalReexport = digest(reopened.json) === digest(entry.json);
						result.identicalSummary = JSON.stringify(reopened.summary) === JSON.stringify(entry.summary);
						check(result.byteIdenticalReexport && result.identicalSummary, `${reader.name} reopened ${author.name}/${fixture} with changed export or identity.`);
					} catch (error) {
						result.accepted = false;
						result.error = { name: error.name, code: error.code ?? null, message: error.message };
						issues.push(`${reader.name} rejected ${author.name}/${fixture}: ${error.code ?? error.message}`);
					}
					receipt.replays.push(result);
				}
			}
			for (const result of await reader.reject(reader.authored.diagnostics.json)) {
				receipt.mutations.push({ runtime: reader.name, ...result });
				check(result.actual === result.expected, `${reader.name} ${result.name} mutation: expected ${result.expected}, received ${result.actual}.`);
			}
		}
	} finally {
		await Promise.all(openedBrowsers.map(browser => browser.close()));
		await new Promise(resolve => server.close(resolve));
		receipt.finishedAt = new Date().toISOString();
		receipt.counts = {
			authored: receipt.authors.length,
			byteIdenticalAuthors: receipt.comparisons.filter(item => item.byteIdenticalToNode).length,
			replayAttempts: receipt.replays.length,
			acceptedReplays: receipt.replays.filter(item => item.accepted).length,
			exactReexports: receipt.replays.filter(item => item.byteIdenticalReexport && item.identicalSummary).length,
			rejectedMutations: receipt.mutations.filter(item => item.actual === item.expected).length,
			failures: issues.length,
		};
		await writeFile(join(evidenceDir, 'result.json'), `${JSON.stringify(receipt, null, 2)}\n`);
		console.log(JSON.stringify({ evidence: join(evidenceDir, 'result.json'), counts: receipt.counts }));
	}
	assert.equal(receipt.replays.length, 64, 'Every author/reader/fixture combination must run.');
	assert.equal(issues.length, 0, issues.join('\n'));
});
