import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const output = process.env.EN_CONTENT_TEST_OUTPUT_DIR ?? '/private/tmp/en-content-breadth';
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'content.spec.ts', outputDir: resolve(output, 'artifacts'), workers: 3,
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	use: { baseURL: 'http://127.0.0.1:4395', trace: 'retain-on-failure' },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
	webServer: { command: 'node server.mjs', cwd: new URL('.', import.meta.url).pathname, url: 'http://127.0.0.1:4395/fixture', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
