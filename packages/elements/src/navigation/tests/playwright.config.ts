import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = process.env.EN_NAVIGATION_ELEMENTS_TEST_OUTPUT_DIR ?? fileURLToPath(new URL('./results/', import.meta.url));
const port = Number(process.env.EN_NAVIGATION_ELEMENTS_TEST_PORT ?? 4395);
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'navigation.spec.ts', outputDir: resolve(output, 'artifacts'),
	fullyParallel: false, workers: 1, timeout: 25_000, expect: { timeout: 8_000 },
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
		name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
	})),
	webServer: {
		command: 'node server.mjs', cwd: fileURLToPath(new URL('.', import.meta.url)),
		url: `http://127.0.0.1:${port}/fixture`, reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
