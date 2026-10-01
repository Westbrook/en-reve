import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const outputRoot = process.env.EN_ADOPTED_STYLES_OUTPUT_DIR ?? resolve(root, 'artifacts/adopted-styles');
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'adopted-styles.spec.ts', fullyParallel: true,
	outputDir: resolve(outputRoot, 'traces'),
	reporter: [['list'], ['json', { outputFile: resolve(outputRoot, 'playwright.json') }]],
	use: { baseURL: 'http://127.0.0.1:4461', trace: 'retain-on-failure' },
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
		{ name: 'firefox', use: { browserName: 'firefox' } },
		{ name: 'webkit', use: { browserName: 'webkit' } },
	],
	webServer: { command: 'node packages/ssr/tests/adopted-styles/server.mjs', cwd: root,
		url: 'http://127.0.0.1:4461/fixture', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
