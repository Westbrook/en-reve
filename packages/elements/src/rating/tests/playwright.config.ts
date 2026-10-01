import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = process.env.EN_RATING_TEST_PORT ?? '4493';
const outputDir = process.env.EN_RATING_TEST_OUTPUT_DIR ?? fileURLToPath(new URL('./results', import.meta.url));
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: '*.spec.ts', outputDir, workers: 3,
	reporter: [['list'], ['json', { outputFile: `${outputDir}/summary.json` }]],
	use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure', reducedMotion: 'reduce' },
	projects: ['chromium', 'firefox', 'webkit'].flatMap(browserName => [false, true].map(hasTouch => ({
		name: `${browserName}-${hasTouch ? 'touch' : 'pointer'}`,
		use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit', hasTouch, viewport: { width: hasTouch ? 390 : 1280, height: 844 } },
	}))),
	webServer: {
		command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/rating/tests/vite.config.ts',
		cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
		url: `http://127.0.0.1:${port}/packages/elements/src/rating/tests/fixture.html`,
		reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
