import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const outputDir = process.env.EN_SLIDER_TEST_OUTPUT_DIR ?? fileURLToPath(new URL('./results', import.meta.url));

export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: '*.spec.ts', outputDir, workers: 1,
	reporter: [['list'], ['json', { outputFile: `${outputDir}/summary.json` }]],
	use: { baseURL: 'http://127.0.0.1:4298', trace: 'retain-on-failure' },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
		name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
	})),
	webServer: {
		command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/slider/tests/vite.config.ts',
		cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
		url: 'http://127.0.0.1:4298/packages/elements/src/slider/tests/fixture.html',
		reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
